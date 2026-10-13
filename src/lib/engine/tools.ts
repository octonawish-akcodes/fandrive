import { QlooError } from "@/lib/qloo/client";
import { ageSignal, type QlooApi } from "@/lib/qloo/api";
import type { AgeBand, Demographics, EntityType, HeatCell, Locality } from "@/lib/qloo/types";
import { matchConfidence } from "./match";
import { confidenceLevel, pullScores, youthSkew } from "./scoring";
import { clusterZones, liftCells, type LiftCell, type Zone } from "./zones";
import { rankVenues, type Venue } from "./venues";
import { BADGE, MATCH_OK, VENUE_RADIUS_M, ZONE } from "./weights";

export type NameRef = { name: string; type: EntityType };
export type Resolved = NameRef & { status: "ok" | "mismatch" | "not_found"; entityId?: string; matchedName?: string; match: number };
export type Evidence = { label: string; source: string; value: string };
export type Partner = {
  entityId: string; name: string; type: EntityType; query: string; match: number; youthSkew: number;
  localLove: number | null; density: number; pull: number; confidence: "high" | "medium" | "low"; evidence: Evidence[];
};
export type Excluded = { query: string; type: EntityType; reason: string };
export type CityBadge = "strong" | "medium" | "thin";
export type CityStrength = { locality: Locality; badge: CityBadge; cells: number };
export type MappedZone = Zone & { name: string; venues: { host: Venue[]; promote: Venue[] } };
export type ToolEvent = { tool: string; message: string };
export class CityNotFoundError extends Error {
  constructor(public city: string) { super(`City not found: ${city}`); this.name = "CityNotFoundError"; }
}

export const BASELINE: NameRef[] = [
  { name: "Coca-Cola", type: "brand" }, { name: "Netflix", type: "brand" }, { name: "McDonald's", type: "brand" },
  { name: "National Football League", type: "brand" }, { name: "Taylor Swift", type: "artist" },
];

const soft = (e: unknown) => e instanceof QlooError && e.kind === "bad_request";
const orSoft = <T>(fallback: T) => (e: unknown): T => { if (soft(e)) return fallback; throw e; };
const signed = (x: number) => (x >= 0 ? "+" : "") + x.toFixed(2);
const density = (cells: LiftCell[]) => cells.slice(0, ZONE.topCells).reduce((s, c) => s + Math.max(0, c.lift), 0);

