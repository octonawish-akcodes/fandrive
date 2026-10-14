export const WEIGHTS = { youth: 0.35, local: 0.45, density: 0.2 } as const;
export type Weights = { youth: number; local: number; density: number };
export const MATCH_OK = 0.75;
export const ZONE = { topCells: 30, clusterKm: 2.5, maxZones: 3 } as const;
export const VENUE_RADIUS_M = 4000;
export const BADGE = { strong: 1000, medium: 300 } as const; // heatmap cells for the anchor brand; tuned in Task 8
/** Qloo place-tag searches for venues that can host a drive (resolved to tag ids via /v2/tags). */
export const HOST_TAG_QUERIES = ["university", "college", "community center", "library", "event venue", "convention center", "high school", "stadium", "gym", "banquet hall"] as const;
