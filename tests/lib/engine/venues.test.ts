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

describe("classifyVenue genre rules (from live Qloo genres)", () => {
  const role = (genre: string) => classifyVenue(P({ genre })).role;
  const alcohol = (genre: string) => classifyVenue(P({ genre })).reasons.some((r) => r.includes("alcohol"));
  it("matches alcohol genres as whole words only", () => {
    for (const g of ["bar", "sports_bar", "cocktail_bar", "bar_&_grill", "night_club", "pub", "brewery", "beer_hall", "lounge"]) expect(alcohol(g), g).toBe(true);
    for (const g of ["barbecue", "espresso_bar", "juice_bar", "public_library"]) expect(alcohol(g), g).toBe(false);
  });
  it("skips venues unsuitable for a youth health campaign or not open to the public", () => {
    for (const g of ["shooting_range", "cigar_shop", "tattoo_shop", "liquor_store", "beer_store", "vape_shop", "hookah_lounge", "casino", "hotel", "apartment_complex", "condominium_complex", "furnished_apartment_building", "funeral_home"])
      expect(role(g), g).toBe("skip");
  });
  it("treats cafes as promote spots, not hosts", () => {
    for (const g of ["coffee_shop", "cafe", "espresso_bar"]) expect(role(g), g).toBe("promote");
  });
  it("hosts at schools, colleges, halls, cultural centres and places of worship", () => {
    for (const g of ["high_school", "junior_college", "private_educational_institution", "banquet_hall", "cultural_center", "gurdwara", "synagogue", "hindu_temple", "public_library", "city_park", "fitness_center", "convention_center"])
      expect(role(g), g).toBe("host");
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
