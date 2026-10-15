import { describe, expect, it } from "vitest";
import { aggregate, cityMetrics, renderMarkdown, repeats, type CityEval } from "@/lib/eval/metrics";

const houston: CityEval = {
  city: "Houston, TX", badge: "medium",
  plainAi: [
    { name: "Travis Scott", matchedName: "Travis Scott", youthSkew: 0.46 },
    { name: "Houston Rockets", matchedName: "Houston Rockets", youthSkew: 0.3 },
    { name: "Megan Thee Stallion", matchedName: "Megan Thee Stallion", youthSkew: 0.22 },
    { name: "Made-up Band", youthSkew: null },
  ],
  fanDrive: [{ name: "Kai Cenat", youthSkew: 0.88, pull: 0.84 }, { name: "Travis Scott", youthSkew: 0.46, pull: 0.9 }, { name: "Fortnite", youthSkew: 0.72, pull: 0.8 }],
};
const mumbai: CityEval = {
  city: "Mumbai", badge: "thin",
  plainAi: [{ name: "Karan Aujla", matchedName: "Karan Aujla", youthSkew: -0.2 }, { name: "MostlySane", youthSkew: null }],
  fanDrive: [{ name: "Minecraft", youthSkew: 0.42, pull: 0.7 }, { name: "Fortnite", youthSkew: 0.72, pull: 0.6 }, { name: "MrBeast", youthSkew: 0.6, pull: 0.5 }],
};

describe("eval metrics", () => {
  it("scores one city: plain-AI verdict shares, mean skews and the young picks it missed", () => {
    const m = cityMetrics(houston);
    expect(m.plain).toEqual({ picks: 4, young: 2, notYoung: 1, older: 0, noData: 1, meanSkew: 0.33 });
    expect(m.fanDrive).toEqual({ picks: 3, young: 3, meanSkew: 0.69 });
    expect(m.missed).toEqual(["Kai Cenat", "Fortnite"]);
  });
  it("pools every pick across cities rather than averaging city averages", () => {
    const a = aggregate([houston, mumbai]);
    expect(a.cities).toBe(2);
    expect(a.plain).toEqual({ picks: 6, young: 2, notYoung: 2, older: 1, noData: 2, meanSkew: 0.2 });
    expect(a.fanDrive).toEqual({ picks: 6, young: 6, meanSkew: 0.63 });
    expect(a.citiesWithMiss).toBe(2);
    expect(a.missedPicks).toBe(5);
  });
  it("renders a markdown table with signed skews and a dash for missing data", () => {
    const md = renderMarkdown([houston, mumbai]);
    expect(md).toContain("| Houston, TX | medium |");
    expect(md).toContain("Made-up Band (no data)");
    expect(md).toContain("Karan Aujla (−0.20)");
    expect(md).toContain("Kai Cenat (+0.88)");
  });
  it("counts how often each fandom lands in FanDrive's top 3, most frequent first", () => {
    expect(repeats([houston, mumbai])).toEqual([["Fortnite", 2], ["Kai Cenat", 1], ["Travis Scott", 1], ["Minecraft", 1], ["MrBeast", 1]]);
  });
  it("handles a city where nothing had data", () => {
    expect(cityMetrics({ city: "X", badge: "thin", plainAi: [{ name: "A", youthSkew: null }], fanDrive: [] }).plain.meanSkew).toBeNull();
  });
});
