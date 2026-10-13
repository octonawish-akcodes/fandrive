import { afterEach, expect, it, vi } from "vitest";
import { getModel, resetModelForTests } from "@/lib/agent/model";
import { resetConfigForTests } from "@/lib/config";

afterEach(() => { vi.unstubAllEnvs(); resetConfigForTests(); resetModelForTests(); });

it("returns null without a Gemini key, else one shared fallback model", () => {
  vi.stubEnv("QLOO_API_KEY", "k");
  vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "");
  expect(getModel()).toBeNull();
  resetConfigForTests(); resetModelForTests();
  vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "g");
  const m = getModel();
  expect(m).not.toBeNull();
  expect(getModel()).toBe(m);
});
