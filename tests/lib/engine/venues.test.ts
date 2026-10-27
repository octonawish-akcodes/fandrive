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
  it("skips places inside hotels and resorts even when Qloo gives no genre", () => {
    // Live Houston run: "The Spa & Fitness Center at Four Seasons Hotel Houston" had no primary genre and was listed for flyers
    const v = classifyVenue(P({ name: "The Spa & Fitness Center at Four Seasons Hotel Houston", tags: ["Elegant", "Wellness", "Spa"] }));
    expect(v).toEqual({ role: "skip", reasons: ["Inside a hotel or resort"] });
    expect(classifyVenue(P({ name: "Hotel ZaZa Pool Bar", genre: "bar" })).role).toBe("skip");
    expect(classifyVenue(P({ name: "Hotelling Hall", genre: "community_center" })).role).toBe("host"); // whole word only
  });
  it("skips appointment-only spas and salons, which young donors don't hang out in", () => {
    expect(classifyVenue(P({ name: "Glow Day Spa", tags: ["Spa", "Appointments recommended"] }))).toEqual({ role: "skip", reasons: ["Appointment-only personal care"] });
    expect(classifyVenue(P({ name: "Polished", genre: "nail_salon" })).role).toBe("skip");
    expect(classifyVenue(P({ name: "Downtown YMCA", genre: "gym", tags: ["Spa", "Pool"] })).role).toBe("host"); // a gym with a spa still hosts
    // Live Houston run: an art cafe named "[By Appointment Only - Book Online]" was listed for flyers
    expect(classifyVenue(P({ name: "Honey Art Cafe [By Appointment Only - Book Online]", genre: "art_cafe", tags: ["18 24"] }))).toEqual({ role: "skip", reasons: ["Appointment only"] });
  });
  it("skips kids' venues Qloo files under another genre", () => {
    // Live Houston run: Chuck E. Cheese has genre "pizza" and only a tag says it is for children
    const v = classifyVenue(P({ name: "Chuck E. Cheese", genre: "pizza", tags: ["Family entertainment", "Childrens amusement center", "18 24"] }));
    expect(v).toEqual({ role: "skip", reasons: ["Venue for young children"] });
    expect(classifyVenue(P({ name: "Joe's Pizza", genre: "pizza", tags: ["Good for kids"] })).role).toBe("promote"); // family-friendly is fine
  });
  it("skips hospitals and clinics: patients, not a fan crowd", () => {
    // Live Houston run: Texas Orthopedic Hospital (genre orthopedic_clinic) was listed for flyers
    for (const g of ["orthopedic_clinic", "hospital", "general_hospital", "medical_center", "urgent_care_center", "dental_clinic"])
      expect(classifyVenue(P({ genre: g })), g).toEqual({ role: "skip", reasons: ["Hospital or clinic"] });
  });
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
  it("never hosts at venues for young children and skips residential parks", () => {
    for (const g of ["elementary_school", "middle_school", "primary_school", "preschool", "kindergarten", "day_care_center", "child_care_agency", "nursery_school", "trailer_park", "mobile_home_park", "rv_park", "children's_museum", "children's_amusement_center", "childrens_theater", "kids_club", "playground"])
      expect(role(g), g).toBe("skip");
    expect(role("dog_park")).not.toBe("host");
    expect(role("high_school")).toBe("host");
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
