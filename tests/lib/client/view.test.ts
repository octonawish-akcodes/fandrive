import { describe, expect, it } from "vitest";
import { doneLabel, headlineParts, plainAiVerdicts, signed, topTwo, whoToAsk, youthBarPct } from "@/lib/client/view";
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
    const local = { ...P("Don Toliver", 0.4), local: true as const };
    expect(topTwo([...ps, local], { ids: ["id:Roblox", "id:Fortnite"], rationale: null }).map((p) => p.name)).toEqual(["Roblox", "Don Toliver"]);
  });

  it("marks plain-AI picks young or not, and finds the young fandom it missed", () => {
    const ps = [P("Roblox", 0.93), P("Fortnite", 0.72), P("Valorant", 0.57)];
    const v = plainAiVerdicts([C("Megan Thee Stallion", 0.22), C("fortnite", 0.72), C("Unknown Band", null)], ps);
    expect(v.rows.map((r) => r.verdict)).toEqual(["not-young", "young", "no-data"]);
    expect(v.missed?.name).toBe("Roblox");
    expect(plainAiVerdicts([C("Roblox", 0.93, "Roblox")], ps).missed?.name).toBe("Fortnite");
    expect(plainAiVerdicts(null, ps)).toEqual({ rows: [], missed: null });
    const lead = [P("Travis Scott", 0.46), P("Fortnite", 0.72), P("Brett Gray", 0.86)];
    expect(plainAiVerdicts([C("Travis Scott", 0.46)], lead, { ids: ["id:Travis Scott", "id:Fortnite"], rationale: null }).missed?.name).toBe("Fortnite"); // a pick the report shows, not one further down
  });

  it("writes the headline around the top pick, or a prompt before any plan", () => {
    expect(headlineParts("Houston", P("Roblox", 0.93))).toEqual({ before: "Houston’s next blood drive is a", sticker: "Roblox", after: "fan day." });
    expect(headlineParts(undefined, undefined)).toEqual({ before: "Every fandom is a", sticker: "blood drive", after: "waiting to happen." });
  });

  it("says who a blood centre can actually ask, by kind of fandom, without needing the star", () => {
    const athlete = { ...P("Jeremy Peña", 0.98), type: "person" as const, fanTags: ["Athlete", "Baseball"] };
    expect(whoToAsk(athlete)).toEqual({ ask: ["the team’s community relations office", "supporters’ clubs and campus sports clubs"], note: "You don’t need Jeremy Peña. The fans come for the theme." });
    expect(whoToAsk({ ...P("Don Toliver", 0.69), type: "artist" }).ask).toEqual(["local fan clubs and street teams", "campus music and radio societies"]);
    expect(whoToAsk({ ...P("Euphoria", 0.62), type: "tv_show" }).ask).toEqual(["Euphoria fan communities on Reddit and Discord", "campus film and TV societies"]);
    expect(whoToAsk(P("Fortnite", 0.72)).ask).toEqual(["campus esports and gaming societies", "local gaming cafés and game stores"]);
    expect(whoToAsk({ ...P("Glossier", 0.5), type: "brand" }).ask).toEqual(["the brand’s local store or community team", "campus clubs whose members wear or use it"]);
    expect(whoToAsk({ ...P("Some Creator", 0.8), type: "person" }).ask).toEqual(["Some Creator fan communities on Reddit and Discord", "campus clubs that share the interest"]);
  });

  it("labels how long the plan took", () => {
    expect(doneLabel([{ at: 0, tool: "a", message: "" }, { at: 83_500, tool: "b", message: "" }])).toBe("Done in 84 seconds.");
    expect(doneLabel([])).toBeNull();
  });
});
