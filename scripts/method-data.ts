// Builds src/data/method.json: Qloo's age profile of past blood-drive partners next to their published results.
// Run: pnpm method-data (uses the disk cache; a handful of Qloo calls on first run).
import { writeFileSync } from "node:fs";
import { createTools } from "@/lib/engine/tools";
import { youthSkew } from "@/lib/engine/scoring";
import { getQlooApi } from "@/lib/qloo";
import type { EntityType } from "@/lib/qloo/types";

type Case = { name: string; type: EntityType; partnership: string; outcome: string; source: string; url: string };
const CASES: Case[] = [
  { name: "Metallica", type: "artist", partnership: "Red Cross × Metallica (from April 2025)",
    outcome: "25,000+ donations; 16% of participants were first-time donors, nearly half of them aged 16–24.",
    source: "American Red Cross press release, 2026", url: "https://www.redcross.org/about-us/news-and-events/press-release/2026/more-than-25-000-blood-donations-made-in-metallica-partnership.html" },
  { name: "National Football League", type: "brand", partnership: "Red Cross × NFL (7 years)",
    outcome: "More than 150,000 first-time blood donors over seven years.",
    source: "American Red Cross press release, 2026", url: "https://www.redcross.org/about-us/news-and-events/press-release/2026/-red-cross-teeters-on-blood-shortage--give-to-win-super-bowl-tri.html" },
  { name: "Peanuts", type: "tv_show", partnership: "Red Cross × Peanuts Snoopy shirt (April 2023)",
    outcome: "Traffic to the appointment page up 50% and organic search up 600% after the shirt went viral on TikTok.",
    source: "NBC News, April 2023", url: "https://www.nbcnews.com/pop-culture/pop-culture-news/red-cross-snoopy-shirt-drives-blood-donations-tiktok-rcna78749" },
  { name: "Game of Thrones", type: "tv_show", partnership: "HBO × Red Cross “Bleed for the Throne” (2019)",
    outcome: "The largest blood-donation promotion by an entertainment company in Red Cross history: drives in 43 states and at 9 colleges.",
    source: "American Red Cross, 2019", url: "https://www.redcross.org/about-us/news-and-events/news/2019/red-cross-and-hbo-urge-game-of-thrones-fans-to-bleed-for-the-throne.html" },
];
const AGE_LABEL: Record<string, string> = { "24_and_younger": "24 and under", "25_to_29": "25–29", "30_to_34": "30–34", "35_to_44": "35–44", "45_to_54": "45–54", "55_and_older": "55+" };

async function main() {
  const tools = createTools(getQlooApi());
  const resolved = await tools.findAndConfirm(CASES.map((c) => ({ name: c.name, type: c.type })));
  const ids = resolved.filter((r) => r.status === "ok").map((r) => r.entityId!);
  const ages = await tools.fanAge(ids);
  const rows = CASES.map((c, i) => {
    const r = resolved[i];
    const d = r.status === "ok" ? ages.get(r.entityId!) : null;
    const entries = d ? Object.entries(d.age).filter(([, v]) => typeof v === "number") as [string, number][] : [];
    const top = entries.sort((a, b) => b[1] - a[1])[0];
    return { ...c, matchedName: r.matchedName ?? null, youthSkew: d ? youthSkew(d, "16-24") : null, mostOverIndexedAge: top ? AGE_LABEL[top[0]] ?? top[0] : null };
  });
  writeFileSync("src/data/method.json", JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), cases: rows }, null, 2) + "\n");
  for (const r of rows) console.log(`${r.name.padEnd(26)} matched=${r.matchedName} youth=${r.youthSkew?.toFixed(2)} top=${r.mostOverIndexedAge}`);
}
main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
