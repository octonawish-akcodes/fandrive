import { z } from "zod";
import type { CityBadge, Excluded, MappedZone, Partner } from "@/lib/engine/tools";
import type { EntityType } from "@/lib/qloo/types";

const ISO = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const PARTNER_TYPES = ["artist", "brand", "tv_show", "videogame", "person", "movie", "podcast"] as const;

export const PlanInputSchema = z.object({
  city: z.string().trim().min(2).max(80),
  band: z.enum(["16-24", "18-29"]).default("16-24"),
  goalDonors: z.number().int().min(10).max(100_000).default(300),
  firstTimers: z.boolean().default(true),
  startDate: ISO,
  endDate: ISO,
  partners: z.array(z.string().trim().min(1).max(60)).max(8).default([]),
}).refine((v) => v.startDate <= v.endDate, { message: "startDate must be on or before endDate", path: ["endDate"] });
export type PlanInput = z.infer<typeof PlanInputSchema>;

export const CreativeSchema = z.object({
  theme: z.string().min(3).max(80),
  posterHeadline: z.string().min(3).max(90),
  posterBody: z.string().min(10).max(400),
  socialPosts: z.array(z.string().min(5).max(280)).length(3),
  invite: z.string().min(10).max(320),
  pitchEmail: z.object({ subject: z.string().min(3).max(120), body: z.string().min(20).max(1500) }),
});
export type Creative = z.infer<typeof CreativeSchema>;

export const PlainAiPicksSchema = z.object({
  picks: z.array(z.object({ name: z.string().max(60), type: z.enum(PARTNER_TYPES), why: z.string().max(200) })).min(1).max(5),
});

export type PlainAiCheck = { name: string; type: EntityType; why: string; matchedName?: string; youthSkew: number | null; note: string };
export type MapResult = { partnerId: string; partnerName: string; zones: MappedZone[] };
export type Step = { at: number; tool: string; message: string };
export type CityInfo = { name: string; disambiguation?: string; lat: number; lon: number; badge: CityBadge; cells: number };
export type Plan = {
  id: string; createdAt: string; engine: "agent" | "autopilot" | "recorded"; input: PlanInput; city: CityInfo;
  partners: Partner[]; excluded: Excluded[]; maps: MapResult[]; creative: Creative; plainAi: PlainAiCheck[] | null; steps: Step[]; limits: string[];
};
export type ErrorCode = "bad_input" | "city_not_found" | "too_few_partners" | "rate_limited" | "upstream" | "internal";
export type RunEvent =
  | { type: "step"; step: Step } | { type: "city"; city: CityInfo }
  | { type: "partners"; partners: Partner[]; excluded: Excluded[] } | { type: "maps"; maps: MapResult[] }
  | { type: "creative"; creative: Creative } | { type: "plainAi"; plainAi: PlainAiCheck[] | null }
  | { type: "done"; plan: Plan } | { type: "error"; code: ErrorCode; message: string };
