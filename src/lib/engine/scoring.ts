import type { AgeBand, Demographics } from "@/lib/qloo/types";
import { MATCH_OK, WEIGHTS, type Weights } from "./weights";

export function youthSkew(d: Demographics, band: AgeBand): number | null {
  const u24 = d.age["24_and_younger"], u29 = d.age["25_to_29"];
  if (band === "16-24") return u24 ?? null;
  const xs = [u24, u29].filter((x): x is number => typeof x === "number");
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
}

export function minMax(xs: (number | null)[]): (number | null)[] {
  const v = xs.filter((x): x is number => x !== null);
  if (!v.length) return xs.map(() => null);
  const lo = Math.min(...v), hi = Math.max(...v);
  return xs.map((x) => (x === null ? null : hi === lo ? 0.5 : (x - lo) / (hi - lo)));
}

export type ScoreRow = { id: string; youth: number; local: number | null; density: number | null };
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

// Y' = (youth + 1) / 2 (absolute; skew range is -1..1); L' = affinity or 0 (absolute); D' = min-max across candidates.
export function pullScores(rows: ScoreRow[], w: Weights = WEIGHTS): Map<string, number> {
  const d = minMax(rows.map((r) => r.density));
  return new Map(rows.map((r, i) => [r.id, clamp01(w.youth * clamp01((r.youth + 1) / 2) + w.local * clamp01(r.local ?? 0) + w.density * (d[i] ?? 0))]));
}

export function confidenceLevel(a: { match: number; hasLocal: boolean; cityBadge: "strong" | "medium" | "thin" }): "high" | "medium" | "low" {
  if (a.match < MATCH_OK || a.cityBadge === "thin") return "low";
  return a.hasLocal && a.cityBadge === "strong" ? "high" : "medium";
}
