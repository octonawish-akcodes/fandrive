import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { campaignTasks, kitFileName, RETURN_DAYS, toIcs, venuesCsv } from "@/lib/plan/kit";
import type { Plan, RunEvent } from "@/lib/plan/schema";

// The recorded Houston run judges replay: drive Sat Nov 14, led by Jeremy Peña fans at the Julia Ideson Building
const houston = (JSON.parse(readFileSync("public/examples/houston.json", "utf8")).events as RunEvent[]).flatMap((e) => (e.type === "done" ? [e.plan] : []))[0] as Plan;

describe("campaignTasks", () => {
  const tasks = campaignTasks(houston, "2026-10-01");
  it("runs from the pitch email three weeks out to a return drive for the new donors", () => {
    expect(tasks.map((t) => t.date)).toEqual(["2026-10-24", "2026-10-31", "2026-11-07", "2026-11-11", "2026-11-13", "2026-11-14", "2026-11-15", "2027-01-09"]);
    expect(tasks.find((t) => t.kind === "drive")).toMatchObject({ title: houston.creative.theme, location: "Julia Ideson Building, 550 McKinney St Houston, TX 77002" });
    expect(tasks.at(-1)!.detail).toContain(`${RETURN_DAYS} days`);
  });
  it("uses the plan's own copy and never says the star takes part", () => {
    expect(tasks.filter((t) => t.title.startsWith("Social post")).map((t) => t.detail)).toEqual(houston.creative.socialPosts);
    expect(tasks[0].detail).toContain("never needs the star");
  });
  it("never schedules prep in the past", () => {
    const late = campaignTasks(houston, "2026-11-10");
    expect(late.filter((t) => t.kind === "prep").every((t) => t.date >= "2026-11-10" && t.date <= "2026-11-14")).toBe(true);
    expect(late.find((t) => t.kind === "drive")!.date).toBe("2026-11-14");
  });
});

describe("toIcs", () => {
  const ics = toIcs(campaignTasks(houston, "2026-10-01"), houston.id, new Date("2026-10-30T10:00:00Z"));
  it("is a valid all-day calendar with one event per task", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n")).toBe(true);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(8);
    expect(ics).toContain("DTSTART;VALUE=DATE:20261114\r\nDTEND;VALUE=DATE:20261115");
    expect(ics).toContain("DTSTAMP:20261030T100000Z");
  });
  it("escapes commas and folds long lines at 75 octets", () => {
    expect(ics).toContain("LOCATION:Julia Ideson Building\\, 550 McKinney St Houston\\, TX 77002");
    expect(ics.split("\r\n").every((l) => new TextEncoder().encode(l).length <= 75)).toBe(true);
  });
});

describe("venuesCsv", () => {
  it("lists every host and flyer venue with a header, quoting commas", () => {
    const rows = venuesCsv(houston).trim().split("\r\n");
    expect(rows[0]).toBe("Fandom,Fan zone,Use for,Venue,Address,Why");
    expect(rows).toContain('Jeremy Peña fans,Downtown,Host the drive,Julia Ideson Building,"550 McKinney St Houston, TX 77002",Has event space; Open Saturday');
    expect(rows.some((r) => r.includes("Posters and flyers only"))).toBe(true);
  });
});

it("names the files after the city and the lead fandom", () => expect(kitFileName(houston)).toBe("fandrive-houston-jeremy-pena"));
