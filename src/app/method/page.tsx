import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { signed, youthBarPct } from "@/lib/client/view";
import eval_ from "@/data/eval.json";
import validation from "@/data/validation.json";
import method from "@/data/method.json";

export const metadata = { title: "How FanDrive decides · FanDrive", description: "Why famous isn't the same as young: Qloo's age profile of past blood-drive partners next to their published results, and how FanDrive scores fandoms." };

const SIGNALS: [string, string, string, string][] = [
  ["Youth skew", "How far the fan base leans 24-and-under.", "/v2/insights · urn:demographics", "bg-bubble"],
  ["Local love", "How much young people in this city like it.", "/v2/insights · signal.location + signal.demographics.age", "bg-sky"],
  ["Fan density", "Where fans beat the city's baseline of mass brands.", "/v2/insights · urn:heatmap vs baseline", "bg-mint"],
];
const ENDPOINTS: [string, string][] = [
  ["/search", "Resolve and confirm every name (mismatches are skipped with a reason)."],
  ["/v2/insights · urn:demographics", "Age skew of each fan base."],
  ["/v2/insights · urn:entity:<type> + location + age", "Local love among young people in the city."],
  ["/v2/insights · urn:entity:artist|person + location + age (no entity filter)", "Local taste: what young people in the city over-index on, minus names that also top other reference cities."],
  ["/v2/insights · urn:heatmap", "Fan zones: cells where the fandom beats the baseline."],
  ["/v2/insights · urn:entity:place (+ filter.tags)", "Venues near each fan zone, including campuses, halls and centres by Qloo place tag."],
  ["/v2/tags", "Resolve those place tags (university, community centre, event venue…)."],
  ["/v2/insights · urn:tag", "What the top fandoms' fans also love (culture tags only)."],
  ["/v2/trending", "Momentum of TV, film, music and podcast picks."],
];

const pct = (n: number, d: number) => `${Math.round((100 * n) / Math.max(1, d))}%`;
const off = eval_.aggregate.plain.notYoung + eval_.aggregate.plain.noData;

