import type { QlooPlace } from "@/lib/qloo/types";

export type Venue = { entityId: string; name: string; lat: number; lon: number; neighborhood?: string; address?: string; role: "host" | "promote"; reasons: string[]; score: number };

const ALCOHOL = /(bar|night_?club|pub|lounge|brewery|brewpub|winery|liquor|cocktail)/;
const HOST = /(community|university|college|campus|school|gym|fitness|sport|recreation|stadium|arena|shopping_mall|mall|library|place_of_worship|church|temple|mosque|coffee|cafe|performing_arts|theater|event_venue|convention|museum|(^|_)park($|_))/;
const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export function classifyVenue(p: QlooPlace, date?: string): { role: "host" | "promote" | "skip"; reasons: string[] } {
  if (p.isClosed) return { role: "skip", reasons: ["Permanently closed"] };
  const reasons: string[] = [];
  if (p.tags.some((t) => /18\s*24/.test(t))) reasons.push("Young crowd (18–24)");
  if (ALCOHOL.test(p.genre ?? "")) return { role: "promote", reasons: ["Promote here, don't host here (alcohol venue)", ...reasons] };
  if (p.eventSpaces) reasons.push("Has event space");
  if (date && p.hours) {
    const day = DAYS[new Date(`${date}T12:00:00Z`).getUTCDay()];
    const slots = p.hours[day];
    if (slots?.length) reasons.push(slots.every((s) => s.closed) ? `Closed ${cap(day)}` : `Open ${cap(day)}`);
  }
  return { role: HOST.test((p.genre ?? "").toLowerCase()) ? "host" : "promote", reasons }; // genre only: tags like "Paid parking garage" must not count
}

function score(p: QlooPlace, reasons: string[]): number {
  return p.affinity + (reasons.includes("Young crowd (18–24)") ? 0.15 : 0) + (reasons.includes("Has event space") ? 0.1 : 0)
    + (reasons.some((r) => r.startsWith("Open ")) ? 0.05 : 0) - (reasons.some((r) => r.startsWith("Closed ")) ? 0.5 : 0);
}

export function rankVenues(places: QlooPlace[], date?: string): { host: Venue[]; promote: Venue[] } {
  const all = places.map((p) => ({ p, c: classifyVenue(p, date) })).filter((x) => x.c.role !== "skip")
    .map(({ p, c }) => ({ entityId: p.entityId, name: p.name, lat: p.lat, lon: p.lon, neighborhood: p.neighborhood, address: p.address,
      role: c.role as "host" | "promote", reasons: c.reasons, score: score(p, c.reasons) }))
    .sort((a, b) => b.score - a.score);
  return { host: all.filter((v) => v.role === "host").slice(0, 3), promote: all.filter((v) => v.role === "promote").slice(0, 2) };
}
