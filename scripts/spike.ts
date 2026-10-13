import { getQlooApi } from "@/lib/qloo";
import { createTools, type Partner } from "@/lib/engine/tools";
import { seedPartners } from "@/lib/engine/seeds";

async function main() {
  const cities = ["Houston", "Miami", "Nashville", "Seattle", "Atlanta", "Mumbai"];
  const t = createTools(getQlooApi(), (e) => console.log(`  · ${e.message}`));
  const out: Record<string, { badge: string; ranked: Partner[]; zonesOk: boolean }> = {};

  for (const city of cities) {
    const s = await t.cityStrength(city);
    const { ranked, excluded } = await t.scorePartners({ city, band: "16-24", cityBadge: s.badge, refs: [...seedPartners(city), { name: "Metallica", type: "artist" }] });
    console.log(`\n## ${city} (${s.locality.disambiguation ?? s.locality.name}) badge=${s.badge} cells=${s.cells}`);
    for (const p of ranked.slice(0, 8)) console.log(`  ${p.pull.toFixed(2)}  ${p.name.padEnd(26)} youth=${p.youthSkew.toFixed(2)} local=${p.localLove?.toFixed(2) ?? "—"} density=${p.density.toFixed(2)} ${p.confidence}`);
    for (const e of excluded) console.log(`  x ${e.query}: ${e.reason}`);
    const zones = ranked[0] ? await t.mapPartner({ city, partner: ranked[0], date: "2026-11-14" }) : [];
    for (const z of zones) console.log(`  zone ${z.name}: host=[${z.venues.host.map((v) => v.name).join(", ")}] promote=[${z.venues.promote.map((v) => v.name).join(", ")}]`);
    out[city] = { badge: s.badge, ranked, zonesOk: zones.some((z) => z.venues.host.length > 0) };
  }

  const idx = (c: string, n: string) => out[c].ranked.findIndex((p) => p.name === n);
  const checks: [string, boolean][] = [
    ["Miami: Bad Bunny or Karol G in top 3", out.Miami.ranked.slice(0, 3).some((p) => ["Bad Bunny", "Karol G"].includes(p.name))],
    ["Nashville: Morgan Wallen in top 5", out.Nashville.ranked.slice(0, 5).some((p) => p.name === "Morgan Wallen")],
    ["Houston: Sabrina Carpenter above Metallica", idx("Houston", "Sabrina Carpenter") > -1 && idx("Houston", "Sabrina Carpenter") < idx("Houston", "Metallica")],
    ["Houston/Seattle/Atlanta badge strong", ["Houston", "Seattle", "Atlanta"].every((c) => out[c].badge === "strong")],
    ["Mumbai: at least 3 usable partners", out.Mumbai.ranked.length >= 3],
    ["Every city: top partner has a host venue", cities.every((c) => out[c].zonesOk)],
  ];
  console.log("\n## Checks");
  for (const [name, ok] of checks) console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
}

main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