export default function MethodPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-14 px-4 py-10 sm:px-6">
        <section className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-3 font-bold">
            <span className="-rotate-2 border-[3px] border-black bg-sun px-3 py-1">The method</span>
            <span className="rotate-1 border-[3px] border-black bg-sky px-3 py-1">Every number from Qloo</span>
          </div>
          <h1 className="max-w-4xl font-display text-5xl leading-[0.95] sm:text-7xl">
            Famous isn&rsquo;t the same as <span className="inline-block -rotate-2 border-[3px] border-black bg-alarm px-3 shadow-[6px_6px_0_#000]">young</span>.
          </h1>
          <p className="max-w-3xl text-xl">Blood banks already team up with fandoms. FanDrive asks Qloo which fandoms actually skew young, are loved locally and live near a hall that can host. Here is how past partners look through that lens.</p>
        </section>

        <section aria-labelledby="cases-h" className="flex flex-col gap-6">
          <h2 id="cases-h" className="font-display text-4xl">Past partners, through Qloo</h2>
          <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr))]">
            {method.cases.map((c, i) => (
              <article key={c.name} className={`brut flex flex-col gap-3 p-6 ${["bg-sun", "bg-bubble", "bg-sky", "bg-mint"][i % 4]}`}>
                <div className="text-sm font-bold">{c.partnership}</div>
                <h3 className="font-display text-3xl leading-none">{c.matchedName ?? c.name}</h3>
                {c.youthSkew === null ? (
                  <p className="font-semibold">Qloo has no age data for this fan base.</p>
                ) : (
                  <>
                    <div className="font-display text-5xl">{signed(c.youthSkew)}</div>
                    <div className="h-5 border-[3px] border-black bg-white" role="img" aria-label={`Youth skew ${signed(c.youthSkew)}`}>
                      <div className="h-full bg-black" style={{ width: `${youthBarPct(c.youthSkew)}%` }} />
                    </div>
                    <div className="font-semibold">youth skew · fans over-index most at {c.mostOverIndexedAge}</div>
                  </>
                )}
                <p className="mt-auto border-t-[3px] border-black pt-3 font-semibold">{c.outcome}</p>
                <a href={c.url} className="text-sm font-bold underline underline-offset-4" target="_blank" rel="noreferrer">{c.source}</a>
              </article>
            ))}
          </div>
          <div className="brut flex flex-col gap-2 bg-white p-6">
            <p className="text-lg font-semibold">
              <b>Consistent with the results, not a prediction:</b> Metallica&rsquo;s fans skew older (most over-represented at 45–54), and only 16% of its donors were first-timers. The NFL reached 150,000+ first-timers through sheer reach, not young fans (+0.04).
            </p>
            <p className="text-lg font-semibold">For contrast, fandoms FanDrive picked in live Houston runs (13–14 Oct 2026): Roblox <b>+0.93</b>, Kai Cenat <b>+0.88</b>, Fortnite <b>+0.72</b>.</p>
            <p className="text-sm">Qloo data generated {method.generatedAt}. Youth skew is Qloo&rsquo;s 24-and-under age affinity, from −1 (older) to +1 (younger).</p>
          </div>
        </section>

        <section aria-labelledby="val-h" className="flex flex-col gap-6">
          <h2 id="val-h" className="font-display text-4xl">Does Qloo&rsquo;s age data match the real world?</h2>
          <p className="max-w-3xl text-lg font-semibold">FanDrive stands on one signal: how young a fan base is. So we checked it against an independent source, Nielsen&rsquo;s ages of live TV viewers for eight leagues, which Qloo never sees.</p>
          <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))]">
            <div className="brut flex flex-col gap-2 bg-mint p-6">
              <div className="font-display text-6xl">{validation.spearman.toFixed(2).replace("-", "−")}</div>
              <p className="font-semibold">rank correlation between Nielsen&rsquo;s viewer age and Qloo&rsquo;s young-vs-old lean (−1 would be a perfect match). The three oldest audiences, golf, NASCAR and baseball, are the only three Qloo scores as older-leaning.</p>
            </div>
            <div className="brut overflow-x-auto bg-white">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Nielsen TV viewer age and Qloo young lean by league</caption>
                <thead className="border-b-[3px] border-black font-display text-base"><tr><th className="p-3">League</th><th className="p-3">TV viewer age</th><th className="p-3">Qloo young lean</th></tr></thead>
                <tbody>
                  {validation.rows.map((r) => (
                    <tr key={r.label} className="border-t-2 border-black/20"><td className="p-3 font-bold">{r.label}</td><td className="p-3">{r.tvAge}</td><td className={`p-3 font-bold ${r.qlooLean < 0 ? "text-alarm" : ""}`}>{signed(r.qlooLean)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-sm font-semibold">
            Young lean = Qloo&rsquo;s average affinity for ages under 35 minus 45 and over. Honest limits: the benchmark is TV viewers in 2016, not all fans today (WWE&rsquo;s young fans watch online, so it&rsquo;s the one big miss), and Qloo&rsquo;s narrower 24-and-under value, which FanDrive scores on, tracks less tightly for whole leagues ({validation.spearman24.toFixed(2).replace("-", "−")}). Sources:{" "}
            {validation.sources.map((s, i) => <span key={s.url}>{i ? " · " : ""}<a href={s.url} className="underline underline-offset-4" target="_blank" rel="noreferrer">{s.name.split(":")[0]}</a></span>)}. Re-run with <code>pnpm validate-age</code>.
          </p>
        </section>

        <section aria-labelledby="eval-h" className="flex flex-col gap-6">
          <h2 id="eval-h" className="font-display text-4xl">{eval_.aggregate.cities} cities: plain AI vs FanDrive</h2>
          <p className="max-w-3xl text-lg font-semibold">In each city, the same model was asked for youth blood-drive partners without Qloo, and every pick was checked against Qloo&rsquo;s age data. FanDrive scored those picks plus its own candidates.</p>
          <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))]">
            <div className="brut flex flex-col gap-2 bg-alarm p-6 text-white">
              <div className="font-display text-6xl">{pct(eval_.aggregate.plain.older, eval_.aggregate.plain.picks)}</div>
              <p className="font-semibold">of plain-AI picks have fans who skew <b>older</b> than average. {pct(off, eval_.aggregate.plain.picks)} weren&rsquo;t young-skewing or had no Qloo audience data.</p>
            </div>
            <div className="brut flex flex-col gap-2 bg-sun p-6">
              <div className="font-display text-6xl">{signed(eval_.aggregate.fanDrive.meanSkew ?? 0)}</div>
              <p className="font-semibold">average youth skew of FanDrive&rsquo;s top 3, vs {signed(eval_.aggregate.plain.meanSkew ?? 0)} for plain-AI picks with data.</p>
            </div>
            <div className="brut flex flex-col gap-2 bg-sky p-6">
              <div className="font-display text-6xl">{eval_.aggregate.citiesWithMiss}/{eval_.aggregate.cities}</div>
              <p className="font-semibold">cities where plain AI never suggested at least one of FanDrive&rsquo;s top 3.</p>
            </div>
            <div className="brut flex flex-col gap-2 bg-mint p-6">
              <div className="font-display text-6xl">{eval_.aggregate.local.distinct}</div>
              <p className="font-semibold">different local picks across {eval_.aggregate.local.cities} cities, from Qloo&rsquo;s local taste (e.g. Nico Hoerner in Chicago, STS9 in Denver).</p>
            </div>
          </div>
          <div className="brut overflow-x-auto bg-white">
            <table className="w-full min-w-[860px] text-left text-sm">
              <caption className="sr-only">Plain-AI picks and FanDrive&rsquo;s top 3 by city, with Qloo youth skew</caption>
              <thead className="border-b-[3px] border-black font-display text-base">
                <tr><th className="p-3">City</th><th className="p-3">Plain AI suggested</th><th className="p-3">FanDrive top 3</th><th className="p-3">Local pick</th></tr>
              </thead>
              <tbody>
                {eval_.cities.map((c) => (
                  <tr key={c.city} className="border-t-2 border-black/20 align-top">
                    <td className="p-3 font-bold">{c.city}<div className="font-normal">data: {c.badge}</div></td>
                    <td className="p-3">{c.plainAi.map((p) => (
                      <span key={p.name} className={`mr-1 mb-1 inline-block border-2 border-black px-1.5 ${p.youthSkew === null ? "bg-paper" : p.youthSkew >= eval_.youngThreshold ? "bg-mint" : "bg-bubble"}`}>{p.name} {p.youthSkew === null ? "· no data" : signed(p.youthSkew)}</span>
                    ))}</td>
                    <td className="p-3">{c.fanDrive.map((p) => (
                      <span key={p.name} className={`mr-1 mb-1 inline-block border-2 border-black px-1.5 font-bold ${p.youthSkew >= eval_.youngThreshold ? "bg-mint" : "bg-bubble"}`}>{p.name} {signed(p.youthSkew)}</span>
                    ))}</td>
                    <td className="p-3">{c.localPick ? <span className="inline-block border-2 border-black bg-sky px-1.5 font-bold">{c.localPick.name} {signed(c.localPick.youthSkew)}</span> : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm font-semibold">Green: youth skew ≥ {signed(eval_.youngThreshold)} (ages 16–24). Pink: not young-skewing. FanDrive is scored with the same Qloo data it optimises, so the plain-AI numbers are the informative ones; this is not a turnout measure. Local picks are what young people in the city over-index on compared with 10 reference cities (Qloo&rsquo;s view, not a hometown check). One plain-AI answer per city, recorded {eval_.generatedAt} with {eval_.models.split(",")[0]}. Raw answers and script: <code>docs/eval</code>, <code>scripts/eval.ts</code>.</p>
        </section>

        <section aria-labelledby="score-h" className="flex flex-col gap-6">
          <h2 id="score-h" className="font-display text-4xl">How a fandom is scored</h2>
          <ol className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))]">
            {SIGNALS.map(([t, body, api, tone]) => (
              <li key={t} className={`brut flex flex-col gap-2 p-6 ${tone}`}>
                <h3 className="font-display text-2xl">{t}</h3>
                <p className="font-semibold">{body}</p>
                <code className="mt-auto text-sm">{api}</code>
              </li>
            ))}
          </ol>
          <p className="brut-sm bg-white p-4 text-lg font-semibold">
            <b>Young-Donor Pull</b> = 0.35 × youth skew + 0.45 × local love + 0.20 × fan density. Any fandom whose fans skew older ranks below every young one, and the AI planner can&rsquo;t override that.
          </p>
        </section>

        <section aria-labelledby="venue-h" className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr))]">
          <div className="brut flex flex-col gap-2 bg-sky p-6">
            <h2 id="venue-h" className="font-display text-2xl">Where to host</h2>
            <p className="font-semibold">Schools, colleges, community centres, libraries, gyms, halls, stadiums and places of worship near each fan zone. Bars and clubs get flyers, never the drive. No shooting ranges, cigar or vape shops, tattoo parlours, children&rsquo;s schools or private homes.</p>
          </div>
          <div className="brut flex flex-col gap-2 bg-bubble p-6">
            <h2 className="font-display text-2xl">Guardrails</h2>
            <p className="font-semibold">No invented numbers (digits or words). No implied celebrity endorsements. &ldquo;Fans also love&rdquo; shows culture tags only, never religion or identity. Every Qloo request is listed as a receipt you can re-run.</p>
          </div>
        </section>

        <section aria-labelledby="endpoints-h" className="brut bg-white p-6">
          <h2 id="endpoints-h" className="mb-4 font-display text-3xl">Qloo, call by call</h2>
          <ul className="flex flex-col gap-3">
            {ENDPOINTS.map(([e, why]) => (
              <li key={e} className="flex flex-wrap gap-x-4 gap-y-1 border-t-[3px] border-black pt-3">
                <code className="min-w-0 flex-[1_1_320px] font-bold">{e}</code>
                <span className="min-w-0 flex-[2_1_320px] font-semibold">{why}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="mcp-h" className="brut flex flex-col gap-3 bg-mint p-6">
          <h2 id="mcp-h" className="font-display text-2xl">Use it from your own agent</h2>
          <p className="font-semibold">FanDrive is an MCP server with three read-only tools: <code>plan_blood_drive</code>, <code>score_fandoms</code> and <code>city_strength</code>. Same Qloo data, same guardrails.</p>
          <code className="block overflow-x-auto border-[3px] border-black bg-white p-3 text-sm font-bold">claude mcp add --transport http fandrive https://fandrive-nu.vercel.app/api/mcp</code>
        </section>

        <section aria-labelledby="limits-h" className="border-t-[3px] border-black pt-6">
          <h2 id="limits-h" className="font-display text-2xl">Data limits</h2>
          <ul className="mt-2 list-disc pl-5 font-semibold">
            <li>Qloo&rsquo;s youngest age bucket is &ldquo;24 and under&rdquo;, which includes people too young to donate. Eligibility rules always apply.</li>
            <li>Local love saturates near 1 for popular fandoms, so city-specific signal comes from fan density.</li>
            <li>Qloo&rsquo;s trending series end in September 2025, so momentum is labelled with that window.</li>
            <li>Data is thinner outside the US; FanDrive shows a data badge for every city.</li>
          </ul>
          <p className="mt-6"><Link href="/plan" className="press inline-block border-[3px] border-black bg-black px-6 py-3 font-display text-xl text-white shadow-[4px_4px_0_#FF4949]">Plan a drive →</Link></p>
        </section>
      </main>
    </>
  );
}
