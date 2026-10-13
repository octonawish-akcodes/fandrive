import { describe, expect, it } from "vitest";
import { clusterZones, haversineKm, liftCells } from "@/lib/engine/zones";
import type { HeatCell } from "@/lib/qloo/types";

const cell = (geohash: string, lat: number, lon: number, affinityRank: number): HeatCell => ({ geohash, lat, lon, affinityRank, popularity: 0.5 });

describe("haversineKm", () => {
  it("measures ~111 km per degree of latitude", () => expect(haversineKm({ lat: 0, lon: 0 }, { lat: 1, lon: 0 })).toBeCloseTo(111.2, 0));
});

describe("liftCells", () => {
  it("subtracts the baseline mean and keeps cells most baselines cover", () => {
    const partner = [cell("a", 29.70, -95.52, 0.9), cell("b", 29.75, -95.39, 0.95), cell("z", 30, -95, 0.99)];
    const base1 = [cell("a", 29.70, -95.52, 0.5), cell("b", 29.75, -95.39, 0.94)];
    const base2 = [cell("a", 29.70, -95.52, 0.6), cell("b", 29.75, -95.39, 0.96)];
    const out = liftCells(partner, [base1, base2]);
    expect(out.map((c) => c.geohash)).toEqual(["a", "b"]); // "z" has no baseline coverage
    expect(out[0].lift).toBeCloseTo(0.35);
    expect(out[1].lift).toBeCloseTo(0.0);
  });
});

describe("clusterZones", () => {
  it("groups nearby cells and keeps the strongest zones", () => {
    const cells = [
      { geohash: "1", lat: 29.706, lon: -95.519, lift: 0.4 }, { geohash: "2", lat: 29.710, lon: -95.515, lift: 0.38 },
      { geohash: "3", lat: 29.735, lon: -95.320, lift: 0.3 }, { geohash: "4", lat: 29.691, lon: -95.209, lift: 0.1 },
      { geohash: "5", lat: 29.950, lon: -95.700, lift: 0.05 },
    ];
    const zones = clusterZones(cells, { topCells: 30, clusterKm: 2.5, maxZones: 3 });
    expect(zones).toHaveLength(3);
    expect(zones[0].cellCount).toBe(2);
    expect(zones[0].lat).toBeCloseTo(29.708, 2);
    expect(zones[0].radiusKm).toBeGreaterThanOrEqual(0.5);
  });
  it("returns no zones for no cells", () => expect(clusterZones([])).toEqual([]));
});
