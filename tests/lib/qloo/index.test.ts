import { afterEach, expect, it, vi } from "vitest";
import { resetConfigForTests } from "@/lib/config";
import { getQlooApi, pickCache, resetQlooForTests } from "@/lib/qloo";
import { MemoryCache } from "@/lib/qloo/cache";
import { FileCache } from "@/lib/qloo/fileCache";
import { getRedis } from "@/lib/redis";

afterEach(() => { vi.unstubAllEnvs(); resetConfigForTests(); resetQlooForTests(); });

it("builds one API instance and uses memory cache without Upstash", () => {
  vi.stubEnv("QLOO_API_KEY", "k");
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
  expect(getRedis()).toBeNull();
  const a = getQlooApi();
  expect(getQlooApi()).toBe(a);
  expect(typeof a.search).toBe("function");
});

it("uses a file cache for local scripts when QLOO_CACHE_DIR is set, else memory", () => {
  vi.stubEnv("QLOO_API_KEY", "k");
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
  vi.stubEnv("QLOO_CACHE_DIR", "");
  expect(pickCache()).toBeInstanceOf(MemoryCache);
  resetConfigForTests(); resetQlooForTests();
  vi.stubEnv("QLOO_CACHE_DIR", ".cache/qloo");
  expect(pickCache()).toBeInstanceOf(FileCache);
});
