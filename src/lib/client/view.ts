import { withLocalLead } from "@/lib/engine/local";
import type { Partner } from "@/lib/engine/tools";
import type { AgentPicks, PlainAiCheck, Step } from "@/lib/plan/schema";

/** "+0.93" / "−0.04" (true minus sign). */
export const signed = (x: number) => (x < 0 ? `−${Math.abs(x).toFixed(2)}` : `+${x.toFixed(2)}`);

/** Youth skew (−1…+1) as a 0–100 bar width. */
export const youthBarPct = (skew: number) => Math.round(Math.min(1, Math.max(0, (skew + 1) / 2)) * 100);

/** The two partners the report leads with: the agent's picks first, else the top of the ranking; one of them local when possible. */
export function topTwo(partners: Partner[], picks?: AgentPicks | null): Partner[] {
  const picked = (picks?.ids ?? []).map((id) => partners.find((p) => p.entityId === id)).filter((p): p is Partner => !!p);
  return withLocalLead([...picked, ...partners.filter((p) => !picked.includes(p))]).slice(0, 2);
}

export type Verdict = "young" | "not-young" | "no-data";
export type PlainAiView = { rows: { name: string; skew: number | null; verdict: Verdict }[]; missed: Partner | null };

/** Plain-AI picks with a verdict each, plus the youngest lead pick plain AI never suggested (else the youngest of the top three). */
export function plainAiVerdicts(checks: PlainAiCheck[] | null, partners: Partner[], picks?: AgentPicks | null): PlainAiView {
  if (!checks) return { rows: [], missed: null };
  const rows = checks.map((c) => ({
    name: c.name, skew: c.youthSkew,
    verdict: (c.youthSkew === null ? "no-data" : c.youthSkew >= 0.3 ? "young" : "not-young") as Verdict,
  }));
  const suggested = new Set(checks.flatMap((c) => [c.name, c.matchedName ?? ""]).map((n) => n.trim().toLowerCase()).filter(Boolean));
  const unsaid = (ps: Partner[]) => ps.filter((p) => !suggested.has(p.name.toLowerCase())).sort((a, b) => b.youthSkew - a.youthSkew)[0];
  const missed = unsaid(topTwo(partners, picks)) ?? unsaid(partners.slice(0, 3)) ?? null;
  return { rows, missed };
}

/** Hero headline: "Houston’s next blood drive is a [Roblox] party." */
export function headlineParts(city: string | undefined, top: Partner | undefined): { before: string; sticker: string; after: string } {
  if (!city || !top) return { before: "Every fandom is a", sticker: "blood drive", after: "waiting to happen." };
  return { before: `${city}’s next blood drive is a`, sticker: top.name, after: "party." };
}

/** "Done in 84 seconds." from the last step's time. */
export function doneLabel(steps: Step[]): string | null {
  if (!steps.length) return null;
  return `Done in ${Math.round(steps[steps.length - 1].at / 1000)} seconds.`;
}
