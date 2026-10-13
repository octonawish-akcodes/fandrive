/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateText } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";
import { withFallback } from "@/lib/agent/fallbackModel";
import { text } from "../../helpers/mockModel";

const overloaded = () => new MockLanguageModelV4({ doGenerate: async () => { throw Object.assign(new Error("This model is currently experiencing high demand"), { statusCode: 503, isRetryable: true }); } });
const hanging = () => new MockLanguageModelV4({ doGenerate: ({ abortSignal }) => new Promise((_, rej) => abortSignal?.addEventListener("abort", () => rej(abortSignal.reason))) });
const ok = (t = "ok") => new MockLanguageModelV4({ doGenerate: async () => text(t) as any });

describe("withFallback", () => {
  it("falls through to the next model and sticks with the one that worked", async () => {
    const a = overloaded(), b = ok("from b");
    const m = withFallback([a, b]);
    expect((await generateText({ model: m, prompt: "x" })).text).toBe("from b");
    expect((await generateText({ model: m, prompt: "y" })).text).toBe("from b");
    expect(a.doGenerateCalls).toHaveLength(1);
    expect(b.doGenerateCalls).toHaveLength(2);
  });
  it("abandons a model that is slower than the attempt timeout", async () => {
    const m = withFallback([hanging(), ok("fast")], { attemptTimeoutMs: 20 });
    expect((await generateText({ model: m, prompt: "x" })).text).toBe("fast");
  });
  it("gives up with one non-retryable error after two rounds of the chain", async () => {
    const a = overloaded(), b = overloaded();
    await expect(generateText({ model: withFallback([a, b], { pauseMs: 0 }), prompt: "x" })).rejects.toThrow("No AI model is available right now");
    expect(a.doGenerateCalls.length + b.doGenerateCalls.length).toBe(4);
  });
  it("runs the chain again after a pause when every model was briefly overloaded", async () => {
    let n = 0;
    const flaky = new MockLanguageModelV4({ doGenerate: async () => { if (n++ === 0) throw new Error("503 high demand"); return text("second round") as any; } });
    expect((await generateText({ model: withFallback([flaky], { pauseMs: 1 }), prompt: "x" })).text).toBe("second round");
  });
  it("stops at once when the caller aborts", async () => {
    const ac = new AbortController();
    const b = ok();
    const run = generateText({ model: withFallback([hanging(), b], { attemptTimeoutMs: 5_000 }), prompt: "x", abortSignal: ac.signal });
    ac.abort(new Error("deadline"));
    await expect(run).rejects.toThrow();
    expect(b.doGenerateCalls).toHaveLength(0);
  });
  it("rests a model that hit its quota (429) instead of retrying it on every call", async () => {
    const a = new MockLanguageModelV4({ doGenerate: async () => { throw Object.assign(new Error("RESOURCE_EXHAUSTED"), { statusCode: 429 }); } });
    const b = overloaded();
    const m = withFallback([a, b], { pauseMs: 0 });
    await expect(generateText({ model: m, prompt: "x" })).rejects.toThrow();
    await expect(generateText({ model: m, prompt: "y" })).rejects.toThrow();
    expect(a.doGenerateCalls).toHaveLength(1);
    expect(b.doGenerateCalls).toHaveLength(4);
  });
});
