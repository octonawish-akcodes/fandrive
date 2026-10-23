import type { LanguageModel } from "ai";
import { z } from "zod";
import { runPlan } from "@/lib/agent/run";
import { withLocalLead } from "@/lib/engine/local";
import { CityNotFoundError, type ToolEvent, type Tools } from "@/lib/engine/tools";
import { PlanInputSchema, type Plan } from "@/lib/plan/schema";
import { QlooError } from "@/lib/qloo/client";

/** What an MCP tool call returns: plain text for the calling agent, flagged when it is a refusal or failure. */
export type McpResult = { text: string; isError: boolean };
type MakeTools = (onTool: (e: ToolEvent) => void) => Tools;

const City = z.string().trim().min(2).max(80).describe('City to plan for, e.g. "Houston, TX" or "Mumbai"');
const Band = z.enum(["16-24", "18-29"]).default("16-24").describe("Age band of the donors to recruit");
const Day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const PlanArgsSchema = z.object({
  city: City, band: Band,
  startDate: Day.optional().describe("First day of the drive window, YYYY-MM-DD (default: two weeks from today)"),
  endDate: Day.optional().describe("Last day of the drive window, YYYY-MM-DD (default: a month after the start)"),
  partners: z.array(z.string().trim().min(1).max(60)).max(8).default([]).describe("Fandoms you already have in mind; they are tested alongside the agent's own ideas"),
});
export const ScoreArgsSchema = z.object({
  city: City, band: Band,
  fandoms: z.array(z.string().trim().min(1).max(60)).min(1).max(12).describe("Artists, teams, shows, games or creators to score"),
});
export const CityArgsSchema = z.object({ city: City });

const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const signed = (x: number) => (x < 0 ? `−${Math.abs(x).toFixed(2)}` : `+${x.toFixed(2)}`);
const fail = (text: string): McpResult => ({ text, isError: true });

function failure(e: unknown, city: string): McpResult {
  if (e instanceof CityNotFoundError) return fail(`We couldn't find "${city}" in Qloo. Try the full name, e.g. "Houston, TX".`);
  if (e instanceof QlooError && e.kind === "rate_limited") return fail("The taste-data service is busy. Retry in a minute.");
  if (e instanceof QlooError) return fail("The taste-data service had a problem. Please retry.");
  throw e;
}

export type PlanDeps = {
  makeTools: MakeTools; model: LanguageModel | null; baseUrl: string;
  save: (p: Plan) => Promise<void>;
  /** null to go ahead, or the reason this caller can't plan right now (rate limit, daily budget). */
  allowPlan: () => Promise<string | null>;
  now?: () => number;
};

