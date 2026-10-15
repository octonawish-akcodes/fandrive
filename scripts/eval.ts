/**
 * 20-city evaluation: what a plain LLM suggests (no Qloo) vs FanDrive's Qloo-scored top 3.
 * Plain-AI answers are cached in docs/eval/raw, so re-runs cost no AI calls and only uncached Qloo calls.
 *   pnpm eval            all cities
 *   pnpm eval houston    one city
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { getModel } from "@/lib/agent/model";
import { runPlainAi } from "@/lib/agent/plainAi";
import { getConfig } from "@/lib/config";
import { seedPartners } from "@/lib/engine/seeds";
import { CityNotFoundError, createTools, type NameRef } from "@/lib/engine/tools";
import { withLocalLead } from "@/lib/engine/local";
import { aggregate, renderMarkdown, repeats, YOUNG, type CityEval } from "@/lib/eval/metrics";
import { PlanInputSchema, type CityInfo, type PlainAiCheck, type PlanInput } from "@/lib/plan/schema";
import { getQlooApi } from "@/lib/qloo";

const CITIES: [string, string][] = [
  ["new-york", "New York, NY"], ["los-angeles", "Los Angeles, CA"], ["chicago", "Chicago, IL"], ["houston", "Houston, TX"],
  ["phoenix", "Phoenix, AZ"], ["philadelphia", "Philadelphia, PA"], ["san-antonio", "San Antonio, TX"], ["dallas", "Dallas, TX"],
  ["atlanta", "Atlanta, GA"], ["seattle", "Seattle, WA"], ["miami", "Miami, FL"], ["denver", "Denver, CO"],
  ["boston", "Boston, MA"], ["detroit", "Detroit, MI"], ["nashville", "Nashville, TN"],
  ["mumbai", "Mumbai"], ["delhi", "New Delhi"], ["bengaluru", "Bengaluru"], ["hyderabad", "Hyderabad"], ["chennai", "Chennai"],
];
const RAW = "docs/eval/raw";
const today = () => new Date().toISOString().slice(0, 10);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const pct = (n: number, d: number) => `${Math.round((100 * n) / Math.max(1, d))}%`;
const signed = (x: number | null) => (x === null ? "n/a" : x < 0 ? `−${Math.abs(x).toFixed(2)}` : `+${x.toFixed(2)}`);

/** One plain-AI answer per city, cached so the comparison is fixed once recorded. */
async function plainFor(slug: string, input: PlanInput, city: CityInfo, tools: ReturnType<typeof createTools>): Promise<PlainAiCheck[] | null> {
  const f = `${RAW}/${slug}.json`;
  if (existsSync(f)) return (JSON.parse(readFileSync(f, "utf8")) as { plainAi: PlainAiCheck[] }).plainAi;
  const model = getModel();
  if (!model) throw new Error("Set GOOGLE_GENERATIVE_AI_API_KEY to record plain-AI answers");
  for (let attempt = 1; attempt <= 3; attempt++) {
    const r = await runPlainAi({ input, city, tools, model, timeoutMs: 60_000 }).catch((e) => { console.warn(`  plain AI attempt ${attempt}: ${e instanceof Error ? e.message.slice(0, 120) : e}`); return null; });
    if (r?.length) {
      writeFileSync(f, `${JSON.stringify({ city: input.city, recordedAt: today(), prompt: "app's plain-AI check (src/lib/agent/plainAi.ts)", plainAi: r }, null, 2)}\n`);
      return r;
    }
    await sleep(15_000);
  }
  return null;
}

