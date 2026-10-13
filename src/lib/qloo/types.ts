export type EntityType = "artist" | "movie" | "tv_show" | "book" | "brand" | "podcast" | "videogame" | "person" | "place" | "destination";
export const AGE_KEYS = ["24_and_younger", "25_to_29", "30_to_34", "35_to_44", "45_to_54", "55_and_older"] as const;
export type AgeKey = (typeof AGE_KEYS)[number];
export type AgeBand = "16-24" | "18-29";
export type Params = Record<string, string | number | boolean | undefined>;

export type SearchHit = { entityId: string; name: string; type: EntityType; popularity: number; disambiguation?: string };
export type Demographics = { age: Partial<Record<AgeKey, number>>; gender: { male?: number; female?: number } };
export type Locality = { name: string; disambiguation?: string; lat: number; lon: number };
export type HeatCell = { geohash: string; lat: number; lon: number; affinityRank: number; popularity: number };
export type DayHours = { opens: string | null; closes: string | null; closed: boolean };
export type QlooPlace = {
  entityId: string; name: string; lat: number; lon: number; affinity: number; distanceM?: number;
  neighborhood?: string; address?: string; genre?: string; tags: string[]; eventSpaces?: boolean; isClosed?: boolean;
  hours?: Record<string, DayHours[]>;
};
