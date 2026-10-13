import { expect, it } from "vitest";
import { circlePolygon } from "@/lib/geo/circle";
import { haversineKm } from "@/lib/engine/zones";

it("returns a closed ring at the requested radius", () => {
  const ring = circlePolygon(29.7, -95.5, 2, 32);
  expect(ring).toHaveLength(33);
  expect(ring[0]).toEqual(ring[32]);
  for (const [lon, lat] of ring.slice(0, 32)) expect(haversineKm({ lat: 29.7, lon: -95.5 }, { lat, lon })).toBeCloseTo(2, 1);
});
