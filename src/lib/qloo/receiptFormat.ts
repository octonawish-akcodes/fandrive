/** One Qloo request a plan made: what was asked and whether the cache answered it. Never holds the key. */
export type Receipt = { path: string; params: Record<string, string>; cached: boolean };

/** A copy-pasteable curl that reproduces the request with your own key. */
export function toCurl(r: Receipt, base: string): string {
  const qs = new URLSearchParams(Object.entries(r.params).sort(([a], [b]) => a.localeCompare(b))).toString();
  return `curl -H "X-Api-Key: $QLOO_API_KEY" "${base.replace(/\/$/, "")}${r.path}${qs ? `?${qs}` : ""}"`;
}
