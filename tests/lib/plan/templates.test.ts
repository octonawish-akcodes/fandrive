import { describe, expect, it } from "vitest";
import { CreativeSchema } from "@/lib/plan/schema";
import { dateLabel, templateCreative } from "@/lib/plan/templates";

describe("templates", () => {
  it("formats dates in UTC", () => expect(dateLabel("2026-11-14")).toBe("Sat, Nov 14"));
  it("always produces valid creative, even for long names", () => {
    const c = templateCreative({ city: "Houston", partnerName: "National Football League", zoneName: "Sharpstown", venueName: "Fitness Connection",
      dateLabel: "Sat, Nov 14", band: "18-29", goalDonors: 300 });
    expect(CreativeSchema.parse(c)).toBeTruthy();
    expect(c.pitchEmail.body).toContain("18–29");
    expect(c.posterBody).toContain("Fitness Connection, Sharpstown");
  });
});
