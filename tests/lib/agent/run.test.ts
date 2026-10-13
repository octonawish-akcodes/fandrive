import { describe, expect, it, vi } from "vitest";
import { runPlan, skippedNote } from "@/lib/agent/run";
import { createTools } from "@/lib/engine/tools";
import { PlanInputSchema, type RunEvent } from "@/lib/plan/schema";
import { fakeApi, heat, id, type FakeData } from "../../helpers/fakeApi";
import { failingModel, text } from "../../helpers/mockModel";
import { MockLanguageModelV4 } from "ai/test";

const young = { age: { "24_and_younger": 0.8 }, gender: {} };
const data: FakeData = {
  demo: { [id("Sabrina Carpenter")]: young, [id("Olivia Rodrigo")]: young, [id("Bad Bunny")]: young, [id("Houston Astros")]: young },
  heat: { [id("Sabrina Carpenter")]: heat([["g1", 0.9], ["g2", 0.8], ["g3", 0.6]]) },
  places: [{ entityId: "p1", name: "Fitness Connection", lat: 29.70, lon: -95.52, affinity: 0.8, neighborhood: "Sharpstown", genre: "gym", tags: [] }],
};
const input = PlanInputSchema.parse({ city: "Houston", startDate: "2026-11-14", endDate: "2026-11-30" });
async function run(d: FakeData, model: Parameters<typeof runPlan>[1]["model"] = null, inp = input) {
  const events: RunEvent[] = [];
  const plan = await runPlan(inp, { makeTools: (on) => createTools(fakeApi(d), on), model, newId: () => "plan123", now: () => 0 }, (e) => events.push(e));
  return { plan, events, types: events.map((e) => e.type) };
}

describe("runPlan", () => {
  it("runs autopilot without a model and streams sections in order", async () => {
    const { plan, types } = await run(data);
    expect(plan?.engine).toBe("autopilot");
    expect(plan?.id).toBe("plan123");
    expect(types.indexOf("city")).toBeLessThan(types.lastIndexOf("partners"));
    expect(types.at(-1)).toBe("done");
    expect(plan?.limits.at(-1)).toContain("crowd-level");
  });
  it("falls back to autopilot when the model fails", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { plan, events } = await run(data, failingModel());
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("[fandrive] agent fallback"));
    warn.mockRestore();
    expect(plan?.engine).toBe("autopilot");
    expect(events.some((e) => e.type === "step" && e.step.message.includes("switching to autopilot"))).toBe(true);
    expect(plan?.plainAi).toBeNull();
  });
  it("still fact-checks plain-AI picks when the agent falls back to autopilot", async () => {
    let n = 0;
    const model = new MockLanguageModelV4({ doGenerate: async () => {
      if (n++ === 0) throw new Error("planner timed out");
      return text(JSON.stringify({ picks: [{ name: "Sabrina Carpenter", type: "artist", why: "Pop star" }] })) as never;
    } });
    const { plan } = await run(data, model);
    expect(plan?.engine).toBe("autopilot");
    expect(plan?.plainAi?.[0].name).toBe("Sabrina Carpenter");
  });
  it("words the skipped-names limit for one and for many", () => {
    expect(skippedNote(1)).toBe("1 name was skipped (not found, wrong match, or no audience data yet).");
    expect(skippedNote(3)).toBe("3 names were skipped (not found, wrong match, or no audience data yet).");
  });
  it("reports unknown cities", async () => {
    const { plan, events } = await run({ ...data, badCities: ["asdfgh"] }, null, { ...input, city: "asdfgh" });
    expect(plan).toBeNull();
    expect(events.at(-1)).toMatchObject({ type: "error", code: "city_not_found" });
  });
  it("reports too few partners", async () => {
    const { events } = await run({ ...data, demo: { [id("Sabrina Carpenter")]: young } });
    expect(events.at(-1)).toMatchObject({ type: "error", code: "too_few_partners" });
  });
  it("maps Qloo auth failures to an upstream error without leaking details", async () => {
    const { events } = await run({ ...data, authFail: true });
    const last = events.at(-1) as Extract<RunEvent, { type: "error" }>;
    expect(last.code).toBe("upstream");
    expect(last.message).not.toMatch(/key|401/i);
  });
});
