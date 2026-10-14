import { afterEach, expect, it, vi } from "vitest";
import { resetConfigForTests } from "@/lib/config";

afterEach(() => { vi.unstubAllEnvs(); resetConfigForTests(); });

it("reports what powers the app without exposing any key", async () => {
  vi.stubEnv("QLOO_API_KEY", "qloo-secret");
  vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "gem-secret");
  vi.stubEnv("GEMINI_MODEL", "gemini-3.1-flash-lite");
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
  vi.stubEnv("KV_REST_API_URL", "");
  const { GET } = await import("@/app/api/status/route");
  const res = await GET();
  const body = await res.json();
  expect(body).toEqual({ qloo: "live", ai: "gemini-3.1-flash-lite", fallbacks: 3, sharedCache: false });
  expect(JSON.stringify(body)).not.toMatch(/secret/);
});
