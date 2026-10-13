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
});
