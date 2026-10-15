import { describe, expect, it, vi } from "vitest";
import { runAutopilot, TooFewPartnersError } from "@/lib/agent/autopilot";
import { createTools } from "@/lib/engine/tools";
import { PlanInputSchema } from "@/lib/plan/schema";
import { fakeApi, heat, id } from "../../helpers/fakeApi";

const young = { age: { "24_and_younger": 0.8 }, gender: {} };
const data = {
  types: { "Houston Astros": "brand" as const },
  demo: { [id("Sabrina Carpenter")]: young, [id("Olivia Rodrigo")]: young, [id("Bad Bunny")]: young, [id("Houston Astros")]: { age: { "24_and_younger": -0.01 }, gender: {} } },
  heat: { [id("Sabrina Carpenter")]: heat([["g1", 0.9], ["g2", 0.8], ["g3", 0.6]]) },
  places: [{ entityId: "p1", name: "Fitness Connection", lat: 29.70, lon: -95.52, affinity: 0.8, neighborhood: "Sharpstown", genre: "gym", tags: [] }],
};
const input = PlanInputSchema.parse({ city: "Houston", startDate: "2026-11-14", endDate: "2026-11-30", partners: ["Houston Astros"] });
const city = { name: "Houston", lat: 29.76, lon: -95.37, badge: "strong" as const, cells: 1500 };

describe("runAutopilot", () => {
  it("scores seeds + user names, maps the top 2 and writes template creative", async () => {
    const r = await runAutopilot({ input, city, tools: createTools(fakeApi(data)) });
    expect(r.partners.length).toBeGreaterThanOrEqual(3);
    expect(r.partners.map((p) => p.name)).toContain("Houston Astros");
    expect(r.maps).toHaveLength(2);
    expect(r.usedTemplate).toBe(true);
    expect(r.creative.theme).toContain(r.partners[0].name);
  });
  it("adds Qloo's local taste to the candidates and leads with a local pick, mapped", async () => {
    const local = { ...data, demo: { ...data.demo, [id("Don Toliver")]: { age: { "24_and_younger": 0.4 }, gender: {} } }, local: { artist: [{ name: "Don Toliver", popularity: 0.99 }] } };
    const r = await runAutopilot({ input, city, tools: createTools(fakeApi(local)) });
    expect(r.partners[1].name).toBe("Don Toliver");
    expect(r.partners[1].local).toBe(true);
    expect(r.maps.map((m) => m.partnerName)).toContain("Don Toliver");
  });
  it("reuses state from an interrupted agent run without re-scoring", async () => {
    const api = fakeApi(data);
    const spy = vi.spyOn(api, "search");
    const tools = createTools(api);
    const first = await runAutopilot({ input, city, tools });
    spy.mockClear();
    await runAutopilot({ input, city, tools, state: { ranked: first.partners, excluded: first.excluded, maps: first.maps } });
    expect(spy).not.toHaveBeenCalled();
  });
  it("throws TooFewPartnersError below 3 usable partners", async () => {
    const thin = { ...data, demo: { [id("Sabrina Carpenter")]: young } };
    await expect(runAutopilot({ input, city, tools: createTools(fakeApi(thin)) })).rejects.toBeInstanceOf(TooFewPartnersError);
  });
});
