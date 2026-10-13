import type { Creative } from "./schema";

const NUM = /\d+(?:[.,]\d+)*/g;
const BASE = ["16", "17", "18", "24", "25", "29"]; // donor-age wording is always allowed
const numbersIn = (s: string) => (s.match(NUM) ?? []).map((t) => t.replace(/,/g, ""));

export function allowedNumbers(sources: string[]): Set<string> {
  const set = new Set<string>([...BASE, ...Array.from({ length: 11 }, (_, i) => String(i))]);
  for (const s of sources) for (const n of numbersIn(s)) set.add(n);
  return set;
}

// Statistics written in words ("Forty percent", "Thousands of fans"). Words up to ten and donor ages are fine.
const NUMBER_WORDS = /\b(eleven|twelve|thirteen|fourteen|fifteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundreds?|thousands?|millions?|billions?|dozens?|percent|per cent)\b/i;
const isYear = (n: string) => /^20[2-3]\d$/.test(n);

export function hasUncited(text: string, allowed: Set<string>): boolean {
  return numbersIn(text).some((n) => !allowed.has(n) && !isYear(n)) || NUMBER_WORDS.test(text);
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Allowlist: in public copy every mention of the partner must read as fandom ("X fans", "fans of X", "X-themed").
// Anything else ("X is hosting", "Meet X", "X x Red Cross") could imply the partner is involved, so it falls back.
const FANDOM_AFTER = /^(?:['’]s\s+(?:\w+\s+)?(?:fans?|fan\s?base|fanbase|followers|audience)|[\s-]+(?:fans?|fandom|fan\s?base|fanbase|fan\s+community|community|lovers|players|gamers|viewers|listeners|followers|themed|inspired|vibes?|energy|style))\b/i;
const FANDOM_BEFORE = /(?:fans?\s+of|inspired\s+by|a\s+nod\s+to|(?:who|you|everyone|anyone)\s+(?:loves?|plays?|watch(?:es)?|streams?|follows?|listens?\s+to))\s+(?:the\s+)?$/i;

export function impliesEndorsement(text: string, partner: string): boolean {
  const n = partner.trim();
  if (!n) return false;
  for (const m of text.matchAll(new RegExp(`\\b${esc(n)}\\b`, "gi"))) {
    const before = text.slice(0, m.index), after = text.slice(m.index + m[0].length);
    if (!FANDOM_AFTER.test(after) && !FANDOM_BEFORE.test(before)) return true;
  }
  return false;
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
