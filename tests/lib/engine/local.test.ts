import { describe, expect, it } from "vitest";
import { withLocalLead } from "@/lib/engine/local";
import { createTools, type Partner } from "@/lib/engine/tools";
import { fakeApi, id } from "../../helpers/fakeApi";

const P = (name: string, youthSkew: number, local = false): Partner => ({
  entityId: `id:${name}`, name, type: "artist", query: name, match: 1, youthSkew, localLove: 0.99, density: 5, pull: 0.8, confidence: "medium", evidence: [], ...(local ? { local: true } : {}),
});

describe("local taste", () => {
  it("discovers popular local artists and people for young people in the city, skipping obscure names", async () => {
    const steps: string[] = [];
    const api = fakeApi({ local: {
      artist: [{ name: "Big Pokey", popularity: 0.8 }, { name: "Billy Cook", popularity: 0.43 }, { name: "Don Toliver", popularity: 0.99 }, { name: "Erica Banks", popularity: 0.81 }, { name: "Yung Bleu", popularity: 0.84 }],
      person: [{ name: "Jeremy Peña", popularity: 0.4 }, { name: "Storm Reid", popularity: 0.92 }],
    } });
    const refs = await createTools(api, (e) => steps.push(e.tool)).discoverLocal("Houston", "16-24");
    expect(refs).toEqual([
      { name: "Big Pokey", type: "artist", entityId: id("Big Pokey"), local: true },
      { name: "Don Toliver", type: "artist", entityId: id("Don Toliver"), local: true },
      { name: "Erica Banks", type: "artist", entityId: id("Erica Banks"), local: true },
      { name: "Storm Reid", type: "person", entityId: id("Storm Reid"), local: true },
    ]);
    expect(steps).toEqual(["local_taste"]);
  });

  it("drops names that also top other cities' lists: national youth favourites aren't local", async () => {
    const storm = { name: "Storm Reid", popularity: 0.92 };
    const api = fakeApi({
      local: { person: [storm, { name: "R. J. Hampton", popularity: 0.91 }], artist: [{ name: "HeadKrack", popularity: 0.87 }] },
      localByCity: { "Chicago, IL": { person: [storm] }, "Atlanta, GA": { person: [storm] }, "Houston, TX": { artist: [{ name: "HeadKrack", popularity: 0.87 }] } },
    });
    const refs = await createTools(api).discoverLocal("Dallas, TX", "16-24");
    expect(refs.map((r) => r.name)).toEqual(["HeadKrack", "R. J. Hampton"]);
  });
  it("counts a panel city's own list once, not against itself", async () => {
    const api = fakeApi({ localByCity: { "Chicago, IL": { artist: [{ name: "Polo G", popularity: 0.9 }] }, "Houston, TX": { artist: [{ name: "Polo G", popularity: 0.9 }] } } });
    expect((await createTools(api).discoverLocal("Chicago, IL", "16-24")).map((r) => r.name)).toEqual(["Polo G"]);
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
    expect(r.ranked.find((p) => p.name === "Fortnite")!.local).toBeUndefined();
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
