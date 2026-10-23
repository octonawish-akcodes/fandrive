import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { signed } from "@/lib/client/view";
import eval_ from "@/data/eval.json";
import validation from "@/data/validation.json";

export const metadata = { title: "For judges · FanDrive", description: "FanDrive in two minutes: what it does, how to test it, the evidence, how Qloo is used, and its limits." };

const pct = (n: number, d: number) => `${Math.round((100 * n) / Math.max(1, d))}%`;
const minus = (x: number) => x.toFixed(2).replace("-", "−");

const STEPS: [string, string, string][] = [
  ["Watch a recorded run", "The agent's real work replays in about 8 seconds: Houston leads with Astros star Jeremy Peña and rapper Don Toliver.", "/plan?example=houston"],
  ["Plan any city live", "Type a city and press Plan my drives. The agent tests about 20 fandoms against Qloo in 30–90 seconds.", "/plan"],
  ["Check the evidence", "Every partner has a Qloo evidence drop-down, and the receipts drawer lists every Qloo request as a curl you can re-run.", "/plan?example=seattle"],
];
const QLOO: [string, string][] = [
  ["/v2/insights · urn:demographics", "How young each fan base is"],
  ["/v2/insights · urn:entity + location + age", "How much the city's young people love it, and (with no entity filter) its local taste"],
  ["/v2/insights · urn:heatmap", "Where the fans live, against a baseline of mass brands"],
  ["/v2/insights · urn:entity:place + filter.tags", "Venues near each fan zone that can host"],
  ["/v2/insights · urn:tag, /v2/trending, /v2/tags, /search", "What fans also love, momentum, venue tags, name matching"],
];

export default function JudgesPage() {
  const a = eval_.aggregate;
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-10 sm:px-6">
        <section className="flex flex-col gap-4">
          <span className="self-start -rotate-2 border-[3px] border-black bg-sun px-3 py-1 font-bold">For judges</span>
          <h1 className="max-w-4xl font-display text-5xl leading-[0.95] sm:text-6xl">An AI agent that finds the fandoms that bring young blood donors.</h1>
          <p className="max-w-3xl text-xl">Blood banks already team up with fandoms, but they pick partners by gut feel, and famous isn&rsquo;t the same as young. FanDrive uses Qloo to find which fandoms young people in a city actually love, where those fans live and which venues nearby can host. Then it writes the campaign.</p>
        </section>

        <section aria-labelledby="try-h" className="flex flex-col gap-4">
          <h2 id="try-h" className="font-display text-3xl">Try it in 60 seconds</h2>
          <ol className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr))]">
            {STEPS.map(([t, b, href], i) => (
              <li key={t} className={`brut flex flex-col gap-2 p-6 ${["bg-sun", "bg-bubble", "bg-sky"][i]}`}>
                <span className="font-display text-4xl">{i + 1}</span>
                <h3 className="font-display text-2xl">{t}</h3>
                <p className="font-semibold">{b}</p>
                <Link href={href} className="mt-auto pt-2 font-bold underline underline-offset-4">Open →</Link>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="proof-h" className="flex flex-col gap-4">
          <h2 id="proof-h" className="font-display text-3xl">The evidence</h2>
          <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr))]">
            <div className="brut flex flex-col gap-2 bg-mint p-6"><div className="font-display text-5xl">{minus(validation.spearman)}</div><p className="font-semibold">Qloo&rsquo;s age signal against Nielsen&rsquo;s viewer ages for 8 leagues (rank correlation; −1 is a perfect match).</p></div>
            <div className="brut flex flex-col gap-2 bg-alarm p-6 text-white"><div className="font-display text-5xl">{pct(a.plain.older, a.plain.picks)}</div><p className="font-semibold">of {a.plain.picks} partners a plain AI suggested across {a.cities} cities have fans who skew older.</p></div>
            <div className="brut flex flex-col gap-2 bg-sun p-6"><div className="font-display text-5xl">{signed(a.fanDrive.meanSkew ?? 0)}</div><p className="font-semibold">average youth skew of FanDrive&rsquo;s top picks, vs {signed(a.plain.meanSkew ?? 0)} for plain AI.</p></div>
            <div className="brut flex flex-col gap-2 bg-sky p-6"><div className="font-display text-5xl">{a.local.cities}/{a.cities}</div><p className="font-semibold">cities got a city-specific local pick ({a.local.distinct} different fandoms).</p></div>
          </div>
          <p className="font-semibold">Past partners through Qloo, the validation and the 20-city table: <Link href="/method" className="underline underline-offset-4">the method page →</Link></p>
        </section>

        <section aria-labelledby="qloo-h" className="brut bg-white p-6">
          <h2 id="qloo-h" className="mb-3 font-display text-3xl">Why it needs Qloo</h2>
          <p className="mb-4 font-semibold">An LLM knows who is famous. Only taste data says whose fans are young, who this city loves more than others, and where those fans live. Without Qloo, FanDrive would recommend famous names.</p>
          <ul className="flex flex-col gap-2">{QLOO.map(([e, w]) => <li key={e} className="flex flex-wrap gap-x-4 border-t-[3px] border-black pt-2"><code className="min-w-0 flex-[1_1_320px] font-bold">{e}</code><span className="min-w-0 flex-[2_1_320px] font-semibold">{w}</span></li>)}</ul>
        </section>

        <section className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr))]">
          <div className="brut flex flex-col gap-2 bg-bubble p-6">
            <h2 className="font-display text-2xl">Built to be trusted</h2>
            <p className="font-semibold">28 automated tests guard safety: no invented numbers, no implied endorsements, no bars or children&rsquo;s venues as hosts, no identity or religion tags, no one under 18, no names with profanity, and older-skewing fan bases can never outrank young ones. Only public names and places go to Qloo.</p>
          </div>
          <div className="brut flex flex-col gap-2 bg-mint p-6">
            <h2 className="font-display text-2xl">Use it from your own agent</h2>
            <p className="font-semibold">FanDrive is an MCP server with three read-only tools.</p>
            <code className="block overflow-x-auto border-[3px] border-black bg-white p-3 text-sm font-bold">claude mcp add --transport http fandrive https://fandrive-nu.vercel.app/api/mcp</code>
          </div>
        </section>

        <section aria-labelledby="limits-h" className="border-t-[3px] border-black pt-6">
          <h2 id="limits-h" className="font-display text-2xl">Honest limits</h2>
          <ul className="mt-2 list-disc pl-5 font-semibold">
            <li>FanDrive has not yet run a real drive, so it shows which fandoms skew young and local, not how many donors they bring. The method page sets past partners&rsquo; published results beside their Qloo data.</li>
            <li>Qloo data is strong in large cities and thinner elsewhere; every plan shows a data badge.</li>
            <li>&ldquo;Local&rdquo; is Qloo&rsquo;s view of what young people there over-index on, not a hometown check (a &ldquo;Born here&rdquo; badge shows when Qloo&rsquo;s birthplace matches).</li>
            <li>Qloo can&rsquo;t tell who has died or is in the news; the agent is told to skip such names, and plans led by a person remind organisers to check fit.</li>
          </ul>
        </section>
      </main>
    </>
  );
}
