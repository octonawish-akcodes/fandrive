export const WEIGHTS = { youth: 0.35, local: 0.45, density: 0.2 } as const;
export type Weights = { youth: number; local: number; density: number };
export const MATCH_OK = 0.75;
export const ZONE = { topCells: 30, clusterKm: 2.5, maxZones: 3 } as const;
export const VENUE_RADIUS_M = 4000;
/**
 * Local taste discovery: Qloo's top artists and people for young people in the city. Brands, games and shows came back generic or noisy in live tests.
 * A name that also tops more than one other panel city's list is a national youth favourite, not a local one (live: Storm Reid topped 5 US cities).
 */
export const LOCAL_TASTE = {
  types: ["artist", "person"], take: 20, minPopularity: 0.75, perType: 3, maxOtherCities: 1,
  panel: ["New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX", "Atlanta, GA", "Seattle, WA", "Mumbai", "New Delhi", "Bengaluru", "Chennai"],
} as const;
export const BADGE = { strong: 1000, medium: 300 } as const; // heatmap cells for the anchor brand; tuned in Task 8
/** Qloo place-tag searches for venues that can host a drive (resolved to tag ids via /v2/tags). */
export const HOST_TAG_QUERIES = ["university", "college", "community center", "library", "event venue", "convention center", "high school", "stadium", "gym", "banquet hall"] as const;
