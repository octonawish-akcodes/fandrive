import { describe, expect, it } from "vitest";
import { allowedNumbers, hasUncited, sanitizeCreative } from "@/lib/plan/cite";
import { templateCreative } from "@/lib/plan/templates";

const allowed = allowedNumbers(["300", "+0.85", "2026-11-14", "7326 Southwest Fwy"]);
describe("citation guard", () => {
  it("allows cited numbers, small counts and donor ages", () => {
    expect(hasUncited("300 donors, fans skew +0.85, bring 2 friends, ages 16-24, 7326 Southwest Fwy", allowed)).toBe(false);
  });
  it("flags invented numbers and percentages", () => {
    expect(hasUncited("73% of fans will donate", allowed)).toBe(true);
    expect(hasUncited("Join 12,000 donors", allowed)).toBe(true);
  });
  it("replaces only the offending fields with template text", () => {
    const fb = templateCreative({ city: "Houston", partnerName: "Bad Bunny", dateLabel: "Sat, Nov 14", band: "16-24", goalDonors: 300 });
    const model = { ...fb, theme: "Bad Bunny Blood Night", socialPosts: ["Saves 3 lives!", "73% of fans agree", "See you there"] as [string, string, string] };
    const { creative, replaced } = sanitizeCreative(model, fb, allowed);
    expect(creative.theme).toBe("Bad Bunny Blood Night");
    expect(creative.socialPosts[0]).toBe("Saves 3 lives!");
    expect(creative.socialPosts[1]).toBe(fb.socialPosts[1]);
    expect(replaced).toEqual(["socialPosts[1]"]);
  });
});
