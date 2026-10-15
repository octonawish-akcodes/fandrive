import type { CityBadge } from "@/lib/engine/tools";

/** Same line the report's plain-AI check draws: fans "skew young" at +0.30 or more. */
export const YOUNG = 0.3;

export type CityEval = {
  city: string; badge: CityBadge;
  /** What a plain LLM suggested (no Qloo), each fact-checked against Qloo's age data. */
  plainAi: { name: string; matchedName?: string; youthSkew: number | null }[];
  /** FanDrive's top three after Qloo scoring. */
  fanDrive: { name: string; youthSkew: number; pull: number }[];
  /** The city-specific fandom the report leads with: Qloo's local taste for young people, scored like every other candidate. */
  localPick?: { name: string; youthSkew: number } | null;
};
type Shares = { picks: number; young: number; notYoung: number; older: number; noData: number; meanSkew: number | null };
type Top = { picks: number; young: number; meanSkew: number | null };

const round = (x: number) => Math.round(x * 100) / 100;
const mean = (xs: number[]) => (xs.length ? round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);
const signed = (x: number) => (x < 0 ? `−${Math.abs(x).toFixed(2)}` : `+${x.toFixed(2)}`);

function plainShares(ps: CityEval["plainAi"]): Shares {
  const skews = ps.map((p) => p.youthSkew).filter((y): y is number => y !== null);
  return { picks: ps.length, young: skews.filter((y) => y >= YOUNG).length, notYoung: skews.filter((y) => y < YOUNG).length, older: skews.filter((y) => y < 0).length, noData: ps.length - skews.length, meanSkew: mean(skews) };
}
const topShares = (ps: CityEval["fanDrive"]): Top => ({ picks: ps.length, young: ps.filter((p) => p.youthSkew >= YOUNG).length, meanSkew: mean(ps.map((p) => p.youthSkew)) });

/** FanDrive's top picks that plain AI never suggested (by its name or Qloo's matched name). */
function missed(c: CityEval): string[] {
  const said = new Set(c.plainAi.flatMap((p) => [p.name, p.matchedName ?? ""]).map((n) => n.trim().toLowerCase()).filter(Boolean));
  return c.fanDrive.filter((p) => !said.has(p.name.toLowerCase())).map((p) => p.name);
}

export function cityMetrics(c: CityEval) {
  return { plain: plainShares(c.plainAi), fanDrive: topShares(c.fanDrive), missed: missed(c) };
}

/** Pools every pick across cities (a city with five picks counts more than one with two). */
export function aggregate(cs: CityEval[]) {
  const misses = cs.map(missed);
  const locals = cs.flatMap((c) => (c.localPick ? [c.localPick] : []));
  return {
    cities: cs.length,
    plain: plainShares(cs.flatMap((c) => c.plainAi)),
    fanDrive: topShares(cs.flatMap((c) => c.fanDrive)),
    citiesWithMiss: misses.filter((m) => m.length > 0).length,
    missedPicks: misses.reduce((n, m) => n + m.length, 0),
    local: { cities: locals.length, distinct: new Set(locals.map((l) => l.name)).size, meanSkew: mean(locals.map((l) => l.youthSkew)) },
  };
}

/** How many cities each fandom made FanDrive's top 3 in, most frequent first (ties keep first-seen order). */
export function repeats(cs: CityEval[]): [string, number][] {
  const n = new Map<string, number>();
  for (const c of cs) for (const p of c.fanDrive) n.set(p.name, (n.get(p.name) ?? 0) + 1);
  return [...n].sort((a, b) => b[1] - a[1]);
}

export function renderMarkdown(cs: CityEval[]): string {
  const rows = cs.map((c) => {
    const plain = c.plainAi.map((p) => `${p.name} (${p.youthSkew === null ? "no data" : signed(p.youthSkew)})`).join(", ");
    const top = c.fanDrive.map((p) => `${p.name} (${signed(p.youthSkew)})`).join(", ");
    const m = missed(c);
    const local = c.localPick ? `${c.localPick.name} (${signed(c.localPick.youthSkew)})` : "—";
    return `| ${c.city} | ${c.badge} | ${plain} | ${top} | ${m.length ? m.join(", ") : "—"} | ${local} |`;
  });
  return ["| City | Qloo data | Plain AI suggested (youth skew) | FanDrive top 3 (youth skew) | Plain AI missed | Local pick |", "|---|---|---|---|---|---|", ...rows].join("\n");
}
