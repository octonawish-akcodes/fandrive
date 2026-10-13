import { mkdirSync, writeFileSync } from "node:fs";
import { getModel } from "@/lib/agent/model";
import { runPlan } from "@/lib/agent/run";
import { createTools } from "@/lib/engine/tools";
import { PlanInputSchema, type RunEvent } from "@/lib/plan/schema";
import { getQlooApi } from "@/lib/qloo";

const CITIES: [string, string][] = [["houston", "Houston, TX"], ["atlanta", "Atlanta, GA"], ["seattle", "Seattle, WA"], ["mumbai", "Mumbai"]];

async function main() {
  mkdirSync("public/examples", { recursive: true });
  for (const [slug, city] of CITIES.filter(([s]) => !process.argv[2] || s === process.argv[2])) {
    const events: RunEvent[] = [];
    const input = PlanInputSchema.parse({ city, startDate: "2026-11-14", endDate: "2026-12-13", partners: [] });
    const plan = await runPlan(input, { makeTools: (on) => createTools(getQlooApi(), on), model: getModel(), newId: () => `example-${slug}` }, (e) => events.push(e));
    if (!plan) { console.error(`${slug}: failed`, events.at(-1)); continue; }
    writeFileSync(`public/examples/${slug}.json`, JSON.stringify({ slug, city, recordedAt: new Date().toISOString().slice(0, 10), events }));
    console.log(`${slug}: ${plan.engine}, ${plan.partners.length} partners, top = ${plan.partners[0]?.name}`);
  }
}
main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
