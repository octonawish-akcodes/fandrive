import { Redis } from "@upstash/redis";
import { getConfig } from "@/lib/config";

let redis: Redis | null | undefined;
export function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  const c = getConfig();
  redis = c.upstashUrl && c.upstashToken ? new Redis({ url: c.upstashUrl, token: c.upstashToken }) : null;
  return redis;
}
export function resetRedisForTests() { redis = undefined; }
