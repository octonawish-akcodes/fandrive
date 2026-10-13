import type { Creative } from "./schema";

const NUM = /\d+(?:[.,]\d+)*/g;
const BASE = ["16", "17", "18", "24", "25", "29"]; // donor-age wording is always allowed
const numbersIn = (s: string) => (s.match(NUM) ?? []).map((t) => t.replace(/,/g, ""));

export function allowedNumbers(sources: string[]): Set<string> {
  const set = new Set<string>([...BASE, ...Array.from({ length: 11 }, (_, i) => String(i))]);
  for (const s of sources) for (const n of numbersIn(s)) set.add(n);
  return set;
}

export function hasUncited(text: string, allowed: Set<string>): boolean {
  return numbersIn(text).some((n) => !allowed.has(n));
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Public copy must treat the partner as a theme ("X fans"), never as a participant or sponsor. */
export function impliesEndorsement(text: string, partner: string): boolean {
  const n = esc(partner.trim());
  if (!n) return false;
  return [
    new RegExp(`\\b${n}['’]s\\s+(?!fans?\\b|fan\\s?base\\b|fanbase\\b|audience\\b|followers\\b)`, "i"),
    new RegExp(`\\b(with|by|join|presented by|sponsored by|hosted by|powered by)\\s+(the\\s+)?${n}\\b(?!\\s+fans?\\b)`, "i"),
    new RegExp(`\\b${n}\\s+(squad|team|crew|nation|army|presents|invites?|wants|needs|asks|says|calls)\\b`, "i"),
  ].some((r) => r.test(text));
}

/** The writer sometimes repeats its own instructions ("No medical claims, ..."). */
export function leaksInstructions(text: string): boolean {
  return /\bmedical claims?\b|\bofficial logos?\b|\bFACTS\b|\bas an AI\b|\b(these|the|my) instructions\b/i.test(text);
}

/** Swap any field with an uncited number, a leaked instruction or (public fields only) implied endorsement for template text. */
export function sanitizeCreative(c: Creative, fallback: Creative, allowed: Set<string>, opts: { partnerName?: string } = {}): { creative: Creative; replaced: string[] } {
  const replaced: string[] = [];
  const pick = (field: string, v: string, f: string, isPublic = true) => {
    const bad = hasUncited(v, allowed) || leaksInstructions(v) || (isPublic && !!opts.partnerName && impliesEndorsement(v, opts.partnerName));
    if (bad) { replaced.push(field); return f; }
    return v;
  };
  return {
    creative: {
      theme: pick("theme", c.theme, fallback.theme),
      posterHeadline: pick("posterHeadline", c.posterHeadline, fallback.posterHeadline),
      posterBody: pick("posterBody", c.posterBody, fallback.posterBody),
      socialPosts: c.socialPosts.map((p, i) => pick(`socialPosts[${i}]`, p, fallback.socialPosts[i])),
      invite: pick("invite", c.invite, fallback.invite),
      pitchEmail: { // a partnership proposal may name the partner
        subject: pick("pitchEmail.subject", c.pitchEmail.subject, fallback.pitchEmail.subject, false),
        body: pick("pitchEmail.body", c.pitchEmail.body, fallback.pitchEmail.body, false),
      },
    },
    replaced,
  };
}
