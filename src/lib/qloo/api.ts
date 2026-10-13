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
    async heatmap(a: { city: string; ids: string[] }): Promise<{ cells: HeatCell[]; locality: Locality | null }> {
      const b = await client.get<Raw>("/v2/insights", { "filter.type": "urn:heatmap", "filter.location.query": a.city, "signal.interests.entities": a.ids.join(",") });
      const cells: HeatCell[] = (b.results?.heatmap ?? []).map((c: Raw) => ({
        geohash: c.location.geohash, lat: c.location.latitude, lon: c.location.longitude,
        affinityRank: c.query?.affinity_rank ?? 0, popularity: c.query?.popularity ?? 0,
      }));
      return { cells, locality: parseLocality(b) };
    },
    async placesNear(a: { lat: number; lon: number; radiusM: number; signalIds: string[]; take?: number }): Promise<QlooPlace[]> {
      const b = await client.get<Raw>("/v2/insights", {
        "filter.type": "urn:entity:place", "filter.location": `POINT(${a.lon} ${a.lat})`, "filter.location.radius": a.radiusM,
        "signal.interests.entities": a.signalIds.join(","), take: a.take ?? 20,
      });
      return (b.results?.entities ?? []).map(parsePlace);
    },
  };
}
