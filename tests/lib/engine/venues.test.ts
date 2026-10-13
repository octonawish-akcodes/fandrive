import { describe, expect, it } from "vitest";
import { classifyVenue, rankVenues } from "@/lib/engine/venues";
import type { QlooPlace } from "@/lib/qloo/types";

const P = (o: Partial<QlooPlace>): QlooPlace => ({ entityId: o.name ?? "x", name: "x", lat: 0, lon: 0, affinity: 0.8, tags: [], ...o });

describe("classifyVenue", () => {
  it("never hosts at bars or nightclubs", () => {
    const v = classifyVenue(P({ name: "Club Tropicana", genre: "night_club", tags: ["18 24", "Loud"] }));
    expect(v.role).toBe("promote");
    expect(v.reasons).toContain("Promote here, don't host here (alcohol venue)");
  });
  it("hosts at gyms, campuses and event venues, with reasons", () => {
    const v = classifyVenue(P({ name: "Fitness Connection", genre: "gym", eventSpaces: true, tags: ["18 24"],
      hours: { saturday: [{ opens: "T06:00:00", closes: "T22:00:00", closed: false }] } }), "2026-11-14");
    expect(v.role).toBe("host");
    expect(v.reasons).toEqual(expect.arrayContaining(["Young crowd (18–24)", "Has event space", "Open Saturday"]));
  });
  it("skips closed venues", () => expect(classifyVenue(P({ genre: "gym", isClosed: true })).role).toBe("skip"));
  it("flags a venue that is closed on the drive day", () => {
    const v = classifyVenue(P({ genre: "gym", hours: { saturday: [{ opens: null, closes: null, closed: true }] } }), "2026-11-14");
    expect(v.reasons).toContain("Closed Saturday");
  });
});

describe("rankVenues", () => {
  it("returns hosts first by score and caps the lists", () => {
    const places = [
      P({ name: "Bar A", genre: "bar" }), P({ name: "Gym", genre: "gym", affinity: 0.7, tags: ["18 24"] }),
      P({ name: "Mall", genre: "shopping_mall", affinity: 0.9 }), P({ name: "Campus", genre: "university", affinity: 0.6, eventSpaces: true }),
      P({ name: "Cafe", genre: "coffee_shop", affinity: 0.5 }), P({ name: "Bar B", genre: "night_club" }), P({ name: "Bar C", genre: "pub" }),
    ];
    const r = rankVenues(places);
    expect(r.host).toHaveLength(3);
    expect(r.host[0].name).toBe("Mall");
    expect(r.promote).toHaveLength(2);
    expect(r.promote.every((v) => v.role === "promote")).toBe(true);
  });
});