async function evalCity(slug: string, name: string): Promise<CityEval | string> {
  const tools = createTools(getQlooApi());
  const input = PlanInputSchema.parse({ city: name, startDate: "2026-11-14", endDate: "2026-12-13" });
  let s;
  try { s = await tools.cityStrength(name); } catch (e) { if (e instanceof CityNotFoundError) return "city not found in Qloo"; throw e; }
  const city: CityInfo = { name: s.locality.name, disambiguation: s.locality.disambiguation, lat: s.locality.lat, lon: s.locality.lon, badge: s.badge, cells: s.cells };
  const plain = await plainFor(slug, input, city, tools);
  if (!plain) return "plain AI unavailable";
  // FanDrive's pool: the app's standard candidates plus everything plain AI suggested, all scored with Qloo.
  const seen = new Set<string>();
  const local = await tools.discoverLocal(name, input.band);
  const refs: NameRef[] = [...seedPartners(city.name), ...plain.map((p) => ({ name: p.name, type: p.type })), ...local]
    .filter((r) => !seen.has(r.name.toLowerCase()) && seen.add(r.name.toLowerCase()));
  const { ranked } = await tools.scorePartners({ city: name, band: input.band, refs, cityBadge: s.badge });
  return {
    city: name, badge: s.badge,
    plainAi: plain.map((p) => ({ name: p.name, ...(p.matchedName ? { matchedName: p.matchedName } : {}), youthSkew: p.youthSkew })),
    fanDrive: ranked.slice(0, 3).map((p) => ({ name: p.name, youthSkew: Math.round(p.youthSkew * 100) / 100, pull: Math.round(p.pull * 100) / 100 })),
    localPick: ((p) => (p ? { name: p.name, youthSkew: Math.round(p.youthSkew * 100) / 100 } : null))(withLocalLead(ranked).slice(0, 2).find((p) => p.local)),
  };
}

