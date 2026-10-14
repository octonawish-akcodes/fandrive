import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { signed, youthBarPct } from "@/lib/client/view";
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
  ["/v2/insights · urn:heatmap", "Fan zones: cells where the fandom beats the baseline."],
  ["/v2/insights · urn:entity:place (+ filter.tags)", "Venues near each fan zone, including campuses, halls and centres by Qloo place tag."],
  ["/v2/tags", "Resolve those place tags (university, community centre, event venue…)."],
  ["/v2/insights · urn:tag", "What the top fandoms' fans also love (culture tags only)."],
  ["/v2/trending", "Momentum of TV, film, music and podcast picks."],
];

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
