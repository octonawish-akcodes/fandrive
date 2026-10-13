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

/** Display limits for campaign copy (characters). */
export const CREATIVE_LIMITS = { theme: 80, posterHeadline: 90, posterBody: 400, socialPost: 280, invite: 320, subject: 120, body: 1500 } as const;
const L = CREATIVE_LIMITS;
export const CreativeSchema = z.object({
  theme: z.string().min(3).max(L.theme),
  posterHeadline: z.string().min(3).max(L.posterHeadline),
  posterBody: z.string().min(10).max(L.posterBody),
  socialPosts: z.array(z.string().min(5).max(L.socialPost)).length(3),
  invite: z.string().min(10).max(L.invite),
  pitchEmail: z.object({ subject: z.string().min(3).max(L.subject), body: z.string().min(20).max(L.body) }),
});
/** What the model is asked for: Gemini ignores maxLength, so lengths are enforced afterwards by fitCreative. */
export const CreativeDraftSchema = z.object({
  theme: z.string(), posterHeadline: z.string(), posterBody: z.string(), socialPosts: z.array(z.string()),
  invite: z.string(), pitchEmail: z.object({ subject: z.string(), body: z.string() }),
});
export type CreativeDraft = z.infer<typeof CreativeDraftSchema>;
export type Creative = z.infer<typeof CreativeSchema>;

/** What the model is asked for. Gemini ignores length limits, so runPlainAi keeps 5 picks and trims name to 60 and why to 200 chars. */
export const PlainAiDraftSchema = z.object({ picks: z.array(z.object({ name: z.string(), type: z.enum(PARTNER_TYPES), why: z.string() })).min(1) });

export type PlainAiCheck = { name: string; type: EntityType; why: string; matchedName?: string; youthSkew: number | null; note: string };
export type MapResult = { partnerId: string; partnerName: string; zones: MappedZone[] };
export type Step = { at: number; tool: string; message: string };
export type CityInfo = { name: string; disambiguation?: string; lat: number; lon: number; badge: CityBadge; cells: number };
/** The AI planner's own recommendation (finish tool). rationale is null when it cited numbers no tool returned. */
export type AgentPicks = { ids: string[]; rationale: string | null };
export type Plan = {
  id: string; createdAt: string; engine: "agent" | "autopilot" | "recorded"; input: PlanInput; city: CityInfo;
  partners: Partner[]; excluded: Excluded[]; maps: MapResult[]; creative: Creative; plainAi: PlainAiCheck[] | null; steps: Step[]; limits: string[];
  agentPicks?: AgentPicks | null; // optional: plans saved before this field existed
};
export type ErrorCode = "bad_input" | "city_not_found" | "too_few_partners" | "rate_limited" | "upstream" | "internal";
export type RunEvent =
  | { type: "step"; step: Step } | { type: "city"; city: CityInfo }
  | { type: "partners"; partners: Partner[]; excluded: Excluded[]; picks?: AgentPicks } | { type: "maps"; maps: MapResult[] }
  | { type: "creative"; creative: Creative } | { type: "plainAi"; plainAi: PlainAiCheck[] | null }
  | { type: "done"; plan: Plan } | { type: "error"; code: ErrorCode; message: string };
