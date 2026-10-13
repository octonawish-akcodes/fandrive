const NUM: Record<string, string> = { one: "1", two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7", eight: "8", nine: "9", ten: "10" };

function tokens(s: string): string[] {
  const t = s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/\(.*?\)/g, " ").replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter(Boolean).map((w) => NUM[w] ?? w);
  return t[0] === "the" ? t.slice(1) : t;
}

export function matchConfidence(query: string, hitName: string): number {
  const q = tokens(query), n = tokens(hitName);
  if (!q.length || !n.length) return 0;
  if (q.join(" ") === n.join(" ")) return 1;
  const isPrefix = (a: string[], b: string[]) => a.length <= b.length && a.every((w, i) => b[i] === w);
  const qs = new Set(q), ns = new Set(n);
  const inter = [...qs].filter((w) => ns.has(w)).length;
  const jaccard = inter / new Set([...qs, ...ns]).size;
  return isPrefix(q, n) || isPrefix(n, q) ? Math.max(jaccard, 0.8) : jaccard;
}
