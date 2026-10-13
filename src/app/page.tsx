import Link from "next/link";

const EXAMPLES = [["houston", "Houston"], ["atlanta", "Atlanta"], ["seattle", "Seattle"], ["mumbai", "Mumbai"]];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-rose-600">FanDrive</p>
      <h1 className="mt-2 text-4xl font-bold">Every fandom is a blood drive waiting to happen.</h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-300">
        Young donors are disappearing: donors under 30 fell 47% in ten years. FanDrive measures which fan bases skew young in your city,
        where those fans live, and which venues nearby can host a drive, then writes the plan.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/plan" className="rounded bg-rose-600 px-4 py-2 font-medium text-white">I work at a blood bank</Link>
      </div>
      <p className="mt-6 text-sm text-zinc-500">Or watch a recorded run:</p>
      <div className="mt-2 flex flex-wrap gap-2">{EXAMPLES.map(([slug, name]) => (
        <Link key={slug} href={`/plan?example=${slug}`} className="rounded-full border px-3 py-1 text-sm">{name}</Link>
      ))}</div>
      <ol className="mt-10 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
        <li><b>1. Who skews young?</b> Qloo audience data shows each fan base&rsquo;s age skew.</li>
        <li><b>2. Who does your city love?</b> Qloo scores each partner for young people in your city.</li>
        <li><b>3. Where are the fans?</b> Qloo heatmaps show the neighbourhoods; we pick venues that can host.</li>
      </ol>
      <p className="mt-10 text-xs text-zinc-400">Sources: American Red Cross (Aug 2026 national blood crisis); Blood Centers of America via KBIA (Aug 2026); AABB (Jan 2026).
        FanDrive gives crowd-level guidance, not medical advice. Check eligibility with your blood service.</p>
    </main>
  );
}
