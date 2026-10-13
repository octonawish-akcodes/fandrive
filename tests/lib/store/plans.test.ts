import { beforeEach, expect, it, vi } from "vitest";
import { resetConfigForTests } from "@/lib/config";
import { resetRedisForTests } from "@/lib/redis";
import { getPlan, savePlan } from "@/lib/store/plans";
import type { Plan } from "@/lib/plan/schema";

beforeEach(() => { vi.stubEnv("QLOO_API_KEY", "k"); vi.stubEnv("UPSTASH_REDIS_REST_URL", ""); resetConfigForTests(); resetRedisForTests(); });

it("saves and loads plans in memory mode and rejects bad ids", async () => {
  await savePlan({ id: "abc12345" } as Plan);
  expect((await getPlan("abc12345"))?.id).toBe("abc12345");
  expect(await getPlan("../../etc")).toBeNull();
  expect(await getPlan("missing99")).toBeNull();
});
