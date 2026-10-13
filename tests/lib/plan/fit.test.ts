import { describe, expect, it } from "vitest";
import { fitCreative } from "@/lib/plan/fit";
import { CreativeSchema } from "@/lib/plan/schema";
import { templateCreative } from "@/lib/plan/templates";

const fallback = templateCreative({ city: "Houston", partnerName: "Fortnite", dateLabel: "Sat, Nov 14", band: "16-24", goalDonors: 300 });
const sentence = (i: number) => `Sentence number ${["one", "two", "three", "four", "five", "six"][i]} talks about squads and heroes dropping in to help Houston today.`;
const long = Array.from({ length: 6 }, (_, i) => sentence(i)).join(" ");

describe("fitCreative", () => {
  it("trims long fields at a sentence boundary within the display limit", () => {
    const c = fitCreative({ ...fallback, posterBody: long }, fallback);
    expect(c.posterBody.length).toBeLessThanOrEqual(400);
    expect(long.startsWith(c.posterBody)).toBe(true);
    expect(c.posterBody.endsWith(".")).toBe(true);
  });
  it("cuts at a word with an ellipsis when there is no sentence end", () => {
    const c = fitCreative({ ...fallback, theme: "word ".repeat(40).trim() }, fallback);
    expect(c.theme.length).toBeLessThanOrEqual(80);
    expect(c.theme.endsWith("…")).toBe(true);
    expect(c.theme).not.toMatch(/\s…$/);
  });
  it("keeps exactly three social posts, filling from the template", () => {
    expect(fitCreative({ ...fallback, socialPosts: ["Only one post here"] }, fallback).socialPosts).toEqual(["Only one post here", fallback.socialPosts[1], fallback.socialPosts[2]]);
    expect(fitCreative({ ...fallback, socialPosts: ["a post 1", "a post 2", "a post 3", "a post 4"] }, fallback).socialPosts).toHaveLength(3);
  });
  it("always produces copy that satisfies the display schema", () => {
    const c = fitCreative({ theme: long, posterHeadline: long, posterBody: long, socialPosts: [long, long], invite: long, pitchEmail: { subject: long, body: long.repeat(4) } }, fallback);
    expect(CreativeSchema.safeParse(c).success).toBe(true);
  });
});