export function createTools(api: QlooApi, emit: (e: ToolEvent) => void = () => {}) {
  let baselineIdsP: Promise<string[]> | null = null;
  const baselineCells = new Map<string, Promise<HeatCell[][]>>();

  async function resolveOne(r: NameRef): Promise<Resolved> {
    const hits = await api.search(r.name, r.type, 5).catch(orSoft([]));
    if (!hits.length) return { ...r, status: "not_found", match: 0 };
    const best = hits.map((h) => ({ h, m: matchConfidence(r.name, h.name) })).sort((a, b) => b.m - a.m || b.h.popularity - a.h.popularity)[0];
    return { ...r, status: best.m >= MATCH_OK ? "ok" : "mismatch", entityId: best.h.entityId, matchedName: best.h.name, match: best.m };
  }
  const baselineIds = () => (baselineIdsP ??= Promise.all(BASELINE.map(resolveOne)).then((rs) => rs.filter((r) => r.status === "ok").map((r) => r.entityId!)));
  const baselines = (city: string) => {
    if (!baselineCells.has(city)) baselineCells.set(city, baselineIds().then((ids) =>
      Promise.all(ids.map((i) => api.heatmap({ city, ids: [i] }).then((h) => h.cells).catch(orSoft<HeatCell[]>([]))))));
    return baselineCells.get(city)!;
  };
  async function partnerLift(city: string, entityId: string): Promise<LiftCell[]> {
    const [own, base] = await Promise.all([api.heatmap({ city, ids: [entityId] }).catch(orSoft({ cells: [] as HeatCell[], locality: null })), baselines(city)]);
    return liftCells(own.cells, base);
  }

  async function findAndConfirm(refs: NameRef[]): Promise<Resolved[]> {
    emit({ tool: "find_and_confirm", message: `Looking up ${refs.length} names in Qloo and confirming each match` });
    return Promise.all(refs.map(resolveOne));
  }

  async function fanAge(ids: string[]): Promise<Map<string, Demographics | null>> {
    emit({ tool: "fan_age", message: `Checking how young ${ids.length} fan bases are` });
    return new Map(await Promise.all(ids.map(async (i) => [i, await api.demographics(i).catch(orSoft(null))] as const)));
  }

  async function cityFit(city: string, rs: { entityId: string; type: EntityType }[], band: AgeBand): Promise<Map<string, number>> {
    emit({ tool: "city_fit", message: `Scoring how much young people in ${city} love each one` });
    const byType = new Map<EntityType, string[]>();
    for (const r of rs) byType.set(r.type, [...(byType.get(r.type) ?? []), r.entityId]);
    const maps = await Promise.all([...byType].map(([type, ids]) =>
      api.cityAffinity({ city, type, ids, ageSignal: ageSignal(band) }).catch(orSoft(new Map<string, number>()))));
    return new Map(maps.flatMap((m) => [...m]));
  }

  async function cityStrength(city: string): Promise<CityStrength> {
    emit({ tool: "city_strength", message: `Checking how much Qloo data exists for ${city}` });
    const [anchor] = await baselineIds();
    const h = await api.heatmap({ city, ids: [anchor] }).catch((e) => { if (soft(e)) throw new CityNotFoundError(city); throw e; });
    if (!h.locality || !h.cells.length) throw new CityNotFoundError(city);
    const n = h.cells.length;
    return { locality: h.locality, cells: n, badge: n >= BADGE.strong ? "strong" : n >= BADGE.medium ? "medium" : "thin" };
  }

  async function fanZones(city: string, entityId: string): Promise<Zone[]> {
    return clusterZones(await partnerLift(city, entityId));
  }

  async function venuesNear(zone: Zone, entityId: string, date?: string) {
    const places = await api.placesNear({ lat: zone.lat, lon: zone.lon, radiusM: VENUE_RADIUS_M, signalIds: [entityId], take: 20 }).catch(orSoft([]));
    const counts = new Map<string, number>();
    for (const p of places) if (p.neighborhood) counts.set(p.neighborhood, (counts.get(p.neighborhood) ?? 0) + 1);
    const top = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0];
    const venues = rankVenues(places, date);
    return { name: top ?? (venues.host[0] ? `Near ${venues.host[0].name}` : `Zone ${zone.id}`), venues };
  }

  async function scorePartners(a: { city: string; band: AgeBand; refs: NameRef[]; cityBadge: CityBadge }): Promise<{ ranked: Partner[]; excluded: Excluded[] }> {
    const resolved = await findAndConfirm(a.refs);
    const excluded: Excluded[] = resolved.filter((r) => r.status !== "ok").map((r) => ({ query: r.name, type: r.type,
      reason: r.status === "not_found" ? "Not found in Qloo" : `Qloo matched "${r.matchedName}" — not the same, skipped` }));
    const ok = [...new Map(resolved.filter((r) => r.status === "ok").map((r) => [r.entityId!, r])).values()];
    const ages = await fanAge(ok.map((r) => r.entityId!));
    const usable = ok.filter((r) => {
      const d = ages.get(r.entityId!);
      const y = d ? youthSkew(d, a.band) : null;
      if (y === null) excluded.push({ query: r.name, type: r.type, reason: "Not enough Qloo data (no audience profile yet)" });
      return y !== null;
    });
    emit({ tool: "fan_zones", message: `Measuring where each fan base lives in ${a.city}` });
    const [fit, lifts] = await Promise.all([
      cityFit(a.city, usable.map((r) => ({ entityId: r.entityId!, type: r.type })), a.band),
      Promise.all(usable.map((r) => partnerLift(a.city, r.entityId!))),
    ]);
    const rows = usable.map((r, i) => ({ id: r.entityId!, youth: youthSkew(ages.get(r.entityId!)!, a.band)!, local: fit.get(r.entityId!) ?? null, density: density(lifts[i]) }));
    const pull = pullScores(rows);
    const ranked: Partner[] = usable.map((r, i) => {
      const row = rows[i];
      return {
        entityId: row.id, name: r.matchedName!, type: r.type, query: r.name, match: r.match, youthSkew: row.youth,
        localLove: row.local, density: row.density, pull: pull.get(row.id)!,
        confidence: confidenceLevel({ match: r.match, hasLocal: row.local !== null, cityBadge: a.cityBadge }),
        evidence: [
          { label: `Fan-base age skew (${a.band})`, source: "Qloo insights · filter.type=urn:demographics", value: signed(row.youth) },
          { label: `Young-audience affinity in ${a.city}`, source: "Qloo insights · signal.location.query + signal.demographics.age + filter.results.entities",
            value: row.local === null ? "below Qloo threshold" : row.local.toFixed(2) },
          { label: "Fan concentration (top-30 heatmap lift)", source: "Qloo insights · filter.type=urn:heatmap vs city baseline", value: row.density.toFixed(2) },
        ],
      };
    }).sort((x, y) => y.pull - x.pull);
    return { ranked, excluded };
  }

  async function mapPartner(a: { city: string; partner: Pick<Partner, "entityId" | "name">; date?: string }): Promise<MappedZone[]> {
    emit({ tool: "map_partner", message: `Mapping where ${a.partner.name} fans live and finding venues nearby` });
    const zones = await fanZones(a.city, a.partner.entityId);
    return Promise.all(zones.map(async (z) => ({ ...z, ...(await venuesNear(z, a.partner.entityId, a.date)) })));
  }

  return { findAndConfirm, fanAge, cityFit, cityStrength, fanZones, venuesNear, scorePartners, mapPartner };
}
export type Tools = ReturnType<typeof createTools>;
