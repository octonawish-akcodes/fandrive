import { describe, expect, it, vi } from "vitest";
import { CityNotFoundError, createTools } from "@/lib/engine/tools";
import { seedPartners } from "@/lib/engine/seeds";
import { fakeApi, heat, id } from "../../helpers/fakeApi";

const young = { age: { "24_and_younger": 0.85, "25_to_29": 0.69 }, gender: {} };
const old = { age: { "24_and_younger": -0.13, "25_to_29": 0.03 }, gender: {} };
const base = {
  alias: { "Alex Warren": "Alex Clare" }, notFound: ["Nobody Real"],
  demo: { [id("Sabrina Carpenter")]: young, [id("Metallica")]: old, [id("Ghost of Yotei")]: "invalid" as const },
  cityFit: { [id("Sabrina Carpenter")]: 0.95 },
  heat: { [id("Sabrina Carpenter")]: heat([["g1", 0.95], ["g2", 0.9], ["g3", 0.6]]), [id("Metallica")]: heat([["g1", 0.55], ["g2", 0.5], ["g3", 0.5]]) },
  places: [
    { entityId: "p1", name: "Fitness Connection", lat: 29.70, lon: -95.52, affinity: 0.8, neighborhood: "Sharpstown", genre: "gym", tags: ["18 24"] },
    { entityId: "p2", name: "Club Tropicana", lat: 29.70, lon: -95.52, affinity: 0.9, neighborhood: "Sharpstown", genre: "night_club", tags: [] },
    { entityId: "p3", name: "PlazAmericas", lat: 29.71, lon: -95.51, affinity: 0.7, neighborhood: "Gulfton", genre: "shopping_mall", tags: [] },
  ],
};

describe("scorePartners", () => {
  it("ranks young above old and explains exclusions", async () => {
    const t = createTools(fakeApi(base));
    const r = await t.scorePartners({ city: "Houston", band: "16-24", cityBadge: "strong", refs: [
      { name: "Metallica", type: "artist" }, { name: "Sabrina Carpenter", type: "artist" }, { name: "Alex Warren", type: "artist" },
      { name: "Ghost of Yotei", type: "videogame" }, { name: "Nobody Real", type: "artist" },
    ] });
    expect(r.ranked.map((p) => p.name)).toEqual(["Sabrina Carpenter", "Metallica"]);
    expect(r.ranked[0].confidence).toBe("high");
    expect(r.ranked[1].localLove).toBeNull();
    expect(r.ranked[0].evidence).toHaveLength(3);
    const reasons = Object.fromEntries(r.excluded.map((e) => [e.query, e.reason]));
    expect(reasons["Alex Warren"]).toContain('"Alex Clare"');
    expect(reasons["Ghost of Yotei"]).toContain("Not enough Qloo data");
    expect(reasons["Nobody Real"]).toBe("Not found in Qloo");
  });
  it("de-duplicates the same entity named twice", async () => {
    const r = await createTools(fakeApi(base)).scorePartners({ city: "Houston", band: "16-24", cityBadge: "strong",
      refs: [{ name: "Sabrina Carpenter", type: "artist" }, { name: "Sabrina Carpenter", type: "artist" }] });
    expect(r.ranked).toHaveLength(1);
  });
  it("propagates auth failures", async () => {
    await expect(createTools(fakeApi({ ...base, authFail: true })).scorePartners({ city: "Houston", band: "16-24", cityBadge: "strong",
      refs: [{ name: "Metallica", type: "artist" }] })).rejects.toMatchObject({ kind: "auth" });
  });
  it("emits progress events", async () => {
    const emit = vi.fn();
    await createTools(fakeApi(base), emit).scorePartners({ city: "Houston", band: "16-24", cityBadge: "strong", refs: [{ name: "Metallica", type: "artist" }] });
    expect(emit.mock.calls.map((c) => c[0].tool)).toEqual(expect.arrayContaining(["find_and_confirm", "fan_age", "city_fit", "fan_zones"]));
  });
});

