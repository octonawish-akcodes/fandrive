import { describe, expect, it } from "vitest";
import { byYoungDonorFit, confidenceLevel, minMax, pullScores, youthSkew } from "@/lib/engine/scoring";

describe("youthSkew", () => {
  it("uses 24_and_younger for 16-24 and the mean for 18-29", () => {
    const d = { age: { "24_and_younger": 0.8, "25_to_29": 0.4 }, gender: {} };
    expect(youthSkew(d, "16-24")).toBe(0.8);
    expect(youthSkew(d, "18-29")).toBeCloseTo(0.6);
  });
  it("returns null when the band is missing", () => expect(youthSkew({ age: {}, gender: {} }, "16-24")).toBeNull());
});

describe("minMax", () => {
  it("normalises, keeps nulls, and gives 0.5 when all equal", () => {
    expect(minMax([1, 3, null])).toEqual([0, 1, null]);
    expect(minMax([2, 2])).toEqual([0.5, 0.5]);
  });
});

describe("pullScores", () => {
  it("ranks a young, locally loved partner above an old one", () => {
    const s = pullScores([
      { id: "sabrina", youth: 0.85, local: 0.9, density: 10 },
      { id: "metallica", youth: -0.13, local: null, density: 2 },
    ]);
    expect(s.get("sabrina")!).toBeGreaterThan(s.get("metallica")!);
    expect(s.get("sabrina")!).toBeLessThanOrEqual(1);
    expect(s.get("metallica")!).toBeGreaterThanOrEqual(0);
  });
  it("does not inflate an all-old shortlist (youth is absolute)", () => {
    const s = pullScores([{ id: "a", youth: -0.6, local: null, density: null }, { id: "b", youth: -0.5, local: null, density: null }]);
    expect(Math.max(...s.values())).toBeLessThan(0.2);
  });
});

describe("confidenceLevel", () => {
  it("is high only with good match, local data and a strong city", () => {
    expect(confidenceLevel({ match: 1, hasLocal: true, cityBadge: "strong" })).toBe("high");
    expect(confidenceLevel({ match: 1, hasLocal: false, cityBadge: "strong" })).toBe("medium");
    expect(confidenceLevel({ match: 0.5, hasLocal: true, cityBadge: "strong" })).toBe("low");
    expect(confidenceLevel({ match: 1, hasLocal: true, cityBadge: "thin" })).toBe("low");
  });
});

describe("byYoungDonorFit", () => {
  it("ranks every young-skewing fan base above older-skewing ones, then by pull", () => {
    const ps = [{ name: "Old but local", youthSkew: -0.22, pull: 0.86 }, { name: "Young", youthSkew: 0.71, pull: 0.8 }, { name: "Neutral-old", youthSkew: -0.04, pull: 0.9 }, { name: "Younger", youthSkew: 0.4, pull: 0.85 }];
    expect([...ps].sort(byYoungDonorFit).map((p) => p.name)).toEqual(["Younger", "Young", "Neutral-old", "Old but local"]);
  });
});
