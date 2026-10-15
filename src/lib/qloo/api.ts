import type { QlooClient } from "./client";
import type { AgeBand, Demographics, EntityType, HeatCell, Locality, QlooPlace, SearchHit } from "./types";

type Raw = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const stripUrn = (t?: string) => (t ?? "").replace("urn:entity:", "");

export function ageSignal(band: AgeBand): string {
  return band === "16-24" ? "24_and_younger" : "24_and_younger,25_to_29";
}

function parseLocality(body: Raw): Locality | null {
  const l = body?.query?.localities?.filter?.[0] ?? body?.query?.localities?.signal;
  return l?.location ? { name: l.name, disambiguation: l.disambiguation, lat: l.location.lat, lon: l.location.lon } : null;
}

function parsePlace(e: Raw): QlooPlace {
  const p = e.properties ?? {};
  return {
    entityId: e.entity_id, name: e.name, lat: e.location?.lat, lon: e.location?.lon,
    affinity: e.query?.affinity ?? 0, distanceM: e.query?.distance,
    neighborhood: p.neighborhood ?? p.geocode?.name, address: p.address,
    genre: typeof p.primary_genre?.id === "string" ? p.primary_genre.id.split(":").pop() : undefined,
    tags: (e.tags ?? []).map((t: Raw) => t.name).filter(Boolean),
    eventSpaces: p.event_spaces ?? undefined, isClosed: p.is_closed ?? undefined, hours: p.hours ?? undefined,
  };
}

export type QlooApi = ReturnType<typeof createQlooApi>;

export function createQlooApi(client: QlooClient) {
  return {
    async search(query: string, type?: EntityType, take = 5): Promise<SearchHit[]> {
      const b = await client.get<Raw>("/search", { query, types: type ? `urn:entity:${type}` : undefined, take });
      return (b.results ?? []).map((r: Raw) => ({
        entityId: r.entity_id, name: r.name, type: (stripUrn(r.types?.[0]) || type || "unknown") as EntityType,
        popularity: r.popularity ?? 0, disambiguation: r.disambiguation,
      }));
    },
    async demographics(entityId: string): Promise<Demographics | null> {
      const b = await client.get<Raw>("/v2/insights", { "filter.type": "urn:demographics", "signal.interests.entities": entityId });
      const q = b.results?.demographics?.[0]?.query;
      return q ? { age: q.age ?? {}, gender: q.gender ?? {} } : null;
    },
    async cityAffinity(a: { city: string; type: EntityType; ids: string[]; ageSignal: string }): Promise<Map<string, number>> {
      const b = await client.get<Raw>("/v2/insights", {
        "filter.type": `urn:entity:${a.type}`, "signal.location.query": a.city, "signal.demographics.age": a.ageSignal,
        "filter.results.entities": a.ids.join(","), take: a.ids.length,
      });
      return new Map((b.results?.entities ?? []).map((e: Raw) => [e.entity_id as string, e.query?.affinity as number]));
    },
    /** What young people in a city over-index on, ranked by Qloo (no entity filter). */
    async localTaste(a: { city: string; type: EntityType; ageSignal: string; take: number }): Promise<{ entityId: string; name: string; type: EntityType; popularity: number }[]> {
      const b = await client.get<Raw>("/v2/insights", { "filter.type": `urn:entity:${a.type}`, "signal.location.query": a.city, "signal.demographics.age": a.ageSignal, take: a.take });
      return (b.results?.entities ?? []).filter((e: Raw) => e.entity_id && e.name).map((e: Raw) => ({ entityId: e.entity_id, name: e.name, type: a.type, popularity: e.popularity ?? 0 }));
    },
    async heatmap(a: { city: string; ids: string[] }): Promise<{ cells: HeatCell[]; locality: Locality | null }> {
      const b = await client.get<Raw>("/v2/insights", { "filter.type": "urn:heatmap", "filter.location.query": a.city, "signal.interests.entities": a.ids.join(",") });
      const cells: HeatCell[] = (b.results?.heatmap ?? []).map((c: Raw) => ({
        geohash: c.location.geohash, lat: c.location.latitude, lon: c.location.longitude,
        affinityRank: c.query?.affinity_rank ?? 0, popularity: c.query?.popularity ?? 0,
      }));
      return { cells, locality: parseLocality(b) };
    },
    async placesNear(a: { lat: number; lon: number; radiusM: number; signalIds: string[]; take?: number; tags?: string[] }): Promise<QlooPlace[]> {
      const b = await client.get<Raw>("/v2/insights", {
        "filter.type": "urn:entity:place", "filter.location": `POINT(${a.lon} ${a.lat})`, "filter.location.radius": a.radiusM,
        "signal.interests.entities": a.signalIds.join(","), take: a.take ?? 20,
        "filter.tags": a.tags?.length ? a.tags.join(",") : undefined, "operator.filter.tags": a.tags?.length ? "union" : undefined,
      });
      return (b.results?.entities ?? []).map(parsePlace);
    },
    /** Tags a fan base over-indexes on, with Qloo's subtype (genre, category, religion, place…). Callers must filter. */
    async tasteTags(entityId: string, take = 20): Promise<{ name: string; subtype: string }[]> {
      const b = await client.get<Raw>("/v2/insights", { "filter.type": "urn:tag", "signal.interests.entities": entityId, take });
      return (b.results?.tags ?? []).map((t: Raw) => ({ name: String(t.name ?? "").trim(), subtype: String(t.subtype ?? "") })).filter((t: { name: string }) => t.name);
    },
    /** Qloo tag ids by name, e.g. "university" → urn:tag:category:place:university. */
    async findTags(query: string, parentType: EntityType, take = 5): Promise<{ id: string; name: string }[]> {
      const b = await client.get<Raw>("/v2/tags", { "filter.query": query, "filter.parents.types": `urn:entity:${parentType}`, "feature.semantic_search": "true", take });
      return (b.results?.tags ?? []).map((t: Raw) => ({ id: t.id, name: t.name }));
    },
    /** Popularity percentile over time for one entity. */
    async trending(a: { id: string; type: EntityType; start: string; end: string }): Promise<{ date: string; percentile: number }[]> {
      const b = await client.get<Raw>("/v2/trending", { "filter.type": `urn:entity:${a.type}`, "signal.interests.entities": a.id, "filter.start_date": a.start, "filter.end_date": a.end });
      return (b.results?.trending ?? []).map((t: Raw) => ({ date: t.date, percentile: Number(t.population_percentile) }));
    },
  };
}
