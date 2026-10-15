export const WEIGHTS = { youth: 0.35, local: 0.45, density: 0.2 } as const;
export type Weights = { youth: number; local: number; density: number };
export const MATCH_OK = 0.75;
export const ZONE = { topCells: 30, clusterKm: 2.5, maxZones: 3 } as const;
export const VENUE_RADIUS_M = 4000;
export type LocalKind = { type: "artist" | "person"; minPopularity: number; max: number; onlyIf?: RegExp };
/**
 * Local taste discovery: Qloo's top artists and athletes for young people in the city, in Qloo's order.
 * Live tests (20 cities): artist lists are real local scenes; people lists are mostly national teen actors and influencers, so only athletes are kept
 * (their global popularity is low, e.g. Jeremy Peña 0.40). Brands, games and shows came back generic or noisy.
 * A name that also tops more than one other panel city's list is a national favourite, not a local one (live: Storm Reid topped 5 US cities).
 * Indian city lists are national, so Indian cities are compared with the other panel countries only.
 */
export const LOCAL_TASTE: { take: number; maxOtherCities: number; kinds: LocalKind[]; nationalData: string[]; panel: { city: string; country: string }[] } = {
  take: 20, maxOtherCities: 1,
  kinds: [
    { type: "artist", minPopularity: 0.75, max: 3 },
    { type: "person", minPopularity: 0.3, max: 2, onlyIf: /\b(athletes?|players?|footballers?|cricketers?|boxers?|wrestlers?|gymnasts?|olympians?)\b/i },
  ],
  nationalData: ["India"],
  panel: [
    ...["New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX", "Atlanta, GA", "Seattle, WA"].map((city) => ({ city, country: "United States" })),
    ...["Mumbai", "New Delhi", "Bengaluru", "Chennai"].map((city) => ({ city, country: "India" })),
  ],
};
export const BADGE = { strong: 1000, medium: 300 } as const; // heatmap cells for the anchor brand; tuned in Task 8
/** Qloo place-tag searches for venues that can host a drive (resolved to tag ids via /v2/tags). */
export const HOST_TAG_QUERIES = ["university", "college", "community center", "library", "event venue", "convention center", "high school", "stadium", "gym", "banquet hall"] as const;