export async function planBloodDrive(args: z.input<typeof PlanArgsSchema>, d: PlanDeps): Promise<McpResult> {
  const refusal = await d.allowPlan();
  if (refusal) return fail(refusal);
  const t = (d.now ?? Date.now)();
  const start = args.startDate ?? iso(t + 14 * 86_400_000);
  const parsed = PlanInputSchema.safeParse({ ...args, startDate: start, endDate: args.endDate ?? iso(Date.parse(start) + 30 * 86_400_000) });
  if (!parsed.success) return fail(`Invalid input: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
  let error = "Something went wrong while planning.";
  const plan = await runPlan(parsed.data, { makeTools: d.makeTools, model: d.model }, (e) => { if (e.type === "error") error = e.message; });
  if (!plan) return fail(error);
  await d.save(plan).catch(() => undefined);
  return { text: summarize(plan, d.baseUrl), isError: false };
}

/** The plan as text an agent can read back to a person: picks, where to host, the poster, and a link to the full report. */
export function summarize(plan: Plan, baseUrl: string): string {
  const picked = new Set(plan.agentPicks?.ids ?? []);
  const order = withLocalLead([...plan.partners.filter((p) => picked.has(p.entityId)), ...plan.partners.filter((p) => !picked.has(p.entityId))]).slice(0, 5);
  const lines = [
    `FanDrive plan for ${plan.city.disambiguation ?? plan.city.name} (Qloo data: ${plan.city.badge}; planned by ${plan.engine === "agent" ? "the AI agent" : "autopilot"})`,
    `Ages ${plan.input.band}, drive window ${plan.input.startDate} to ${plan.input.endDate}.`,
    "",
    "Fandom partners (youth skew runs −1 to +1; higher means younger fans):",
    ...order.map((p, i) => `${i + 1}. ${p.name} (${p.type.replace("_", " ")}): youth skew ${signed(p.youthSkew)}, local love ${p.localLove === null ? "n/a" : p.localLove.toFixed(2)}, Young-Donor Pull ${p.pull.toFixed(2)}${picked.has(p.entityId) ? " [AI pick]" : ""}${p.local ? " [local: one of Qloo's top picks for young people in this city]" : ""}${p.hometown ? ` [born in ${p.hometown}]` : ""}${p.flag ? ` [held back by the fit check: ${p.flag}]` : ""}`),
  ];
  if (plan.agentPicks?.rationale) lines.push(`Why: ${plan.agentPicks.rationale}`);
  lines.push("", "Where the fans are, and where to host:");
  for (const m of plan.maps) for (const z of m.zones) {
    const host = z.venues.host.slice(0, 3).map((v) => v.name).join(", ");
    const flyers = z.venues.promote.slice(0, 2).map((v) => v.name).join(", ");
    lines.push(`- ${m.partnerName} fans, ${z.name}: ${host ? `host at ${host}` : "no host venue found nearby"}${flyers ? `; flyers at ${flyers}` : ""}`);
  }
  lines.push("", `Poster: "${plan.creative.posterHeadline}"`, plan.creative.posterBody);
  if (plan.plainAi?.length) {
    const older = plan.plainAi.filter((c) => c.youthSkew !== null && c.youthSkew < 0).length;
    const none = plan.plainAi.filter((c) => c.youthSkew === null).length;
    lines.push("", `Plain-AI check: without Qloo the same model suggested ${plan.plainAi.map((c) => c.name).join(", ")}; ${older} skew older and ${none} have no Qloo data.`);
  }
  lines.push("", ...plan.limits.map((l) => `Note: ${l}`), "", `Full plan with map, evidence, campaign kit and Qloo receipts: ${baseUrl}/plan?id=${plan.id}`);
  return lines.join("\n");
}

export async function scoreFandoms(args: z.input<typeof ScoreArgsSchema>, d: { makeTools: MakeTools }): Promise<McpResult> {
  const band = args.band ?? "16-24";
  try {
    const tools = d.makeTools(() => {});
    const s = await tools.cityStrength(args.city);
    const { refs, unresolved } = await tools.typeNames(args.fandoms);
    if (!refs.length) return fail(`None of these were found in Qloo: ${unresolved.join(", ")}.`);
    const { ranked, excluded } = await tools.scorePartners({ city: args.city, band, refs, cityBadge: s.badge });
    const skipped = [...unresolved.map((n) => `${n} (not found in Qloo)`), ...excluded.map((x) => `${x.query} (${x.reason})`)];
    return { isError: false, text: [
      `Fandoms ranked for young donors (${band}) in ${s.locality.disambiguation ?? s.locality.name}, Qloo data ${s.badge}. Younger fan bases always rank above older ones.`,
      ...ranked.map((p, i) => `${i + 1}. ${p.name} (${p.type.replace("_", " ")}): youth skew ${signed(p.youthSkew)}, local love ${p.localLove === null ? "n/a" : p.localLove.toFixed(2)}, fan density ${p.density.toFixed(2)}, Young-Donor Pull ${p.pull.toFixed(2)}, confidence ${p.confidence}`),
      ...(skipped.length ? ["", `Skipped: ${skipped.join("; ")}`] : []),
      "", "Scores describe crowd-level tendencies, not individuals.",
    ].join("\n") };
  } catch (e) { return failure(e, args.city); }
}

export async function cityDataStrength(args: z.input<typeof CityArgsSchema>, d: { makeTools: MakeTools }): Promise<McpResult> {
  try {
    const s = await d.makeTools(() => {}).cityStrength(args.city);
    const meaning = s.badge === "strong" ? "rankings are reliable" : s.badge === "medium" ? "rankings are directional" : "rankings are rough; try a larger nearby city";
    return { isError: false, text: `${s.locality.disambiguation ?? s.locality.name}: Qloo data is ${s.badge} (${s.cells} heatmap cells, centre ${s.locality.lat.toFixed(3)}, ${s.locality.lon.toFixed(3)}), so ${meaning}.` };
  } catch (e) { return failure(e, args.city); }
}