describe("cityStrength", () => {
  it("rejects unknown cities", async () => {
    await expect(createTools(fakeApi({ ...base, badCities: ["asdfgh"] })).cityStrength("asdfgh")).rejects.toBeInstanceOf(CityNotFoundError);
  });
  it("returns the resolved locality and a badge", async () => {
    const s = await createTools(fakeApi(base)).cityStrength("Springfield");
    expect(s.locality.name).toBe("Springfield");
    expect(s.badge).toBe("thin");
  });
});

describe("mapPartner", () => {
  it("names zones by venue neighbourhood and splits host/promote venues", async () => {
    const zones = await createTools(fakeApi(base)).mapPartner({ city: "Houston", partner: { entityId: id("Sabrina Carpenter"), name: "Sabrina Carpenter" }, date: "2026-11-14" });
    expect(zones.length).toBeGreaterThan(0);
    expect(zones[0].name).toBe("Sharpstown");
    expect(zones[0].venues.host.map((v) => v.name)).toContain("Fitness Connection");
    expect(zones[0].venues.promote.map((v) => v.name)).toContain("Club Tropicana");
  });
  it("gives every zone a distinct name even when venues share a neighbourhood", async () => {
    const far = heat([["g1", 0.95], ["g2", 0.9], ["g3", 0.85]]).map((c, i) => ({ ...c, lat: 29.7 + i * 0.1 }));
    const zones = await createTools(fakeApi({ ...base, heat: { ...base.heat, [id("Sabrina Carpenter")]: far } }))
      .mapPartner({ city: "Houston", partner: { entityId: id("Sabrina Carpenter"), name: "Sabrina Carpenter" } });
    expect(zones.length).toBeGreaterThan(1);
    expect(new Set(zones.map((z) => z.name)).size).toBe(zones.length);
  });
  it("lists each venue once, in the zone nearest to it", async () => {
    const far = heat([["g1", 0.95], ["g2", 0.9], ["g3", 0.85]]).map((c, i) => ({ ...c, lat: 29.7 + i * 0.1, lon: -95.5 }));
    const P = (name: string, lat: number, genre: string) => ({ entityId: name, name, lat, lon: -95.5, affinity: 0.8, neighborhood: name, genre, tags: [] });
    const places = [P("Gym A", 29.7, "gym"), P("Mall B", 29.8, "shopping_mall"), P("Bar D", 29.8, "bar"), P("Campus C", 29.9, "university")];
    const zones = await createTools(fakeApi({ ...base, places, heat: { ...base.heat, [id("Sabrina Carpenter")]: far } }))
      .mapPartner({ city: "Houston", partner: { entityId: id("Sabrina Carpenter"), name: "Sabrina Carpenter" } });
    const at = (lat: number) => zones.find((z) => Math.abs(z.lat - lat) < 0.01)!;
    expect(at(29.7).venues.host.map((v) => v.name)).toEqual(["Gym A"]);
    expect(at(29.8).venues.host.map((v) => v.name)).toEqual(["Mall B"]);
    expect(at(29.8).venues.promote.map((v) => v.name)).toEqual(["Bar D"]);
    expect(at(29.9).venues.host.map((v) => v.name)).toEqual(["Campus C"]);
  });
  it("labels a zone with no venues as a numbered fan zone", async () => {
    const zones = await createTools(fakeApi({ ...base, places: [] }))
      .mapPartner({ city: "Houston", partner: { entityId: id("Sabrina Carpenter"), name: "Sabrina Carpenter" } });
    expect(zones[0].name).toBe("Fan zone 1");
  });
});

describe("seedPartners", () => {
  it("adds local teams for known cities and always returns a youth-heavy default", () => {
    expect(seedPartners("Houston, TX").map((s) => s.name)).toContain("Houston Astros");
    expect(seedPartners("Nowhere").length).toBeGreaterThanOrEqual(12);
  });
});
