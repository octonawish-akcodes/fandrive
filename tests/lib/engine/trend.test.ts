import { describe, expect, it } from "vitest";
import { momentum } from "@/lib/engine/trend";

const pts = (...ps: number[]) => ps.map((p, i) => ({ date: `2025-07-${String(10 + i).padStart(2, "0")}`, percentile: p }));

describe("momentum", () => {
  it("reads rising, cooling and steady from the first to the last point, oldest first", () => {
    expect(momentum(pts(0.5, 0.55, 0.6))).toMatchObject({ direction: "rising", changePct: 20 });
    expect(momentum(pts(0.6, 0.5, 0.45))).toMatchObject({ direction: "cooling", changePct: -25 });
    expect(momentum(pts(0.5, 0.51, 0.51))).toMatchObject({ direction: "steady", changePct: 2 });
    expect(momentum([...pts(0.5, 0.55, 0.6)].reverse())).toMatchObject({ direction: "rising" });
  });
  it("is null with fewer than 3 points", () => {
    expect(momentum(pts(0.5, 0.6))).toBeNull();
    expect(momentum([])).toBeNull();
  });
});
