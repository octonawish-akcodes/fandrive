import { afterEach, describe, expect, it, vi } from "vitest";
import { getConfig, resetConfigForTests } from "@/lib/config";

afterEach(() => { vi.unstubAllEnvs(); resetConfigForTests(); });

describe("getConfig", () => {
  it("applies defaults", () => {
    vi.stubEnv("QLOO_API_KEY", "k");
    const c = getConfig();
    expect(c.qlooBaseUrl).toBe("https://hackathon.api.qloo.com");
    expect(c.geminiModel).toBe("gemini-3.1-flash-lite");
    expect(c.geminiFallbackModels).toEqual(["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3-flash-preview"]);
    expect(c.upstashUrl).toBeUndefined();
    expect(c.qlooDailyBudget).toBe(400);
  });
  it("throws without a Qloo key", () => {
    vi.stubEnv("QLOO_API_KEY", "");
    expect(() => getConfig()).toThrow("Missing QLOO_API_KEY");
  });
  it("accepts Vercel's KV_REST_API_* names for Upstash when the UPSTASH_* ones are absent", () => {
    vi.stubEnv("QLOO_API_KEY", "k");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    vi.stubEnv("KV_REST_API_URL", "https://kv.example");
    vi.stubEnv("KV_REST_API_TOKEN", "t");
    const c = getConfig();
    expect(c.upstashUrl).toBe("https://kv.example");
    expect(c.upstashToken).toBe("t");
  });
});
