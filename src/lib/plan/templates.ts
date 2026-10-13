import type { AgeBand } from "@/lib/qloo/types";
import type { Creative } from "./schema";

export type TemplateCtx = { city: string; partnerName: string; zoneName?: string; venueName?: string; dateLabel: string; band: AgeBand; goalDonors: number };

export function dateLabel(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
}

export function templateCreative(x: TemplateCtx): Creative {
  const where = x.venueName ? `${x.venueName}${x.zoneName ? `, ${x.zoneName}` : ""}` : (x.zoneName ?? x.city);
  const ages = x.band === "16-24" ? "16–24" : "18–29";
  return {
    theme: `${x.partnerName} Fan Day: Give Blood`.slice(0, 80),
    posterHeadline: `${x.partnerName} fans, ${x.city} needs you`.slice(0, 90),
    posterBody: `Join fellow ${x.partnerName} fans for a blood drive at ${where} on ${x.dateLabel}. One donation can help save lives. First time? Our team will walk you through it. Check eligibility before you come.`.slice(0, 400),
    socialPosts: [
      `Calling all ${x.partnerName} fans in ${x.city}: give blood with us at ${where} on ${x.dateLabel}.`.slice(0, 280),
      `First-time donor? Bring a friend who loves ${x.partnerName} as much as you do. ${where}, ${x.dateLabel}.`.slice(0, 280),
      `${x.city} needs blood. ${x.partnerName} fans can help. Book your spot for ${x.dateLabel}.`.slice(0, 280),
    ],
    invite: `Hey! We're running a ${x.partnerName} fan blood drive at ${where} on ${x.dateLabel}. Want to give blood with me? Check you're eligible first.`.slice(0, 320),
    pitchEmail: {
      subject: `Partnership idea: a ${x.partnerName} fan blood drive in ${x.city}`.slice(0, 120),
      body: `Hello,\n\nWe're planning blood drives for young first-time donors (${ages}) in ${x.city}, aiming for ${x.goalDonors} donors. Qloo audience data shows ${x.partnerName}'s fan base skews young and is concentrated near ${x.zoneName ?? x.city}. We'd love to explore a fan-themed drive together around ${x.dateLabel}.\n\nCould we set up a short call?\n\nThank you,`,
    },
  };
}
