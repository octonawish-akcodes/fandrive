import { getConfig } from "@/lib/config";
import { getRedis, resetRedisForTests } from "@/lib/redis";
import { createQlooApi, type QlooApi } from "./api";
import { type Cache, MemoryCache, RedisCache } from "./cache";
import { createQlooClient } from "./client";
import { FileCache } from "./fileCache";

/** Redis in production; a disk cache for local scripts (QLOO_CACHE_DIR); memory otherwise. */
export function pickCache(): Cache {
  const redis = getRedis();
  if (redis) return new RedisCache(redis);
  const dir = getConfig().qlooCacheDir;
  return dir ? new FileCache(dir) : new MemoryCache();
}

let api: QlooApi | null = null;
export function getQlooApi(): QlooApi {
  if (api) return api;
  const c = getConfig();
  api = createQlooApi(createQlooClient({ baseUrl: c.qlooBaseUrl, apiKey: c.qlooApiKey, cache: pickCache() }));
  return api;
}
export function resetQlooForTests() { api = null; resetRedisForTests(); }
