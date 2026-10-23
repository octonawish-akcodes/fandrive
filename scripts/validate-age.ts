/**
 * External check of Qloo's age signal: does Qloo rank sports audiences by age the way Nielsen does?
 * Benchmark: median/average age of live TV viewers, Magna Global for SportsBusiness Journal (Nielsen, 2016).
 *   pnpm validate-age   → src/data/validation.json
 */
import { writeFileSync } from "node:fs";
import { createTools } from "@/lib/engine/tools";
import { spearman, youngLean } from "@/lib/eval/validate";
import { getQlooApi } from "@/lib/qloo";

const BENCH: [string, string, number][] = [ // [Qloo search name, label, TV viewer age]
  ["PGA Tour", "PGA Tour (golf)", 64], ["NASCAR", "NASCAR", 58], ["Major League Baseball", "MLB", 57], ["WWE", "WWE (pro wrestling)", 54],
  ["National Football League", "NFL", 50], ["Premier League", "Premier League", 43], ["National Basketball Association", "NBA", 42], ["Major League Soccer", "MLS", 40],
];
const SOURCES = [
  { name: "ESPN: Sports TV viewers getting older (2017, on the Magna Global / SportsBusiness Journal study)", url: "https://www.espn.com/jayski/cup/2017/story/_/id/19570505/sports-tv-viewers-getting-older" },
  { name: "Awful Announcing: MLS has the youngest TV audience, PGA Tour the oldest", url: "https://awfulannouncing.com/soccer/mls-youngest-tv-audience-sports-pga-tour-oldest.html" },
  { name: "24/7 Wall St.: Sports viewers are going grayer, says Magna Global study", url: "https://247wallst.com/media/2017/06/07/sports-viewers-are-going-grayer-says-magna-global-study/" },
];
const r2 = (x: number) => Math.round(x * 100) / 100;

async function main() {
  const api = getQlooApi();
  const resolved = await createTools(api).findAndConfirm(BENCH.map(([name]) => ({ name, type: "brand" as const })));
  const rows = [];
  for (let i = 0; i < BENCH.length; i++) {
    const x = resolved[i];
    if (x.status !== "ok") throw new Error(`Qloo did not confirm ${BENCH[i][0]}`);
    const d = await api.demographics(x.entityId!);
    if (!d) throw new Error(`No Qloo age data for ${BENCH[i][0]}`);
    rows.push({ label: BENCH[i][1], qlooName: x.matchedName, tvAge: BENCH[i][2], qlooLean: r2(youngLean(d.age)), qloo24: r2(d.age["24_and_younger"] ?? 0) });
  }
  // Older TV audience should mean a less young-leaning Qloo audience: expect a strongly negative correlation.
  const rho = r2(spearman(rows.map((r) => r.tvAge), rows.map((r) => r.qlooLean)));
  const rho24 = r2(spearman(rows.map((r) => r.tvAge), rows.map((r) => r.qloo24)));
  const out = { generatedAt: new Date().toISOString().slice(0, 10), benchmark: "Median/average age of live TV viewers, 2016 (Nielsen data, Magna Global for SportsBusiness Journal)", sources: SOURCES, rows, spearman: rho, spearman24: rho24 };
  writeFileSync("src/data/validation.json", `${JSON.stringify(out, null, 2)}\n`);
  console.log(JSON.stringify({ rho, rho24 }), rows.map((r) => `${r.label}: TV ${r.tvAge}, Qloo lean ${r.qlooLean}, 24- ${r.qloo24}`).join(" | "));
}
main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
