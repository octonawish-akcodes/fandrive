/** Ranks with ties sharing their average rank (1-based). */
function ranks(xs: number[]): number[] {
  const order = xs.map((x, i) => [x, i] as const).sort((a, b) => a[0] - b[0]);
  const r = new Array<number>(xs.length);
  for (let i = 0; i < order.length; ) {
    let j = i;
    while (j + 1 < order.length && order[j + 1][0] === order[i][0]) j++;
    for (let k = i; k <= j; k++) r[order[k][1]] = (i + j) / 2 + 1;
    i = j + 1;
  }
  return r;
}

/** Spearman rank correlation (Pearson on ranks, so ties are handled). */
export function spearman(xs: number[], ys: number[]): number {
  const a = ranks(xs), b = ranks(ys), n = a.length;
  const ma = a.reduce((s, x) => s + x, 0) / n, mb = b.reduce((s, x) => s + x, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) { num += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; }
  return num / Math.sqrt(da * db);
}

/** Qloo's under-35 age affinity minus its 45-and-over affinity: how far a fan base leans young overall. */
export function youngLean(age: Record<string, number>): number {
  const g = (k: string) => age[k] ?? 0;
  return (g("24_and_younger") + g("25_to_29") + g("30_to_34")) / 3 - (g("45_to_54") + g("55_and_older")) / 2;
}
