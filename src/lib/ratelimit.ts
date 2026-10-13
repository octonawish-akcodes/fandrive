import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "@/lib/redis";

type Bucket = "plan" | "city" | "mcp";
const mem = new Map<string, number[]>();

export async function limitByIp(ip: string, bucket: Bucket, max = bucket === "plan" ? 5 : 30, windowSec = 600): Promise<boolean> {
  const r = getRedis();
  if (r) {
    const rl = new Ratelimit({ redis: r, limiter: Ratelimit.slidingWindow(max, `${windowSec} s`), prefix: `rl:${bucket}` });
    return (await rl.limit(ip)).success;
  }
  const now = Date.now(), key = `${bucket}:${ip}`;
  const hits = (mem.get(key) ?? []).filter((t) => now - t < windowSec * 1000);
  const ok = hits.length < max;
  if (ok) hits.push(now);
  mem.set(key, hits);
  return ok;
}
