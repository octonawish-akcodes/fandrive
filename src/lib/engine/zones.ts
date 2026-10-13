import type { HeatCell } from "@/lib/qloo/types";
import { ZONE } from "./weights";

export type LiftCell = { geohash: string; lat: number; lon: number; lift: number };
export type Zone = { id: string; lat: number; lon: number; radiusKm: number; meanLift: number; cellCount: number };

export function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371, rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function liftCells(partner: HeatCell[], baselines: HeatCell[][]): LiftCell[] {
  const maps = baselines.map((b) => new Map(b.map((c) => [c.geohash, c.affinityRank])));
  const need = Math.ceil(maps.length / 2);
  const out: LiftCell[] = [];
  for (const c of partner) {
    const ranks = maps.map((m) => m.get(c.geohash)).filter((x): x is number => typeof x === "number");
    if (!ranks.length || ranks.length < need) continue;
    out.push({ geohash: c.geohash, lat: c.lat, lon: c.lon, lift: c.affinityRank - ranks.reduce((a, b) => a + b, 0) / ranks.length });
  }
  return out.sort((a, b) => b.lift - a.lift);
}

export function clusterZones(cells: LiftCell[], opts: { topCells?: number; clusterKm?: number; maxZones?: number } = {}): Zone[] {
  const { topCells, clusterKm, maxZones } = { ...ZONE, ...opts };
  const groups: { members: LiftCell[]; lat: number; lon: number }[] = [];
  for (const c of cells.slice(0, topCells)) {
    const g = groups.find((z) => haversineKm(z, c) <= clusterKm);
    if (g) {
      g.members.push(c);
      g.lat = g.members.reduce((s, m) => s + m.lat, 0) / g.members.length;
      g.lon = g.members.reduce((s, m) => s + m.lon, 0) / g.members.length;
    } else groups.push({ members: [c], lat: c.lat, lon: c.lon });
  }
  return groups
    .map((g) => ({ g, total: g.members.reduce((s, m) => s + m.lift, 0) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, maxZones)
    .map(({ g }, i) => ({
      id: `z${i + 1}`, lat: g.lat, lon: g.lon, cellCount: g.members.length,
      meanLift: g.members.reduce((s, m) => s + m.lift, 0) / g.members.length,
      radiusKm: Math.max(0.5, ...g.members.map((m) => haversineKm(g, m))),
    }));
}
