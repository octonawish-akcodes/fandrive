import { describe, expect, it } from "vitest";
import { allowedNumbers, hasUncited, impliesEndorsement, leaksInstructions, sanitizeCreative } from "@/lib/plan/cite";
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
  it("flags invented statistics written in words", () => {
    for (const t of ["Forty percent of Houston teens already give", "Thousands of fans already signed up", "Join hundreds of donors", "Twenty fans per hour"])
      expect(hasUncited(t, allowed), t).toBe(true);
  });
  it("allows small counts, donor ages and the year in words or digits", () => {
    const bare = allowedNumbers(["300"]);
    for (const t of ["One donation can help save lives", "Bring two friends", "Donors aged seventeen and up", "See you in November 2026"])
      expect(hasUncited(t, bare), t).toBe(false);
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

describe("copy guards", () => {
  it("flags copy that implies the partner is involved or endorses the drive", () => {
    for (const t of ["Join Kai Cenat's community mission", "Level Up with Kai Cenat", "Kai Cenat Squad: 300 Donors Needed", "Presented by the Houston Rockets", "The Houston Rockets invite you", "join kai cenat today"])
      expect(impliesEndorsement(t, t.toLowerCase().includes("rockets") ? "Houston Rockets" : "Kai Cenat"), t).toBe(true);
  });
  it("allows fan-themed copy", () => {
    for (const t of ["Kai Cenat fans, Houston needs you", "Calling all Kai Cenat fans", "For fans of Kai Cenat: give blood"]) expect(impliesEndorsement(t, "Kai Cenat"), t).toBe(false);
  });
  it("flags copy that leaks the writing instructions", () => {
    expect(leaksInstructions("No medical claims, just pure community energy.")).toBe(true);
    expect(leaksInstructions("No official logos here, just fans.")).toBe(true);
    expect(leaksInstructions("One donation can help save lives.")).toBe(false);
  });
  it("replaces fields that imply endorsement or leak instructions", () => {
    const fb = templateCreative({ city: "Houston", partnerName: "Kai Cenat", dateLabel: "Sat, Nov 14", band: "16-24", goalDonors: 300 });
    const model = { ...fb, theme: "Kai Cenat Fan Day", invite: "Join Kai Cenat's community mission on Sat, Nov 14.", posterBody: "Give blood. No medical claims, just pure community energy." };
    const { creative, replaced } = sanitizeCreative(model, fb, allowed, { partnerName: "Kai Cenat" });
    expect(creative.theme).toBe("Kai Cenat Fan Day");
    expect(replaced).toEqual(["posterBody", "invite"]);
  });
});
