import { QlooError } from "@/lib/qloo/client";
import { ageSignal, type QlooApi } from "@/lib/qloo/api";
import type { AgeBand, Demographics, EntityType, HeatCell, Locality, QlooPlace } from "@/lib/qloo/types";
import { matchConfidence } from "./match";
import { byYoungDonorFit, confidenceLevel, pullScores, youthSkew } from "./scoring";
import { clusterZones, haversineKm, liftCells, type LiftCell, type Zone } from "./zones";
import { rankVenues, type Venue } from "./venues";
import { momentum, TREND_TYPES, TREND_WINDOW, type Momentum } from "./trend";
import { BADGE, HOST_TAG_QUERIES, MATCH_OK, VENUE_RADIUS_M, ZONE } from "./weights";

/** Safe "fans also love" tags: music/film/game genres, media keywords, game styles and Qloo categories.
 *  Never religion, identity/inclusivity, endorsements, places, occupations or themes (e.g. "Violence"). */
const CULTURE_TAG = /^urn:tag:(genre:(?!place)[a-z_]+|keyword:media|gameplay_type:qloo|category:qloo)$/;
/** Identity words never shown next to a fandom, whatever Qloo's subtype says. */
const IDENTITY_WORD = /\b(african|afro-american|black-owned|white|caucasian|asian|hispanic|latin[ao]s?|latinx|jewish|muslim|islam\w*|christian\w*|catholic\w*|hindu\w*|sikh\w*|buddhis\w*|religio\w*|gay|lesbian|lgbt\w*|queer|transgender|ethnic\w*|racial|race)\b/i;

