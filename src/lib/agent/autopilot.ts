import { withLocalLead } from "@/lib/engine/local";
import { seedPartners } from "@/lib/engine/seeds";
import type { Excluded, Partner, Tools } from "@/lib/engine/tools";
import type { CityInfo, Creative, MapResult, PlanInput, AgentPicks } from "@/lib/plan/schema";
import { dateLabel, templateCreative, type TemplateCtx } from "@/lib/plan/templates";

export type AutopilotState = { ranked?: Partner[]; excluded?: Excluded[]; maps?: MapResult[] };
export type CoreResult = { partners: Partner[]; excluded: Excluded[]; maps: MapResult[]; creative: Creative; usedTemplate: boolean; picks?: AgentPicks };
export class TooFewPartnersError extends Error {
  constructor(public count: number) { super(`Only ${count} partners had enough Qloo data (need 3)`); this.name = "TooFewPartnersError"; }
}

export function ctxFrom(input: PlanInput, city: CityInfo, top: Partner, map?: MapResult): TemplateCtx {
  const z = map?.zones[0];
  return { city: city.name, partnerName: top.name, zoneName: z?.name, venueName: z?.venues.host[0]?.name, dateLabel: dateLabel(input.startDate), band: input.band, goalDonors: input.goalDonors };
}

export async function mapTop(tools: Tools, input: PlanInput, city: CityInfo, ranked: Partner[], have: MapResult[] = [], n = 2): Promise<MapResult[]> {
  const known = new Map(have.map((m) => [m.partnerId, m]));
  return Promise.all(ranked.slice(0, n).map(async (p) => known.get(p.entityId) ??
    { partnerId: p.entityId, partnerName: p.name, zones: await tools.mapPartner({ city: input.city, partner: p, date: input.startDate }) }));
}

/** Taste tags and momentum for the first n partners (the ones the report leads with). */
export async function enrichTop(tools: Tools, partners: Partner[], n = 2): Promise<Partner[]> {
  const top = await tools.profileFans(partners.slice(0, n));
  return [...top, ...partners.slice(n)];
}

export async function runAutopilot(a: { input: PlanInput; city: CityInfo; tools: Tools; state?: AutopilotState }): Promise<CoreResult> {
  let ranked = a.state?.ranked;
  let excluded = a.state?.excluded ?? [];
  if (!ranked) {
    const [typed, local] = await Promise.all([a.tools.typeNames(a.input.partners), a.tools.discoverLocal(a.input.city, a.input.band)]);
    const r = await a.tools.scorePartners({ city: a.input.city, band: a.input.band, cityBadge: a.city.badge, refs: [...typed.refs, ...seedPartners(a.city.name), ...local] });
    ranked = r.ranked;
    excluded = [...typed.unresolved.map((q): Excluded => ({ query: q, type: "artist", reason: "Not found in Qloo" })), ...r.excluded];
  }
  if (ranked.length < 3) throw new TooFewPartnersError(ranked.length);
  ranked = await enrichTop(a.tools, withLocalLead(ranked));
  const maps = await mapTop(a.tools, a.input, a.city, ranked, a.state?.maps);
  return { partners: ranked, excluded, maps, creative: templateCreative(ctxFrom(a.input, a.city, ranked[0], maps[0])), usedTemplate: true };
}
