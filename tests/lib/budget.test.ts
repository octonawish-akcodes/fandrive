import { describe, expect, it } from "vitest";
import { createQlooBudget } from "@/lib/budget";

function fakeStore() {
  const m = new Map<string, number>(), ttl = new Map<string, number>();
  return { m, ttl, async incr(k: string) { m.set(k, (m.get(k) ?? 0) + 1); return m.get(k)!; }, async expire(k: string, s: number) { ttl.set(k, s); return 1; }, async get<T>(k: string) { return (m.get(k) ?? null) as T | null; } };
}
const day = () => Date.UTC(2026, 9, 20, 12);

describe("createQlooBudget", () => {
  it("counts network calls per UTC day and stops live plans at the daily limit", async () => {
    const s = fakeStore();
    const b = createQlooBudget(s, 2, day);
    expect(await b.ok()).toBe(true);
    await b.spend(); await b.spend();
    expect(s.m.get("budget:qloo:2026-10-20")).toBe(2);
    expect(s.ttl.get("budget:qloo:2026-10-20")).toBe(172_800);
    expect(await b.ok()).toBe(false);
    expect(await createQlooBudget(s, 2, () => day() + 86_400_000).ok()).toBe(true);
  });
  it("never blocks without Redis or when Redis fails", async () => {
    expect(await createQlooBudget(null, 0).ok()).toBe(true);
    const broken = { incr: async () => { throw new Error("down"); }, expire: async () => 1, get: async () => { throw new Error("down"); } };
    const b = createQlooBudget(broken, 1);
    await expect(b.spend()).resolves.toBeUndefined();
    expect(await b.ok()).toBe(true);
  });
});
