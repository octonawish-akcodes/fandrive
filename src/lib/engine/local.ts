/** Every report leads with one city-specific fandom: if neither of the first two is local, the best young-leaning local one moves into second place. */
export function withLocalLead<P extends { local?: boolean; youthSkew: number }>(ps: P[]): P[] {
  if (ps.slice(0, 2).some((p) => p.local)) return ps;
  const i = ps.findIndex((p, j) => j >= 2 && p.local && p.youthSkew >= 0);
  if (i < 0) return ps;
  return [ps[0], ps[i], ...ps.filter((_, j) => j !== 0 && j !== i)];
}
