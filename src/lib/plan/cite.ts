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

export function sanitizeCreative(c: Creative, fallback: Creative, allowed: Set<string>): { creative: Creative; replaced: string[] } {
  const replaced: string[] = [];
  const pick = (field: string, v: string, f: string) => { if (hasUncited(v, allowed)) { replaced.push(field); return f; } return v; };
  return {
    creative: {
      theme: pick("theme", c.theme, fallback.theme),
      posterHeadline: pick("posterHeadline", c.posterHeadline, fallback.posterHeadline),
      posterBody: pick("posterBody", c.posterBody, fallback.posterBody),
      socialPosts: c.socialPosts.map((p, i) => pick(`socialPosts[${i}]`, p, fallback.socialPosts[i])),
      invite: pick("invite", c.invite, fallback.invite),
      pitchEmail: { subject: pick("pitchEmail.subject", c.pitchEmail.subject, fallback.pitchEmail.subject), body: pick("pitchEmail.body", c.pitchEmail.body, fallback.pitchEmail.body) },
    },
    replaced,
  };
}
