import { beforeEach, expect, it, vi } from "vitest";
import { resetConfigForTests } from "@/lib/config";
import { limitByIp } from "@/lib/ratelimit";
import { resetRedisForTests } from "@/lib/redis";

beforeEach(() => { vi.stubEnv("QLOO_API_KEY", "k"); vi.stubEnv("UPSTASH_REDIS_REST_URL", ""); resetConfigForTests(); resetRedisForTests(); });

it("allows max requests per window then blocks, per ip and bucket", async () => {
  for (let i = 0; i < 5; i++) expect(await limitByIp("1.1.1.1", "plan")).toBe(true);
  expect(await limitByIp("1.1.1.1", "plan")).toBe(false);
  expect(await limitByIp("2.2.2.2", "plan")).toBe(true);
  expect(await limitByIp("1.1.1.1", "city")).toBe(true);
});
