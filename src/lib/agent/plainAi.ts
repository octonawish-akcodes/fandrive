import { generateText, Output, type LanguageModel } from "ai";
import { youthSkew } from "@/lib/engine/scoring";
import type { Tools } from "@/lib/engine/tools";
import { clamp } from "@/lib/plan/fit";
import { PlainAiDraftSchema, type CityInfo, type PlainAiCheck, type PlanInput } from "@/lib/plan/schema";

const signed = (x: number) => (x >= 0 ? "+" : "") + x.toFixed(2);

export async function runPlainAi(a: { input: PlanInput; city: CityInfo; tools: Tools; model: LanguageModel; timeoutMs?: number }): Promise<PlainAiCheck[]> {
  const r = await generateText({
    model: a.model, maxRetries: 1, output: Output.object({ schema: PlainAiDraftSchema }), abortSignal: AbortSignal.timeout(a.timeoutMs ?? 30_000),
    prompt: `Suggest up to 5 pop-culture partners (artists, sports teams, TV shows, games or creators) for a blood drive aimed at first-time donors aged ${a.input.band} in ${a.city.name}. Return name, type and a one-line reason.`,
  });
  const picks = r.output.picks.filter((p) => p.name.trim()).slice(0, 5).map((p) => ({ ...p, name: clamp(p.name, 60), why: clamp(p.why, 200) }));
  const resolved = await a.tools.findAndConfirm(picks.map((p) => ({ name: p.name, type: p.type })));
  const ages = await a.tools.fanAge(resolved.filter((x) => x.status === "ok").map((x) => x.entityId!));
  // The model can give a pick the wrong type (live: the Houston Astros as a videogame matched "Astro's Ace XR"): retry those untyped, so plain AI is judged on what it meant
  const missed = resolved.map((r, i) => i).filter((i) => resolved[i].status !== "ok" || !ages.get(resolved[i].entityId!));
  const { refs } = await a.tools.typeNames(missed.map((i) => picks[i].name), `Re-checking ${missed.length === 1 ? "1 plain-AI pick" : `${missed.length} plain-AI picks`} Qloo couldn't match as typed`);
  const retyped = refs.filter((r) => r.type !== picks.find((p) => p.name === r.name)?.type);
  if (retyped.length) {
    const again = await a.tools.findAndConfirm(retyped);
    const moreAges = await a.tools.fanAge(again.filter((x) => x.status === "ok").map((x) => x.entityId!));
    again.forEach((r) => {
      const i = missed.find((j) => picks[j].name === r.name);
      if (i !== undefined && r.status === "ok" && moreAges.get(r.entityId!)) { resolved[i] = r; ages.set(r.entityId!, moreAges.get(r.entityId!)!); }
    });
  }
  return picks.map((p, i) => {
    const res = resolved[i];
    const d = res.status === "ok" ? ages.get(res.entityId!) : null;
    const y = d ? youthSkew(d, a.input.band) : null;
    const note = y === null ? "Qloo has no audience data for this pick"
      : y >= 0.3 ? `Qloo: fans skew young (${signed(y)})` : y > -0.1 ? `Qloo: fans are not especially young (${signed(y)})` : `Qloo: fans skew older (${signed(y)})`;
    return { name: p.name, type: p.type, why: p.why, matchedName: res.matchedName, youthSkew: y, note };
  });
}
