import { describe, expect, it } from "vitest";
import { ageSignal, createQlooApi } from "@/lib/qloo/api";
import type { QlooClient } from "@/lib/qloo/client";
import type { Params } from "@/lib/qloo/types";

function fakeClient(route: (path: string, p: Params) => unknown): QlooClient & { calls: [string, Params][] } {
  const calls: [string, Params][] = [];
  return { calls, async get<T>(path: string, p: Params) { calls.push([path, p]); return route(path, p) as T; } };
}

describe("qloo api", () => {
  it("search maps hits", async () => {
    const c = fakeClient(() => ({ results: [{ entity_id: "E1", name: "Fortnite", types: ["urn:entity:videogame"], popularity: 0.95, disambiguation: "2017-07-21, Epic Games" }] }));
    const hits = await createQlooApi(c).search("Fortnite", "videogame");
    expect(hits).toEqual([{ entityId: "E1", name: "Fortnite", type: "videogame", popularity: 0.95, disambiguation: "2017-07-21, Epic Games" }]);
    expect(c.calls[0]).toEqual(["/search", { query: "Fortnite", types: "urn:entity:videogame", take: 5 }]);
  });
  it("search without a type omits the types param and reads the hit's own type", async () => {
    const c = fakeClient(() => ({ results: [{ entity_id: "A", name: "Bad Bunny", types: ["urn:entity:artist"], popularity: 0.9 }] }));
    const [hit] = await createQlooApi(c).search("Bad Bunny");
    expect(hit.type).toBe("artist");
    expect(c.calls[0][1]).toEqual({ query: "Bad Bunny", types: undefined, take: 5 });
  });
  it("demographics returns skews or null", async () => {
    const c = fakeClient(() => ({ results: { demographics: [{ entity_id: "E1", query: { age: { "24_and_younger": -0.13, "45_to_54": 0.44 }, gender: { male: 0.3, female: -0.3 } } }] } }));
    expect(await createQlooApi(c).demographics("E1")).toEqual({ age: { "24_and_younger": -0.13, "45_to_54": 0.44 }, gender: { male: 0.3, female: -0.3 } });
    const empty = fakeClient(() => ({ results: { demographics: [] } }));
    expect(await createQlooApi(empty).demographics("E1")).toBeNull();
  });
  it("cityAffinity scores a shortlist in one call", async () => {
    const c = fakeClient(() => ({ results: { entities: [{ entity_id: "A", name: "Bad Bunny", query: { affinity: 0.99 } }] } }));
    const m = await createQlooApi(c).cityAffinity({ city: "Miami", type: "artist", ids: ["A", "B"], ageSignal: "24_and_younger" });
    expect(m.get("A")).toBe(0.99);
    expect(m.has("B")).toBe(false);
    expect(c.calls[0][1]).toMatchObject({ "filter.type": "urn:entity:artist", "signal.location.query": "Miami", "signal.demographics.age": "24_and_younger", "filter.results.entities": "A,B", take: 2 });
  });
  it("localTaste asks what young people in a city over-index on, without an entity filter", async () => {
    const c = fakeClient(() => ({ results: { entities: [{ entity_id: "D", name: "Don Toliver", popularity: 0.99, query: { affinity: 1 }, tags: [{ name: "Rapper", type: "urn:tag:category:qloo" }], properties: { place_of_birth: "Houston, Harris County, Texas, U", date_of_birth: "1994-01-12" } }] } }));
    const r = await createQlooApi(c).localTaste({ city: "Houston, TX", type: "artist", ageSignal: "24_and_younger", take: 15 });
    expect(r).toEqual([{ entityId: "D", name: "Don Toliver", type: "artist", popularity: 0.99, tags: ["Rapper"], birthPlace: "Houston, Harris County, Texas, U", birthDate: "1994-01-12" }]);
    expect(c.calls[0][1]).toEqual({ "filter.type": "urn:entity:artist", "signal.location.query": "Houston, TX", "signal.demographics.age": "24_and_younger", take: 15 });
  });
  it("heatmap parses cells and the resolved locality", async () => {
    const c = fakeClient(() => ({
      results: { heatmap: [{ location: { latitude: 29.79, longitude: -95.41, geohash: "9vk1sb" }, query: { affinity: 1, affinity_rank: 0.99, popularity: 0.97 } }] },
      query: { localities: { filter: [{ name: "Springfield", disambiguation: "Springfield, Greene County, Missouri", location: { lat: 37.19, lon: -93.29 } }] } },
    }));
    const h = await createQlooApi(c).heatmap({ city: "Springfield", ids: ["A"] });
    expect(h.cells).toEqual([{ geohash: "9vk1sb", lat: 29.79, lon: -95.41, affinityRank: 0.99, popularity: 0.97 }]);
    expect(h.locality).toEqual({ name: "Springfield", disambiguation: "Springfield, Greene County, Missouri", lat: 37.19, lon: -93.29 });
  });
  it("placesNear parses venue fields", async () => {
    const c = fakeClient(() => ({ results: { entities: [{
      entity_id: "P1", name: "Arena Theatre", location: { lat: 29.702, lon: -95.517 }, query: { affinity: 0.86, distance: 454.5 },
      tags: [{ id: "urn:tag:audience:qloo:18_24", name: "18 24" }],
      properties: { neighborhood: "Sharpstown", address: "7326 Southwest Fwy", event_spaces: true, is_closed: false, primary_genre: { id: "urn:tag:genre:place:performing_arts_theater" },
        hours: { saturday: [{ opens: "T10:00:00", closes: "T22:00:00", closed: false }] } },
    }] } }));
    const [p] = await createQlooApi(c).placesNear({ lat: 29.706, lon: -95.519, radiusM: 2500, signalIds: ["A"] });
    expect(p).toMatchObject({ entityId: "P1", name: "Arena Theatre", lat: 29.702, lon: -95.517, affinity: 0.86, distanceM: 454.5, neighborhood: "Sharpstown", genre: "performing_arts_theater", tags: ["18 24"], eventSpaces: true, isClosed: false });
    expect(c.calls[0][1]).toMatchObject({ "filter.location": "POINT(-95.519 29.706)", "filter.location.radius": 2500, take: 20 });
  });
  it("ageSignal maps bands", () => {
    expect(ageSignal("16-24")).toBe("24_and_younger");
    expect(ageSignal("18-29")).toBe("24_and_younger,25_to_29");
  });
  it("tasteTags returns trimmed tag names with their Qloo subtype", async () => {
    const c = fakeClient(() => ({ results: { tags: [{ name: " Hip Hop", tag_id: "urn:tag:genre:music:hip_hop", subtype: "urn:tag:genre:music" }, { name: "trap", subtype: "urn:tag:genre:music" }] } }));
    expect(await createQlooApi(c).tasteTags("E1")).toEqual([{ name: "Hip Hop", subtype: "urn:tag:genre:music" }, { name: "trap", subtype: "urn:tag:genre:music" }]);
    expect(c.calls[0]).toEqual(["/v2/insights", { "filter.type": "urn:tag", "signal.interests.entities": "E1", take: 20 }]);
  });
  it("findTags looks up Qloo tag ids by name", async () => {
    const c = fakeClient(() => ({ results: { tags: [{ id: "urn:tag:category:place:university", name: "University" }] } }));
    expect(await createQlooApi(c).findTags("university", "place")).toEqual([{ id: "urn:tag:category:place:university", name: "University" }]);
    expect(c.calls[0]).toEqual(["/v2/tags", { "filter.query": "university", "filter.parents.types": "urn:entity:place", "feature.semantic_search": "true", take: 5 }]);
  });
  it("trending returns dated popularity percentiles", async () => {
    const c = fakeClient(() => ({ results: { trending: [{ date: "2025-09-28", population_percentile: 0.21 }, { date: "2025-09-25", population_percentile: 0.2 }] } }));
    expect(await createQlooApi(c).trending({ id: "E1", type: "tv_show", start: "2025-06-08", end: "2025-09-28" }))
      .toEqual([{ date: "2025-09-28", percentile: 0.21 }, { date: "2025-09-25", percentile: 0.2 }]);
    expect(c.calls[0]).toEqual(["/v2/trending", { "filter.type": "urn:entity:tv_show", "signal.interests.entities": "E1", "filter.start_date": "2025-06-08", "filter.end_date": "2025-09-28" }]);
  });
  it("placesNear can restrict to Qloo place tags (union)", async () => {
    const c = fakeClient(() => ({ results: { entities: [] } }));
    await createQlooApi(c).placesNear({ lat: 1, lon: 2, radiusM: 4000, signalIds: ["A"], tags: ["urn:tag:category:place:university", "urn:tag:category:place:library"] });
    expect(c.calls[0][1]).toMatchObject({ "filter.tags": "urn:tag:category:place:university,urn:tag:category:place:library", "operator.filter.tags": "union" });
  });
});
