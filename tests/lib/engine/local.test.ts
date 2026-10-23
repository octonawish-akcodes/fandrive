import { describe, expect, it } from "vitest";
import { countryOf, withLocalLead } from "@/lib/engine/local";
import { createTools, type Partner } from "@/lib/engine/tools";
import { fakeApi, id } from "../../helpers/fakeApi";

const P = (name: string, youthSkew: number, local = false): Partner => ({
  entityId: `id:${name}`, name, type: "artist", query: name, match: 1, youthSkew, localLove: 0.99, density: 5, pull: 0.8, confidence: "medium", evidence: [], ...(local ? { local: true } : {}),
});

describe("local taste", () => {
  it("discovers local artists in Qloo's order (skipping obscure ones) and local athletes, not actors or influencers", async () => {
    const steps: string[] = [];
    const athlete = ["Athlete", "Baseball Player"];
    const api = fakeApi({ local: {
      artist: [{ name: "Big Pokey", popularity: 0.8 }, { name: "Billy Cook", popularity: 0.43 }, { name: "Don Toliver", popularity: 0.99 }, { name: "Erica Banks", popularity: 0.81 }, { name: "Yung Bleu", popularity: 0.84 }],
      person: [{ name: "Jeremy Peña", popularity: 0.4, tags: athlete }, { name: "Storm Reid", popularity: 0.92, tags: ["Actor", "Television Actor"] },
        { name: "Savannah LaBrant", popularity: 0.98, tags: ["Influencer", "Youtuber"] }, { name: "Devon Achane", popularity: 0.27, tags: ["American Football Player"] }],
    } });
    const refs = await createTools(api, (e) => steps.push(e.tool)).discoverLocal("Houston", "16-24");
    expect(refs).toEqual([
      { name: "Big Pokey", type: "artist", entityId: id("Big Pokey"), local: true },
      { name: "Don Toliver", type: "artist", entityId: id("Don Toliver"), local: true },
      { name: "Erica Banks", type: "artist", entityId: id("Erica Banks"), local: true },
      { name: "Jeremy Peña", type: "person", entityId: id("Jeremy Peña"), local: true },
    ]);
    expect(steps).toEqual(["local_taste"]);
  });
  it("marks hometown heroes and never suggests anyone under 18", async () => {
    const api = fakeApi({ local: { artist: [
      { name: "Lil Keed", popularity: 0.9, birthPlace: "Atlanta, Fulton County, Georgia, U", birthDate: "1998-03-16" },
      { name: "Teen Star", popularity: 0.95, birthDate: "2012-01-01" },
      { name: "Summer Walker", popularity: 0.98, birthPlace: "Atlanta, Georgia" },
      { name: "Elsewhere", popularity: 0.9, birthPlace: "Chicago, Illinois" },
    ] } });
    const refs = await createTools(api).discoverLocal("Atlanta", "16-24");
    expect(refs.map((r) => [r.name, r.hometown])).toEqual([["Lil Keed", "Atlanta"], ["Summer Walker", "Atlanta"], ["Elsewhere", undefined]]);
  });
  it("treats Indian city data as national: names shared with other Indian cities stay local, names that top US cities don't", async () => {
    const band = { name: "The Local Train", popularity: 0.85 }, star = { name: "Shawn Mendes", popularity: 1 };
    const api = fakeApi({
      local: { artist: [band, star] },
      localByCity: { "New Delhi": { artist: [band] }, Bengaluru: { artist: [band] }, Chennai: { artist: [band] }, "New York, NY": { artist: [star] }, "Los Angeles, CA": { artist: [star] } },
    });
    expect((await createTools(api).discoverLocal("Pune", "16-24", "India")).map((r) => r.name)).toEqual(["The Local Train"]);
    expect((await createTools(api).discoverLocal("Pune", "16-24")).map((r) => r.name)).toEqual([]); // without the country, every panel city counts
  });

  it("drops names that also top other cities' lists: national youth favourites aren't local", async () => {
    const storm = { name: "Storm Reid", popularity: 0.92, tags: ["Athlete"] }; // tagged as an athlete here so only the panel rule can drop it
    const api = fakeApi({
      local: { person: [storm, { name: "R. J. Hampton", popularity: 0.91, tags: ["Basketball Player"] }], artist: [{ name: "HeadKrack", popularity: 0.87 }] },
      localByCity: { "Chicago, IL": { person: [storm] }, "Atlanta, GA": { person: [storm] }, "Houston, TX": { artist: [{ name: "HeadKrack", popularity: 0.87 }] } },
    });
    const refs = await createTools(api).discoverLocal("Dallas, TX", "16-24");
    expect(refs.map((r) => r.name)).toEqual(["HeadKrack", "R. J. Hampton"]);
  });
  it("counts a panel city's own list once, not against itself", async () => {
    const api = fakeApi({ localByCity: { "Chicago, IL": { artist: [{ name: "Polo G", popularity: 0.9 }] }, "Houston, TX": { artist: [{ name: "Polo G", popularity: 0.9 }] } } });
    expect((await createTools(api).discoverLocal("Chicago, IL", "16-24")).map((r) => r.name)).toEqual(["Polo G"]);
  });
  it("never puts a name with profanity or a slur on a blood-drive report, wherever it came from", async () => {
    const young = { age: { "24_and_younger": 0.6 }, gender: {} };
    const api = fakeApi({ demo: { [id("Mannequin Pussy")]: young, [id("Nothing")]: young, [id("Fortnite")]: young } });
    const r = await createTools(api).scorePartners({ city: "Philadelphia", band: "16-24", cityBadge: "medium",
      refs: [{ name: "Fortnite", type: "videogame" }, { name: "Mannequin Pussy", type: "artist", entityId: id("Mannequin Pussy"), local: true }, { name: "Nothing", type: "artist", entityId: id("Nothing"), local: true }] });
    expect(r.ranked.map((p) => p.name).sort()).toEqual(["Fortnite", "Nothing"]);
    expect(r.excluded).toContainEqual({ query: "Mannequin Pussy", type: "artist", reason: "Name not suitable for a blood-drive campaign" });
  });
  it("scores discovered names without searching for them again, and marks them local with evidence", async () => {
    const young = { age: { "24_and_younger": 0.6 }, gender: {} };
    const searched: string[] = [];
    const api = fakeApi({ demo: { [id("Don Toliver")]: young, [id("Fortnite")]: young } });
    const search = api.search;
    api.search = async (q, t, n) => { searched.push(q); return search(q, t, n); };
    const r = await createTools(api).scorePartners({ city: "Houston, TX", band: "16-24", cityBadge: "medium",
      refs: [{ name: "Fortnite", type: "videogame" }, { name: "Don Toliver", type: "artist", entityId: id("Don Toliver"), local: true }] });
    expect(searched).toContain("Fortnite");
    expect(searched).not.toContain("Don Toliver");
    const don = r.ranked.find((p) => p.name === "Don Toliver")!;
    expect(don.local).toBe(true);
    expect(don.evidence.some((e) => e.label.startsWith("Local taste"))).toBe(true);
    const r2 = await createTools(fakeApi({ demo: { [id("Don Toliver")]: young } })).scorePartners({ city: "Houston, TX", band: "16-24", cityBadge: "medium",
      refs: [{ name: "Don Toliver", type: "artist", entityId: id("Don Toliver"), local: true, hometown: "Houston" }] });
    expect(r2.ranked[0].hometown).toBe("Houston");
    expect(r2.ranked[0].evidence).toContainEqual({ label: "Hometown", source: "Qloo entity profile · place of birth", value: "born in Houston" });
    expect(r.ranked.find((p) => p.name === "Fortnite")!.local).toBeUndefined();
  });

  it("reads the country from Qloo's locality disambiguation", () => {
    expect(countryOf({ disambiguation: "Mumbai, Maharashtra, India" })).toBe("India");
    expect(countryOf({ disambiguation: "Houston, Harris County, Texas, United States" })).toBe("United States");
    expect(countryOf({})).toBeUndefined();
  });
  it("leads with a local pick: moves the best young-leaning local partner into second place", () => {
    const ps = [P("Fortnite", 0.72), P("Stranger Things", 0.71), P("Old Local", -0.2, true), P("Don Toliver", 0.4, true)];
    expect(withLocalLead(ps).map((p) => p.name)).toEqual(["Fortnite", "Don Toliver", "Stranger Things", "Old Local"]);
  });
  it("leaves the order alone when a local partner already leads, or none is young-leaning", () => {
    const a = [P("Don Toliver", 0.4, true), P("Fortnite", 0.72), P("Minecraft", 0.42, true)];
    expect(withLocalLead(a)).toEqual(a);
    const b = [P("Fortnite", 0.72), P("Stranger Things", 0.71), P("Old Local", -0.2, true)];
    expect(withLocalLead(b)).toEqual(b);
    expect(withLocalLead([P("Solo", 0.5)])).toHaveLength(1);
  });
});
