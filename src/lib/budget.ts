import { getConfig } from "@/lib/config";
import { getRedis } from "@/lib/redis";

/** Minimal counter store (Upstash Redis fits). */
type Counter = { incr(key: string): Promise<number>; expire(key: string, seconds: number): Promise<unknown>; get<T>(key: string): Promise<T | null> };
const dayKey = (t: number) => `budget:qloo:${new Date(t).toISOString().slice(0, 10)}`;

/**
 * Daily cap on uncached Qloo calls across all instances, so one busy afternoon can't spend the key's
 * 10,000/month quota. Without Redis (local dev) it never blocks; a Redis failure never blocks either.
 */
export function createQlooBudget(store: Counter | null, dailyLimit: number, now: () => number = Date.now) {
  return {
    async spend(): Promise<void> {
      if (!store) return;
      const k = dayKey(now());
      try { if ((await store.incr(k)) === 1) await store.expire(k, 172_800); } catch { /* best effort */ }
    },
    async ok(): Promise<boolean> {
      if (!store) return true;
      try { return Number((await store.get<number>(dayKey(now()))) ?? 0) < dailyLimit; } catch { return true; }
    },
  };
}

let budget: ReturnType<typeof createQlooBudget> | undefined;
export function getQlooBudget() { return (budget ??= createQlooBudget(getRedis(), getConfig().qlooDailyBudget)); }
export function resetBudgetForTests() { budget = undefined; }
/** Route guard: never throws (a config problem is reported by the plan run itself). */
export async function qlooBudgetOk(): Promise<boolean> {
  try { return await getQlooBudget().ok(); } catch { return true; }
}
