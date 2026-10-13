import type { Plan } from "@/lib/plan/schema";
import { getRedis } from "@/lib/redis";

const TTL = 10_368_000;
const mem = new Map<string, Plan>();
const ID = /^[A-Za-z0-9_-]{6,24}$/;

export async function savePlan(p: Plan): Promise<void> {
  const r = getRedis();
  if (r) await r.set(`plan:${p.id}`, p, { ex: TTL });
  else mem.set(p.id, p);
}

export async function getPlan(id: string): Promise<Plan | null> {
  if (!ID.test(id)) return null;
  const r = getRedis();
  return r ? ((await r.get<Plan>(`plan:${id}`)) ?? null) : (mem.get(id) ?? null);
}
