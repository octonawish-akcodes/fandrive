export const WEIGHTS = { youth: 0.45, local: 0.35, density: 0.2 } as const;
export type Weights = { youth: number; local: number; density: number };
export const MATCH_OK = 0.75;
export const ZONE = { topCells: 30, clusterKm: 2.5, maxZones: 3 } as const;
export const VENUE_RADIUS_M = 2500;
export const BADGE = { strong: 1000, medium: 300 } as const; // heatmap cells for the anchor brand; tuned in Task 8