export type NameRef = { name: string; type: EntityType };
export type Resolved = NameRef & { status: "ok" | "mismatch" | "not_found"; entityId?: string; matchedName?: string; match: number };
export type Evidence = { label: string; source: string; value: string };
export type Partner = {
  entityId: string; name: string; type: EntityType; query: string; match: number; youthSkew: number;
  localLove: number | null; density: number; pull: number; confidence: "high" | "medium" | "low"; evidence: Evidence[];
  fanTags?: string[]; momentum?: Momentum | null; // filled for the top picks only
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

const PRIORITY: EntityType[] = ["artist", "brand", "tv_show", "videogame", "person", "movie", "podcast"];

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

  function zoneVenues(zone: Zone, places: QlooPlace[], date?: string) {
    const counts = new Map<string, number>();
    for (const p of places) if (p.neighborhood) counts.set(p.neighborhood, (counts.get(p.neighborhood) ?? 0) + 1);
    const top = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0];
    const venues = rankVenues(places, date);
    return { name: top ?? (venues.host[0] ? `Near ${venues.host[0].name}` : `Fan zone ${zone.id.replace(/^z/, "")}`), venues };
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
    }).sort(byYoungDonorFit);
    return { ranked, excluded };
  }

  let hostTags: Promise<string[]> | null = null;
  /** Qloo place-tag ids for host-capable venues, looked up once per run. */
  function hostTagIds(): Promise<string[]> {
    hostTags ??= Promise.all(HOST_TAG_QUERIES.map((q) => api.findTags(q, "place").then((ts) => ts.find((t) => t.id?.startsWith("urn:tag:category:place:"))?.id).catch(() => undefined)))
      .then((ids) => [...new Set(ids.filter((x): x is string => !!x))]);
    return hostTags;
  }

  /** What else this fan base loves: culture tags only (genres, media keywords, game styles, categories). */
  async function fanTags(entityId: string): Promise<string[]> {
    const seen = new Set<string>();
    return (await api.tasteTags(entityId).catch(() => [] as { name: string; subtype: string }[]))
      .filter((t) => CULTURE_TAG.test(t.subtype) && !IDENTITY_WORD.test(t.name) && !seen.has(t.name.toLowerCase()) && seen.add(t.name.toLowerCase()))
      .map((t) => t.name).slice(0, 6);
  }

  /** Qloo momentum over its latest trending window, for TV, film, music and podcasts. */
  async function trendFor(p: Pick<Partner, "entityId" | "type">): Promise<Momentum | null> {
    if (!TREND_TYPES.includes(p.type)) return null;
    const pts = await api.trending({ id: p.entityId, type: p.type, start: TREND_WINDOW.start, end: TREND_WINDOW.end }).catch(() => []);
    return momentum(pts);
  }

  /** Taste tags and momentum for the top picks, as one visible step. */
  async function profileFans<P extends Pick<Partner, "entityId" | "name" | "type">>(ps: P[]): Promise<(P & { fanTags: string[]; momentum: Momentum | null })[]> {
    if (!ps.length) return [];
    emit({ tool: "profile_fans", message: `Finding what ${ps.map((p) => p.name).join(" and ")} fans also love, and whether they're trending` });
    return Promise.all(ps.map(async (p) => ({ ...p, fanTags: await fanTags(p.entityId), momentum: await trendFor(p) })));
  }

  async function mapPartner(a: { city: string; partner: Pick<Partner, "entityId" | "name">; date?: string }): Promise<MappedZone[]> {
    emit({ tool: "map_partner", message: `Mapping where ${a.partner.name} fans live and finding venues nearby` });
    const zones = await fanZones(a.city, a.partner.entityId);
    const tagIds = await hostTagIds();
    const found = await Promise.all(zones.map(async (z) => {
      const near = { lat: z.lat, lon: z.lon, radiusM: VENUE_RADIUS_M, signalIds: [a.partner.entityId] };
      const [general, hosts] = await Promise.all([
        api.placesNear({ ...near, take: 20 }).catch(orSoft<QlooPlace[]>([])),
        tagIds.length ? api.placesNear({ ...near, take: 10, tags: tagIds }).catch(() => [] as QlooPlace[]) : Promise.resolve([] as QlooPlace[]),
      ]);
      return [...general, ...hosts]; // campuses, halls and centres the general query can miss
    }));
    const owner = new Map<string, number>(); // search circles overlap, so each place belongs to its nearest zone only
    found.forEach((places, i) => places.forEach((p) => {
      const cur = owner.get(p.entityId);
      if (cur === undefined || haversineKm(p, zones[i]) < haversineKm(p, zones[cur])) owner.set(p.entityId, i);
    }));
    const mapped = zones.map((z, i) => {
      const mine = [...new Map(found[i].filter((p) => owner.get(p.entityId) === i).map((p) => [p.entityId, p])).values()];
      return { ...z, ...zoneVenues(z, mine, a.date) };
    });
    const used = new Set<string>();
    for (const z of mapped) { // a wide venue radius can give two zones the same neighbourhood
      const near = z.venues.host[0] ?? z.venues.promote[0];
      const options = [z.name, ...(near ? [`Near ${near.name}`] : []), ...[2, 3, 4].map((n) => `${z.name} ${n}`)];
      z.name = options.find((o) => !used.has(o)) ?? `Fan zone ${z.id.replace(/^z/, "")}`;
      used.add(z.name);
    }
    return mapped;
  }

  async function typeNames(names: string[]): Promise<{ refs: NameRef[]; unresolved: string[] }> {
    if (!names.length) return { refs: [], unresolved: [] };
    emit({ tool: "find_and_confirm", message: `Identifying ${names.length} partner names you entered` });
    const typed = await Promise.all(names.map(async (n) => {
      const hits = (await api.search(n, undefined, 8).catch(orSoft([]))).filter((h) => PRIORITY.includes(h.type));
      const best = hits.map((h) => ({ h, m: matchConfidence(n, h.name) })).filter((x) => x.m >= MATCH_OK)
        .sort((a, b) => b.m - a.m || PRIORITY.indexOf(a.h.type) - PRIORITY.indexOf(b.h.type))[0];
      return best ? { name: n, type: best.h.type } : null;
    }));
    return { refs: typed.filter((x): x is NameRef => x !== null), unresolved: names.filter((_, i) => typed[i] === null) };
  }

  return { findAndConfirm, typeNames, fanAge, cityFit, cityStrength, fanZones, scorePartners, mapPartner, fanTags, trendFor, profileFans };
}
export type Tools = ReturnType<typeof createTools>;
