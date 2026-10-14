import { describe, expect, it } from "vitest";
import { doneLabel, headlineParts, plainAiVerdicts, signed, topTwo, youthBarPct } from "@/lib/client/view";
import type { Partner } from "@/lib/engine/tools";
import type { PlainAiCheck } from "@/lib/plan/schema";

const P = (name: string, youthSkew: number, pull = 0.8): Partner => ({
  entityId: `id:${name}`, name, type: "videogame", query: name, match: 1, youthSkew, localLove: 0.99, density: 10, pull, confidence: "medium", evidence: [],
});
const C = (name: string, youthSkew: number | null, matchedName?: string): PlainAiCheck => ({ name, type: "artist", why: "", youthSkew, matchedName, note: "" });

describe("view helpers", () => {
  it("formats skews with a sign and maps them to a 0–100 bar", () => {
    expect(signed(0.93)).toBe("+0.93");
    expect(signed(-0.04)).toBe("−0.04");
    expect(signed(0)).toBe("+0.00");
    expect(youthBarPct(1)).toBe(100);
    expect(youthBarPct(-1)).toBe(0);
    expect(youthBarPct(0.93)).toBe(97);
    expect(youthBarPct(3)).toBe(100);
  });

  it("puts the agent's picks first, else the top two", () => {
    const ps = [P("Fortnite", 0.72), P("Roblox", 0.93), P("Valorant", 0.57)];
    expect(topTwo(ps, { ids: ["id:Roblox"], rationale: null }).map((p) => p.name)).toEqual(["Roblox", "Fortnite"]);
    expect(topTwo(ps).map((p) => p.name)).toEqual(["Fortnite", "Roblox"]);
    expect(topTwo([])).toEqual([]);
  });

  it("marks plain-AI picks young or not, and finds the young fandom it missed", () => {
    const ps = [P("Roblox", 0.93), P("Fortnite", 0.72), P("Valorant", 0.57)];
    const v = plainAiVerdicts([C("Megan Thee Stallion", 0.22), C("fortnite", 0.72), C("Unknown Band", null)], ps);
    expect(v.rows.map((r) => r.verdict)).toEqual(["not-young", "young", "no-data"]);
    expect(v.missed?.name).toBe("Roblox");
    expect(plainAiVerdicts([C("Roblox", 0.93, "Roblox")], ps).missed?.name).toBe("Fortnite");
    expect(plainAiVerdicts(null, ps)).toEqual({ rows: [], missed: null });
  });

  it("writes the headline around the top pick, or a prompt before any plan", () => {
    expect(headlineParts("Houston", P("Roblox", 0.93))).toEqual({ before: "Houston’s next blood drive is a", sticker: "Roblox", after: "party." });
    expect(headlineParts(undefined, undefined)).toEqual({ before: "Every fandom is a", sticker: "blood drive", after: "waiting to happen." });
  });

  it("labels how long the plan took", () => {
    expect(doneLabel([{ at: 0, tool: "a", message: "" }, { at: 83_500, tool: "b", message: "" }])).toBe("Done in 84 seconds.");
    expect(doneLabel([])).toBeNull();
  });
});
