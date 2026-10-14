import { describe, expect, it } from "vitest";
import { cityDataStrength, planBloodDrive, scoreFandoms } from "@/lib/mcp/tools";
import { createTools } from "@/lib/engine/tools";
import type { Plan } from "@/lib/plan/schema";
import { fakeApi, heat, id, type FakeData } from "../../helpers/fakeApi";

const young = { age: { "24_and_younger": 0.8 }, gender: {} };
const data: FakeData = {
  demo: { [id("Sabrina Carpenter")]: young, [id("Olivia Rodrigo")]: young, [id("Bad Bunny")]: young, [id("Houston Astros")]: young, [id("Metallica")]: { age: { "24_and_younger": -0.13 }, gender: {} } },
  heat: { [id("Sabrina Carpenter")]: heat([["g1", 0.9], ["g2", 0.8], ["g3", 0.6]]) },
  places: [{ entityId: "p1", name: "Fitness Connection", lat: 29.70, lon: -95.52, affinity: 0.8, neighborhood: "Sharpstown", genre: "gym", tags: [] }],
  badCities: ["Atlantis"],
};
const deps = (over: Partial<Parameters<typeof planBloodDrive>[1]> = {}) => {
  const saved: Plan[] = [];
  return { saved, d: { makeTools: (on: Parameters<typeof createTools>[1]) => createTools(fakeApi(data), on), model: null, baseUrl: "https://fandrive.test", save: async (p: Plan) => { saved.push(p); }, allowPlan: async () => null, ...over } };
};

describe("MCP tools", () => {
  it("plan_blood_drive returns a readable plan summary with a link, and saves the plan", async () => {
    const { saved, d } = deps();
    const r = await planBloodDrive({ city: "Houston, TX" }, d);
    expect(saved).toHaveLength(1);
    expect(r.text).toContain("Houston");
    expect(r.text).toMatch(/1\. \S+/);
    expect(r.text).toContain("Fitness Connection");
    expect(r.text).toContain(`https://fandrive.test/plan?id=${saved[0].id}`);
    expect(r.isError).toBe(false);
  });
  it("plan_blood_drive refuses politely when the rate limit or daily budget says no", async () => {
    const { saved, d } = deps({ allowPlan: async () => "Today's live-planning budget is used up." });
    const r = await planBloodDrive({ city: "Houston, TX" }, d);
    expect(r).toEqual({ text: "Today's live-planning budget is used up.", isError: true });
    expect(saved).toHaveLength(0);
  });
  it("plan_blood_drive reports an unknown city as an error", async () => {
    const r = await planBloodDrive({ city: "Atlantis" }, deps().d);
    expect(r.isError).toBe(true);
    expect(r.text).toContain("Atlantis");
  });
  it("score_fandoms ranks the given names young-first and lists what was skipped", async () => {
    const r = await scoreFandoms({ city: "Houston, TX", fandoms: ["Metallica", "Sabrina Carpenter", "Nobody Real"] }, { makeTools: (on) => createTools(fakeApi({ ...data, notFound: ["Nobody Real"] }), on) });
    expect(r.isError).toBe(false);
    expect(r.text.indexOf("Sabrina Carpenter")).toBeLessThan(r.text.indexOf("Metallica"));
    expect(r.text).toContain("Nobody Real");
  });
  it("city_data_strength reports the resolved city and its Qloo data badge", async () => {
    const r = await cityDataStrength({ city: "Houston, TX" }, { makeTools: (on) => createTools(fakeApi(data), on) });
    expect(r.text).toMatch(/Houston, TX[^]*(strong|medium|thin)/);
    expect((await cityDataStrength({ city: "Atlantis" }, { makeTools: (on) => createTools(fakeApi(data), on) })).isError).toBe(true);
  });
});
