import type { LanguageModel } from "ai";
import { nanoid } from "nanoid";
import { CityNotFoundError, type ToolEvent, type Tools } from "@/lib/engine/tools";
import type { CityInfo, PlainAiCheck, Plan, PlanInput, RunEvent, Step } from "@/lib/plan/schema";
import { QlooError } from "@/lib/qloo/client";
import { runWithReceipts, type Receipt } from "@/lib/qloo/receipts";
import { AgentIncompleteError, runAgent } from "./agent";
import { runAutopilot, TooFewPartnersError, type CoreResult } from "./autopilot";
import { runPlainAi } from "./plainAi";

export type RunDeps = {
  makeTools: (onTool: (e: ToolEvent) => void) => Tools; model: LanguageModel | null; now?: () => number; newId?: () => string;
  agentDeadlineMs?: number; plainAiTimeoutMs?: number; // recordings allow longer than live requests
};

export const skippedNote = (n: number) => `${n} ${n === 1 ? "name was" : "names were"} skipped (not found, wrong match, or no audience data yet).`;

export async function runPlan(input: PlanInput, deps: RunDeps, emit: (e: RunEvent) => void): Promise<Plan | null> {
  const receipts: Receipt[] = [];
  return runWithReceipts(receipts, () => planWithin(input, deps, emit, receipts));
}

async function planWithin(input: PlanInput, deps: RunDeps, emit: (e: RunEvent) => void, receipts: Receipt[]): Promise<Plan | null> {
  const now = deps.now ?? Date.now;
  const t0 = now();
  const steps: Step[] = [];
  const step = (tool: string, message: string) => { const s = { at: now() - t0, tool, message }; steps.push(s); emit({ type: "step", step: s }); };
  try {
    const base = deps.makeTools((e) => step(e.tool, e.message));
    const tools: Tools = { ...base, scorePartners: async (x) => { const r = await base.scorePartners(x); emit({ type: "partners", partners: r.ranked, excluded: r.excluded }); return r; } };
    const s = await tools.cityStrength(input.city); // every later Qloo location query uses input.city too, so a state qualifier is never dropped
    const city: CityInfo = { name: s.locality.name, disambiguation: s.locality.disambiguation, lat: s.locality.lat, lon: s.locality.lon, badge: s.badge, cells: s.cells };
    emit({ type: "city", city });

    let core: CoreResult;
    let engine: Plan["engine"] = "agent";
    let aiDown = false; // the whole model chain just failed: don't spend another wait on the plain-AI check
    if (deps.model) {
      step("agent", "AI planner is choosing which partners to test");
      try { core = await runAgent({ input, city, tools, model: deps.model, deadlineMs: deps.agentDeadlineMs }); }
      catch (e) {
        if (!(e instanceof AgentIncompleteError)) throw e;
        const r = e.reason;
        aiDown = r instanceof Error && r.message.includes("No AI model is available");
        console.warn(`[fandrive] agent fallback: ${r instanceof Error ? `${r.name}: ${r.message}`.slice(0, 300) : "no partners scored"}`);
        step("autopilot", "AI planner unavailable, switching to autopilot (same Qloo tools, fixed order)");
        engine = "autopilot";
        core = await runAutopilot({ input, city, tools, state: e.state });
      }
    } else {
      engine = "autopilot";
      step("autopilot", "Running autopilot (no AI key configured)");
      core = await runAutopilot({ input, city, tools });
    }
    if (core.picks?.ids.length) {
      const names = core.picks.ids.map((id) => core.partners.find((p) => p.entityId === id)?.name).filter(Boolean).join(" and ");
      step("agent_picks", `AI planner picked ${names}${core.picks.rationale ? `: ${core.picks.rationale}` : ""}`);
    }
    emit({ type: "partners", partners: core.partners, excluded: core.excluded, ...(core.picks ? { picks: core.picks } : {}) });
    emit({ type: "maps", maps: core.maps });
    emit({ type: "creative", creative: core.creative });

    let plainAi: PlainAiCheck[] | null = null;
    if (deps.model && !aiDown) { // also after an agent fallback: the comparison is cheap and has its own timeout
      step("plain_ai", "Asking plain AI (no Qloo) for its picks, then fact-checking them with Qloo");
      plainAi = await runPlainAi({ input, city, tools, model: deps.model, timeoutMs: deps.plainAiTimeoutMs }).catch(() => null);
    }
    emit({ type: "plainAi", plainAi });

    const limits = [
      ...(city.badge !== "strong" ? [`Qloo data for ${city.name} is ${city.badge}; treat rankings as directional.`] : []),
      ...(core.excluded.length ? [skippedNote(core.excluded.length)] : []),
      ...(engine === "autopilot" ? ["Planned by autopilot: same Qloo data, fixed steps, template copy."] : []),
      ...(core.usedTemplate && engine === "agent" ? ["Campaign copy uses templates (AI writer unavailable)."] : []),
      "Scores describe crowd-level tendencies, not individuals. Eligibility rules vary; follow your blood service's guidance.",
    ];
    const plan: Plan = {
      id: (deps.newId ?? (() => nanoid(10)))(), createdAt: new Date(now()).toISOString(), engine, input, city,
      partners: core.partners, excluded: core.excluded, maps: core.maps, creative: core.creative, plainAi, steps, limits, agentPicks: core.picks ?? null, receipts,
    };
    emit({ type: "done", plan });
    return plan;
  } catch (e) {
    if (e instanceof CityNotFoundError) emit({ type: "error", code: "city_not_found", message: `We couldn't find "${input.city}" in Qloo. Try the full name, e.g. "Houston, TX".` });
    else if (e instanceof TooFewPartnersError) emit({ type: "error", code: "too_few_partners", message: `${e.message}. Try a larger nearby city or add well-known partners.` });
    else if (e instanceof QlooError && e.kind === "rate_limited") emit({ type: "error", code: "rate_limited", message: "The taste-data service is busy. Try an example city or retry in a minute." });
    else if (e instanceof QlooError) emit({ type: "error", code: "upstream", message: "The taste-data service had a problem. Please retry." });
    else emit({ type: "error", code: "internal", message: "Something went wrong while planning." });
    return null;
  }
}
