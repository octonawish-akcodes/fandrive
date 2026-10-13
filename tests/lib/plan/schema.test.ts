import { describe, expect, it } from "vitest";
import { CreativeSchema, PlanInputSchema } from "@/lib/plan/schema";

const base = { city: "Houston", startDate: "2026-11-01", endDate: "2026-11-30" };
describe("PlanInputSchema", () => {
  it("applies defaults", () => {
    expect(PlanInputSchema.parse(base)).toMatchObject({ band: "16-24", goalDonors: 300, firstTimers: true, partners: [] });
  });
  it("rejects hostile sizes and bad dates", () => {
    expect(PlanInputSchema.safeParse({ ...base, city: "x".repeat(5000) }).success).toBe(false);
    expect(PlanInputSchema.safeParse({ ...base, partners: Array(9).fill("a") }).success).toBe(false);
    expect(PlanInputSchema.safeParse({ ...base, partners: ["y".repeat(61)] }).success).toBe(false);
    expect(PlanInputSchema.safeParse({ ...base, endDate: "2026-10-01" }).success).toBe(false);
  });
});
describe("CreativeSchema", () => {
  it("requires exactly 3 social posts", () => {
    const c = { theme: "Fan Day", posterHeadline: "Give blood", posterBody: "Join us for a drive.", invite: "Come give blood with me!",
      pitchEmail: { subject: "Partnership", body: "Hello, let's run a fan blood drive." } };
    expect(CreativeSchema.safeParse({ ...c, socialPosts: ["one post", "two post", "three post"] }).success).toBe(true);
    expect(CreativeSchema.safeParse({ ...c, socialPosts: ["one post"] }).success).toBe(false);
  });
});
