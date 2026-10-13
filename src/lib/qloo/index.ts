import { getConfig } from "@/lib/config";
import { getRedis, resetRedisForTests } from "@/lib/redis";
import { createQlooApi, type QlooApi } from "./api";
import { MemoryCache, RedisCache } from "./cache";
import { createQlooClient } from "./client";

let api: QlooApi | null = null;
export function getQlooApi(): QlooApi {
  if (api) return api;
  const c = getConfig();
  const redis = getRedis();
  api = createQlooApi(createQlooClient({ baseUrl: c.qlooBaseUrl, apiKey: c.qlooApiKey, cache: redis ? new RedisCache(redis) : new MemoryCache() }));
  return api;
}
export function resetQlooForTests() { api = null; resetRedisForTests(); }
