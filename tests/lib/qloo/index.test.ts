import { afterEach, expect, it, vi } from "vitest";
import { resetConfigForTests } from "@/lib/config";
import { getQlooApi, resetQlooForTests } from "@/lib/qloo";
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
