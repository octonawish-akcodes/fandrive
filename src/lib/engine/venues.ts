import type { QlooPlace } from "@/lib/qloo/types";

export type Venue = { entityId: string; name: string; lat: number; lon: number; neighborhood?: string; address?: string; role: "host" | "promote"; reasons: string[]; score: number };

// Whole-word matches on Qloo genre ids (e.g. "sports_bar", "espresso_bar", "public_library").
const word = (alts: string) => new RegExp(`(^|_)(${alts})($|_)`);
const UNSUITABLE = word("shooting_range|gun|gun_shop|firearms?|cigar|tobacco|smoke_shop|vape|vape_shop|hookah|cannabis|dispensary|marijuana|tattoo|piercing|casino|gambling|betting|bookmaker|adult_entertainment|strip_club|pawn|liquor|beer_store|wine_store|funeral|funeral_home|cemetery");
const PRIVATE = word("hotel|motel|apartment|condominium|residential|trailer_park|mobile_home_park|rv_park");
const CHILDREN = word("elementary_school|middle_school|primary_school|preschool|kindergarten|day_care_center|daycare|child_care|child_care_agency|nursery_school|nursery"); // too young to donate
const NOT_HOST = word("dog_park");
const NOT_ALCOHOL = word("(espresso|coffee|juice|smoothie|milkshake|salad|tea|oxygen|nail)_bar");
const ALCOHOL = word("bar|night_?club|pub|lounge|brewery|brewpub|winery|cocktail|beer_hall|beer_garden|tavern|saloon");
const HOST = word("community|university|college|campus|school|educational|gym|fitness|sport|sports|recreation|stadium|arena|mall|library|place_of_worship|church|temple|mosque|gurdwara|synagogue|performing_arts|theater|theatre|event_venue|convention|museum|park|banquet|banquet_hall|cultural");
const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export function classifyVenue(p: QlooPlace, date?: string): { role: "host" | "promote" | "skip"; reasons: string[] } {
  if (p.isClosed) return { role: "skip", reasons: ["Permanently closed"] };
  const genre = (p.genre ?? "").toLowerCase();
  if (UNSUITABLE.test(genre)) return { role: "skip", reasons: ["Not suitable for a youth health campaign"] };
  if (PRIVATE.test(genre)) return { role: "skip", reasons: ["Not a public hangout"] };
  if (CHILDREN.test(genre)) return { role: "skip", reasons: ["Venue for young children"] };
  const reasons: string[] = [];
  if (p.tags.some((t) => /18\s*24/.test(t))) reasons.push("Young crowd (18–24)");
  if (ALCOHOL.test(genre) && !NOT_ALCOHOL.test(genre)) return { role: "promote", reasons: ["Promote here, don't host here (alcohol venue)", ...reasons] };
  if (p.eventSpaces) reasons.push("Has event space");
  if (date && p.hours) {
    const day = DAYS[new Date(`${date}T12:00:00Z`).getUTCDay()];
    const slots = p.hours[day];
    if (slots?.length) reasons.push(slots.every((s) => s.closed) ? `Closed ${cap(day)}` : `Open ${cap(day)}`);
  }
  return { role: HOST.test(genre) && !NOT_HOST.test(genre) ? "host" : "promote", reasons }; // genre only: tags like "Paid parking garage" must not count
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
