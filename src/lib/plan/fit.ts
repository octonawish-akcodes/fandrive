import { CREATIVE_LIMITS as L, type Creative, type CreativeDraft } from "./schema";

/** Shorten to `max` chars: at the last sentence end past half-way, else at a word with an ellipsis. */
export function clamp(s: string, max: number): string {
  const t = s.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "), /[.!?]$/.test(cut) ? cut.length - 1 : -1);
  if (end >= max / 2) return cut.slice(0, end + 1);
  const word = t.slice(0, max - 1).replace(/\s+\S*$/, "").replace(/[\s,;:–—-]+$/, "");
  return `${word || t.slice(0, max - 1)}…`;
}

/** Fit model copy to the display limits; blank or too-short fields fall back to the template. */
export function fitCreative(d: CreativeDraft, fallback: Creative): Creative {
  const f = (v: string | undefined, max: number, min: number, fb: string) => (v && v.trim().length >= min ? clamp(v, max) : fb);
  const posts = [0, 1, 2].map((i) => f(d.socialPosts[i], L.socialPost, 5, fallback.socialPosts[i]));
  return {
    theme: f(d.theme, L.theme, 3, fallback.theme),
    posterHeadline: f(d.posterHeadline, L.posterHeadline, 3, fallback.posterHeadline),
    posterBody: f(d.posterBody, L.posterBody, 10, fallback.posterBody),
    socialPosts: posts,
    invite: f(d.invite, L.invite, 10, fallback.invite),
    pitchEmail: { subject: f(d.pitchEmail.subject, L.subject, 3, fallback.pitchEmail.subject), body: f(d.pitchEmail.body, L.body, 20, fallback.pitchEmail.body) },
  };
}
