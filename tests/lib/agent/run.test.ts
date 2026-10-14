import { describe, expect, it, vi } from "vitest";
import { runPlan, skippedNote } from "@/lib/agent/run";
import { recordReceipt } from "@/lib/qloo/receipts";
import { createTools } from "@/lib/engine/tools";
import { PlanInputSchema, type RunEvent } from "@/lib/plan/schema";
import { fakeApi, heat, id, type FakeData } from "../../helpers/fakeApi";
import { calls, failingModel, hangingModel, mockModel, text } from "../../helpers/mockModel";
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
  it("keeps the user's full city (with state) on every Qloo location query", async () => {
    const calls: string[] = [];
    const base = fakeApi(data);
    const api = { ...base,
      async heatmap(a: Parameters<typeof base.heatmap>[0]) {
        calls.push(`heatmap:${a.city}`);
        const r = await base.heatmap(a);
        return { ...r, locality: { name: "Springfield", disambiguation: "Springfield, Hampden County, Massachusetts", lat: 42.1, lon: -72.59 } };
      },
      async cityAffinity(a: Parameters<typeof base.cityAffinity>[0]) { calls.push(`affinity:${a.city}`); return base.cityAffinity(a); },
    };
    const events: RunEvent[] = [];
    await runPlan(PlanInputSchema.parse({ city: "Springfield, MA", startDate: "2026-11-14", endDate: "2026-11-30" }),
      { makeTools: (on) => createTools(api, on), model: null, newId: () => "p", now: () => 0 }, (e) => events.push(e));
    expect(calls.length).toBeGreaterThan(3);
    expect(calls.filter((c) => !c.endsWith(":Springfield, MA"))).toEqual([]);
  });
  it("skips the plain-AI check when no AI model is available at all", async () => {
    const model = failingModel("No AI model is available right now");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { plan, events } = await run(data, model);
    warn.mockRestore();
    expect(plan?.engine).toBe("autopilot");
    expect(model.doGenerateCalls).toHaveLength(1);
    expect(events.some((e) => e.type === "step" && e.step.tool === "plain_ai")).toBe(false);
  });
  it("shows the agent's picks in the step log, on the partners event and on the plan", async () => {
    const cands = { candidates: [{ name: "Sabrina Carpenter", type: "artist" }, { name: "Olivia Rodrigo", type: "artist" }, { name: "Bad Bunny", type: "artist" }] };
    const model = mockModel([
      calls(["score_partners", cands]),
      calls(["finish", { ids: [id("Olivia Rodrigo")], rationale: "Youngest fan base" }]),
      text(JSON.stringify({ theme: "Fan Day", posterHeadline: "Olivia Rodrigo fans, give blood", posterBody: "Give blood with fellow fans on the day.", socialPosts: ["Olivia Rodrigo fans, give blood", "Olivia Rodrigo fans, bring a friend", "Olivia Rodrigo fans, see you there"], invite: "Come give blood with me, check eligibility.", pitchEmail: { subject: "Partnership idea", body: "Hello, we would love to partner on a fan blood drive." } })),
      text(JSON.stringify({ picks: [{ name: "Bad Bunny", type: "artist", why: "Popular" }] })),
    ]);
    const { plan, events } = await run(data, model);
    expect(plan?.engine).toBe("agent");
    expect(plan?.agentPicks).toEqual({ ids: [id("Olivia Rodrigo")], rationale: "Youngest fan base" });
    expect(events.some((e) => e.type === "step" && e.step.tool === "agent_picks" && e.step.message.includes("Olivia Rodrigo") && e.step.message.includes("Youngest fan base"))).toBe(true);
    const last = events.filter((e) => e.type === "partners").at(-1);
    expect(last && last.type === "partners" && last.picks?.ids).toEqual([id("Olivia Rodrigo")]);
  });
  it("reports an internal error instead of throwing when the tools can't be built", async () => {
    const events: RunEvent[] = [];
    const plan = await runPlan(input, { makeTools: () => { throw new Error("Missing QLOO_API_KEY"); }, model: null }, (e) => events.push(e));
    expect(plan).toBeNull();
    expect(events.at(-1)).toMatchObject({ type: "error", code: "internal" });
  });
  it("uses the agent deadline from deps (recording runs allow longer)", async () => {
    const events: RunEvent[] = [];
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const plan = await runPlan(input, { makeTools: (on) => createTools(fakeApi(data), on), model: hangingModel(), agentDeadlineMs: 30, plainAiTimeoutMs: 30, newId: () => "p" }, (e) => events.push(e));
    warn.mockRestore();
    expect(plan?.engine).toBe("autopilot");
  });
  it("attaches the Qloo receipts made during the run to the plan", async () => {
    const base = fakeApi(data);
    const api = { ...base, async search(...a: Parameters<typeof base.search>) { recordReceipt({ path: "/search", params: { query: a[0] }, cached: false }); return base.search(...a); } };
    const { plan } = await run(data, null);
    expect(plan?.receipts).toEqual([]);
    const events: RunEvent[] = [];
    const p2 = await runPlan(input, { makeTools: (on) => createTools(api, on), model: null, newId: () => "p" }, (e) => events.push(e));
    expect(p2?.receipts?.length).toBeGreaterThan(3);
    expect(p2?.receipts?.[0]).toMatchObject({ path: "/search", cached: false });
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
