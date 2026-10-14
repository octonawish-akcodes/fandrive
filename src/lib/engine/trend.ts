export type TrendPoint = { date: string; percentile: number };
export type Momentum = { direction: "rising" | "steady" | "cooling"; changePct: number; window: string };

/** Qloo's trending series on the hackathon host end in late September 2025, so we read that window and say so. */
export const TREND_WINDOW = { start: "2025-06-08", end: "2025-09-28", label: "Jun–Sep 2025" } as const;
/** Trending works for these entity types (games and books are rejected). */
export const TREND_TYPES: readonly string[] = ["artist", "tv_show", "movie", "podcast"];

/** Direction of a fan base's popularity percentile across the window, oldest point first. */
export function momentum(points: TrendPoint[], window: string = TREND_WINDOW.label): Momentum | null {
  if (points.length < 3) return null;
  const s = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const first = s[0].percentile, last = s[s.length - 1].percentile;
  if (!(first > 0)) return null;
  const changePct = Math.round(((last - first) / first) * 100);
  return { direction: changePct > 5 ? "rising" : changePct < -5 ? "cooling" : "steady", changePct, window };
}
