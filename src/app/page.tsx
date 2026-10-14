import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

const EXAMPLES: [string, string, string][] = [["houston", "Houston", "bg-sun"], ["atlanta", "Atlanta", "bg-bubble"], ["seattle", "Seattle", "bg-sky"], ["mumbai", "Mumbai", "bg-mint"]];
const STEPS: [string, string, string][] = [
  ["Who skews young?", "Qloo audience data shows how far each fan base leans under 25.", "bg-bubble"],
  ["Who does your city love?", "Qloo scores each fandom for young people in your city.", "bg-sky"],
  ["Where are the fans?", "Qloo heatmaps show the neighbourhoods. FanDrive picks halls, campuses and gyms nearby that can host.", "bg-mint"],
];
const PROOF: [string, string][] = [
  ["150,000+", "first-time donors from the Red Cross × NFL partnership over seven years"],
  ["+600%", "search interest for Red Cross after the Peanuts Snoopy shirt went viral"],
  ["16%", "first-timers at Metallica drives. Qloo says their fans skew 45–54"],
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-4 py-10 sm:px-6">
        <section className="flex flex-wrap items-center gap-10">
          <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-6">
            <div className="flex flex-wrap gap-3 font-bold">
              <span className="-rotate-3 border-[3px] border-black bg-sun px-3 py-1">For blood banks</span>
              <span className="rotate-2 border-[3px] border-black bg-bubble px-3 py-1">For student organisers</span>
              <span className="-rotate-1 border-[3px] border-black bg-sky px-3 py-1">Powered by Qloo taste data</span>
            </div>
            <h1 className="font-display text-5xl leading-[0.95] sm:text-7xl">
              Every fandom is a <span className="inline-block -rotate-2 border-[3px] border-black bg-alarm px-3 shadow-[6px_6px_0_#000]">blood drive</span> waiting to happen.
            </h1>
            <p className="max-w-2xl text-xl">Donors under 30 fell 47% in ten years. FanDrive&rsquo;s AI agent finds which fandoms skew young in your city, where those fans live and which venues nearby can host. Then it writes the posters.</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/plan" className="press border-[3px] border-black bg-black px-6 py-3 font-display text-xl text-white shadow-[4px_4px_0_#FF4949]">Plan a drive →</Link>
              <Link href="/plan?example=houston" className="press brut-sm bg-white px-6 py-3 font-display text-xl">Watch Houston</Link>
            </div>
          </div>
          <div id="examples" className="brut flex min-w-0 flex-[1_1_320px] flex-col gap-4 bg-sun p-6">
            <h2 className="font-display text-2xl">Try a city</h2>
            <p className="font-semibold">Recorded runs replay the agent&rsquo;s work in seconds.</p>
            <div className="grid grid-cols-2 gap-4">
              {EXAMPLES.map(([slug, name, tone], i) => (
                <Link key={slug} href={`/plan?example=${slug}`} className={`press brut-sm ${tone} px-3 py-3 text-center font-display text-lg ${i % 2 ? "rotate-1" : "-rotate-1"}`}>{name}</Link>
              ))}
            </div>
          </div>
        </section>

        <section id="how" aria-labelledby="how-h" className="flex flex-col gap-6">
          <h2 id="how-h" className="font-display text-4xl">How it works</h2>
          <ol className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))]">
            {STEPS.map(([title, body, tone], i) => (
              <li key={title} className={`brut flex flex-col gap-2 p-6 ${tone}`}>
                <span className="font-display text-5xl">{i + 1}</span>
                <h3 className="font-display text-2xl">{title}</h3>
                <p className="font-semibold">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="why-h" className="brut flex flex-col gap-6 bg-white p-6 sm:p-8">
          <h2 id="why-h" className="font-display text-4xl">Fandoms already fill blood drives.</h2>
          <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr))]">
            {PROOF.map(([n, t], i) => (
              <div key={n} className={`border-[3px] border-black p-5 ${["bg-sun", "bg-bubble", "bg-sky"][i]}`}>
                <div className="font-display text-5xl">{n}</div>
                <p className="mt-2 font-semibold">{t}</p>
              </div>
            ))}
          </div>
          <p className="text-lg font-semibold">The partner is still picked by gut feel. FanDrive picks it with data, and tells you where to set up. <Link href="/method" className="underline underline-offset-4">See the method →</Link></p>
        </section>

        <footer className="border-t-[3px] border-black pt-4 text-sm font-semibold">
          Sources: American Red Cross (Aug 2026 national blood crisis); Blood Centers of America via KBIA (Aug 2026); AABB (Jan 2026); Red Cross partnership results (2026); NBC News (2023).
          FanDrive gives crowd-level guidance, not medical advice. Check eligibility with your blood service. Fandoms are a theme only; no artist, team or game endorses these drives.
        </footer>
      </main>
    </>
  );
}
