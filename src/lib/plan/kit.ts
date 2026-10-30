import { topTwo, whoToAsk } from "@/lib/client/view";
import { dateLabel } from "./templates";
import type { Plan } from "./schema";

export type KitTask = { date: string; title: string; detail: string; location?: string; kind: "prep" | "drive" | "after" };

/** US whole-blood donors can give again after 56 days (American Red Cross); other services wait 8 to 16 weeks. */
export const RETURN_DAYS = 56;

const DAY = 86_400_000;
const addDays = (iso: string, n: number) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * DAY).toISOString().slice(0, 10);

/** The campaign as dated tasks, from the pitch email to a return drive for the new donors. Prep never falls before today. */
export function campaignTasks(plan: Plan, today: string): KitTask[] {
  const drive = plan.input.startDate;
  const lead = topTwo(plan.partners, plan.agentPicks)[0];
  const fandom = lead ? `${lead.name} fans` : "fans";
  const map = plan.maps.find((m) => m.partnerId === lead?.entityId) ?? plan.maps[0];
  const zone = map?.zones[0];
  const venue = zone?.venues.host[0];
  const where = venue ? `${venue.name}${venue.address ? `, ${venue.address}` : ""}` : (zone?.name ?? plan.city.name);
  const flyers = (map?.zones ?? []).flatMap((z) => z.venues.promote.map((v) => v.name)).slice(0, 4);
  const prep = (days: number) => { const d = addDays(drive, -days); return d < today ? (today < drive ? today : drive) : d; };
  const posts = plan.creative.socialPosts;
  return [
    { date: prep(21), kind: "prep", title: "Send the partnership email", detail: `Email "${plan.creative.pitchEmail.subject}" to ${lead ? whoToAsk(lead).ask.join(" and ") : "local fan clubs and campus clubs"}. The drive is fan-themed: it never needs the star to take part.` },
    { date: prep(14), kind: "prep", title: "Book the venue and put up posters", detail: `Confirm ${venue?.name ?? "a host venue"} for ${dateLabel(drive)}.${flyers.length ? ` Leave posters and flyers at ${flyers.join(", ")}.` : ""}` },
    ...posts.map((p, i) => ({ date: prep([7, 3, 1][i] ?? 1), kind: "prep" as const, title: `Social post ${i + 1} of ${posts.length}`, detail: p })),
    { date: drive, kind: "drive", title: plan.creative.theme, detail: `Blood drive for ${fandom} in ${plan.city.name}. Goal: ${plan.input.goalDonors} donors. Check every donor's eligibility on site.`, location: where },
    { date: addDays(drive, 1), kind: "after", title: "Thank donors and ask each to bring a friend", detail: `Thank every ${fandom.replace(/ fans$/, "")} fan who gave. A thank-you is the easiest way to invite them back.` },
    { date: addDays(drive, RETURN_DAYS), kind: "after", title: "Return drive for the new donors", detail: `${RETURN_DAYS} days after the drive, US whole-blood donors can give again (other services: 8 to 16 weeks; check yours). Invite the same fans back with the same theme.`, location: where },
  ];
}

const icsText = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, (c) => `\\${c}`);
/** RFC 5545 folds content lines longer than 75 octets; continuation lines start with a space. */
function fold(line: string): string {
  const out: string[] = [];
  let cur = "";
  for (const ch of line) {
    if (new TextEncoder().encode(cur + ch).length > (out.length ? 74 : 75)) { out.push(cur); cur = ""; }
    cur += ch;
  }
  return [...out, cur].join("\r\n ");
}

/** An all-day calendar event per task, for Google Calendar, Outlook or Apple Calendar. */
export function toIcs(tasks: KitTask[], planId: string, now: Date): string {
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//FanDrive//Drive kit//EN", "CALSCALE:GREGORIAN",
    ...tasks.flatMap((t, i) => [
      "BEGIN:VEVENT", `UID:${planId}-${i}@fandrive`, `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${t.date.replace(/-/g, "")}`, `DTEND;VALUE=DATE:${addDays(t.date, 1).replace(/-/g, "")}`,
      `SUMMARY:${icsText(t.title)}`, `DESCRIPTION:${icsText(t.detail)}`, ...(t.location ? [`LOCATION:${icsText(t.location)}`] : []), "END:VEVENT",
    ]), "END:VCALENDAR"];
  return lines.map(fold).join("\r\n") + "\r\n";
}

const csvCell = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
/** Every venue in the plan, one row each: hosts first, then flyer spots. */
export function venuesCsv(plan: Plan): string {
  const rows = [["Fandom", "Fan zone", "Use for", "Venue", "Address", "Why"]];
  for (const m of plan.maps) for (const z of m.zones) {
    for (const v of z.venues.host) rows.push([`${m.partnerName} fans`, z.name, "Host the drive", v.name, v.address ?? "", v.reasons.join("; ")]);
    for (const v of z.venues.promote) rows.push([`${m.partnerName} fans`, z.name, "Posters and flyers only", v.name, v.address ?? "", v.reasons.join("; ")]);
  }
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

/** "fandrive-houston-jeremy-pena" */
export function kitFileName(plan: Plan): string {
  const lead = topTwo(plan.partners, plan.agentPicks)[0];
  const slug = (s: string) => s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return ["fandrive", slug(plan.city.name), lead ? slug(lead.name) : ""].filter(Boolean).join("-").slice(0, 60);
}