function report(rows: CityEval[], skipped: { city: string; reason: string }[], models: string): string {
  const a = aggregate(rows);
  const off = a.plain.notYoung + a.plain.noData;
  const top = repeats(rows).slice(0, 3);
  const low = rows.flatMap((c) => c.fanDrive.filter((p) => p.youthSkew < YOUNG).map((p) => `${p.name} in ${c.city} (${signed(p.youthSkew)})`));
  return `# FanDrive vs plain AI: ${a.cities}-city evaluation

_Generated ${today()} by \`pnpm eval\` (scripts/eval.ts). Raw plain-AI answers: [\`raw/\`](raw/). Machine-readable results: [\`results.json\`](results.json)._

## Headline

- **${a.plain.older} of ${a.plain.picks} plain-AI picks (${pct(a.plain.older, a.plain.picks)}) have fans who skew older than average** (youth skew below zero).
- **${off} of ${a.plain.picks} (${pct(off, a.plain.picks)}) were not young-skewing or had no Qloo audience data** (${a.plain.notYoung} under +${YOUNG.toFixed(2)}, ${a.plain.noData} no data).
- **FanDrive's top 3: ${a.fanDrive.young} of ${a.fanDrive.picks} (${pct(a.fanDrive.young, a.fanDrive.picks)}) young-skewing**, average youth skew **${signed(a.fanDrive.meanSkew)}** vs **${signed(a.plain.meanSkew)}** for plain-AI picks with data.
- In **${a.citiesWithMiss} of ${a.cities} cities**, plain AI never suggested at least one of FanDrive's top 3 (${a.missedPicks} missed picks in total).
- **Local picks:** Qloo's local taste gave a young-leaning, city-specific lead fandom in **${a.local.cities} of ${a.cities} cities** (${a.local.distinct} different fandoms, average youth skew ${signed(a.local.meanSkew)}).

## Method

1. **Plain AI.** For each city, the app's own Gemini chain (${models}; the first model to answer is used) is asked once, with the app's own plain-AI prompt and no Qloo data, for up to 5 pop-culture partners for a blood drive aimed at first-time donors aged 16–24. Each pick is looked up in Qloo and its fans' age skew is read from \`/v2/insights\` (\`filter.type=urn:demographics\`).
2. **FanDrive.** Qloo scores a pool of the app's standard candidates, **every name plain AI suggested**, and Qloo's own **local taste** for the city (its top artists and people for young people there, popularity ≥ 0.75, minus names that also top more than one of 10 reference cities), on youth skew, local love (\`signal.location.query\` + \`signal.demographics.age\`) and fan density (heatmap vs a mass-brand baseline). The top 3 by Young-Donor Pull are kept. Older-skewing fandoms can't rank above young ones. The **local pick** is the local-taste fandom the report leads with next to the top pick (young-leaning, best ranked).
3. **Young-skewing** means youth skew ≥ +${YOUNG.toFixed(2)} for ages 16–24 (Qloo's "24 and under" bucket), the same line the app's plain-AI check uses. Averages pool every pick across cities.

## What this does and doesn't show

- It shows how often an LLM's intuition about "young" fandoms disagrees with Qloo's audience data, and what FanDrive recommends instead.
- FanDrive is scored with the same Qloo data it optimises, so its own share is high by design. The informative numbers are the plain-AI ones.
- It does **not** measure donor turnout. That needs a real drive; see the [method page](https://fandrive-nu.vercel.app/method) for past partners and their published results.
- **Repeats.** The most repeated FanDrive picks are ${top.map(([n, k]) => `${n} (${k} cities)`).join(", ")}. Fandoms that skew young everywhere can still win on score, so every report also leads with a **local pick** (${a.local.cities} of ${a.cities} cities, ${a.local.distinct} different fandoms). The map and venues are always city-specific.
- **"Local" is Qloo's view, not a hometown check.** Local picks are what young people in the city over-index on compared with the reference cities. Many are hometown artists and athletes; some are stars who are simply more loved there.
- **Many picks are individual public figures.** The app tells organisers to check a person's fit before using their name, and campaign copy only ever says "<name> fans", never implying an endorsement.
- ${low.length ? `${low.length} FanDrive picks were under +${YOUNG.toFixed(2)}: ${low.join(", ")}. They ranked on local love and fan density; the score keeps any young-leaning (≥ 0) fandom above older ones, not above +${YOUNG.toFixed(2)}.` : "Every FanDrive pick was young-skewing."}
- One plain-AI sample per city (cached in \`raw/\`). Qloo data for India is thinner, and some cities are "medium".

## Results by city

${renderMarkdown(rows)}
${skipped.length ? `\nSkipped: ${skipped.map((x) => `${x.city} (${x.reason})`).join("; ")}.\n` : ""}`;
}

async function main() {
  mkdirSync(RAW, { recursive: true });
  const only = process.argv[2];
  const rows: CityEval[] = [];
  const skipped: { city: string; reason: string }[] = [];
  for (const [slug, name] of CITIES.filter(([s]) => !only || s === only)) {
    const t0 = Date.now();
    const r = await evalCity(slug, name);
    if (typeof r === "string") { skipped.push({ city: name, reason: r }); console.log(`${name}: skipped (${r})`); continue; }
    rows.push(r);
    console.log(`${name}: plain ${r.plainAi.map((p) => `${p.name} ${signed(p.youthSkew)}`).join(", ")} | FanDrive ${r.fanDrive.map((p) => `${p.name} ${signed(p.youthSkew)}`).join(", ")} (${Math.round((Date.now() - t0) / 1000)}s)`);
  }
  if (only) return;
  const c = getConfig();
  const models = [c.geminiModel, ...c.geminiFallbackModels].join(", then ");
  const result = { generatedAt: today(), band: "16-24", models, youngThreshold: YOUNG, aggregate: aggregate(rows), cities: rows, skipped };
  writeFileSync("docs/eval/results.json", `${JSON.stringify(result, null, 2)}\n`);
  writeFileSync("src/data/eval.json", `${JSON.stringify(result, null, 2)}\n`);
  writeFileSync("docs/eval/README.md", report(rows, skipped, models));
  console.log(JSON.stringify(result.aggregate));
}
main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
