import { LOCAL_TASTE } from "@/lib/engine/weights";
import { QlooError } from "@/lib/qloo/client";
import type { QlooApi } from "@/lib/qloo/api";
import type { Demographics, EntityType, HeatCell, QlooPlace } from "@/lib/qloo/types";

export type FakeData = {
  alias?: Record<string, string>; notFound?: string[]; types?: Record<string, EntityType>;
  demo?: Record<string, Demographics | "invalid">; cityFit?: Record<string, number>;
  heat?: Record<string, HeatCell[]>; places?: QlooPlace[]; hostPlaces?: QlooPlace[]; badCities?: string[]; authFail?: boolean;
  fanTags?: Record<string, string[]>; rawTags?: Record<string, { name: string; subtype: string }[]>; trend?: Record<string, { date: string; percentile: number }[]>; tagLookups?: string[];
  local?: Partial<Record<EntityType, LocalEntry[]>>; // the planned city (and any city not in the panel)
  localByCity?: Record<string, Partial<Record<EntityType, LocalEntry[]>>>; // reference-panel cities default to empty
};
type LocalEntry = { name: string; popularity: number; tags?: string[] };
export const id = (name: string) => `id:${name}`;
export const heat = (pairs: [string, number][]): HeatCell[] =>
  pairs.map(([g, r], i) => ({ geohash: g, lat: 29.70 + i * 0.004, lon: -95.52 + i * 0.004, affinityRank: r, popularity: 0.5 }));

export function fakeApi(d: FakeData): QlooApi {
  const bad = () => new QlooError("bad_request", 400, "invalid");
  return {
    async search(query, type) {
      if (d.authFail) throw new QlooError("auth", 401, "bad key");
      if (d.notFound?.includes(query)) return [];
      return [{ entityId: id(query), name: d.alias?.[query] ?? query, type: type ?? d.types?.[query] ?? "artist", popularity: 0.9 }];
    },
    async demographics(entityId) {
      const v = d.demo?.[entityId];
      if (v === "invalid") throw bad();
      return v ?? null;
    },
    async cityAffinity({ ids }) { return new Map(ids.filter((i) => d.cityFit?.[i] !== undefined).map((i) => [i, d.cityFit![i]])); },
    async heatmap({ city, ids }) {
      if (d.badCities?.includes(city)) throw bad();
      return { cells: d.heat?.[ids[0]] ?? heat([["g1", 0.5], ["g2", 0.5], ["g3", 0.5]]), locality: { name: city, lat: 29.76, lon: -95.37 } };
    },
    async placesNear(a) { return a.tags?.length ? d.hostPlaces ?? [] : d.places ?? []; },
    async tasteTags(entityId) { return d.rawTags?.[entityId] ?? (d.fanTags?.[entityId] ?? []).map((name) => ({ name, subtype: "urn:tag:genre:music" })); },
    async findTags(query) { d.tagLookups?.push(query); return [{ id: `urn:tag:category:place:${query.replace(/\s+/g, "_")}`, name: query }]; },
    async trending({ id: eid }) { return d.trend?.[eid] ?? []; },
    async localTaste({ city, type }) {
      const lists = d.localByCity?.[city] ?? (LOCAL_TASTE.panel.some((p) => p.city === city) ? {} : d.local);
      return (lists?.[type] ?? []).map((e) => ({ entityId: id(e.name), name: e.name, type, popularity: e.popularity, tags: e.tags ?? [] }));
    },
  };
}
