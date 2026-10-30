"use client";
import type { RunState } from "@/lib/client/runState";
import { topTwo } from "@/lib/client/view";
import { CreativePanel, PosterCard } from "./CreativePanel";
import { DriveKit } from "./DriveKit";
import { MapCard } from "./MapCard";
import { PartnerTable } from "./PartnerTable";
import { PickCard, SkeletonCard } from "./PickCard";
import { PlainAiPanel } from "./PlainAiPanel";
import { ReceiptsPanel } from "./ReceiptsPanel";
import { StepLog } from "./StepLog";

const BADGE = { strong: "bg-mint", medium: "bg-sun", thin: "bg-bubble" };

export function ReportView({ state }: { state: RunState }) {
  const { city, partners, excluded, maps, creative, plainAi, plan, error, status, picks, steps } = state;
  const running = status === "running";
  const [first, second] = topTwo(partners ?? [], picks);
  const isPick = (id?: string) => !!id && (picks?.ids ?? []).includes(id);
  const log = <div className="contents print:hidden"><StepLog steps={steps} running={running} /></div>;
  return (
    <section aria-labelledby="report-h" className="flex flex-col gap-6">
      {plan && <p className="hidden text-sm font-bold print:block">FanDrive drive brief · planned {plan.createdAt.slice(0, 10)} from Qloo taste data · fandrive-nu.vercel.app/plan?{plan.engine === "recorded" || plan.id.startsWith("example-") ? `example=${plan.id.replace("example-", "")}` : `id=${plan.id}`}</p>}
      {error && <div role="alert" className="brut bg-alarm p-5 text-lg font-bold">{error.message}</div>}
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="report-h" className="font-display text-3xl sm:text-4xl">{city ? `${city.name} report card` : "Report card"}</h2>
        {city && <span className={`border-[3px] border-black px-2.5 py-0.5 font-bold ${BADGE[city.badge]}`}>Qloo data: {city.badge}</span>}
        {plan && <span className="border-[3px] border-black bg-white px-2.5 py-0.5 font-bold">{plan.engine === "agent" ? "Planned by AI agent" : plan.engine === "autopilot" ? "Planned by autopilot" : "Recorded run"}</span>}
      </div>
      {status === "error" ? (steps.length > 0 && log) : <>
        <div className="grid gap-x-6 gap-y-8 [grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))]">
          {running && log}
          {first ? <PickCard partner={first} rank={1} agentPick={isPick(first.entityId)} rationale={isPick(first.entityId) ? picks?.rationale : null} city={city?.name} /> : <SkeletonCard tone="bg-sun" label="Top fandom" />}
          {second ? <PickCard partner={second} rank={2} agentPick={isPick(second.entityId)} city={city?.name} /> : <SkeletonCard tone="bg-bubble" label="Runner-up" />}
          <div className="contents print:hidden">{plainAi !== undefined ? <PlainAiPanel checks={plainAi} partners={partners ?? []} picks={picks} /> : <SkeletonCard label="Plain AI check" />}</div>
          {maps && city ? <MapCard city={city} maps={maps} /> : <div className="col-span-full"><SkeletonCard tone="bg-sky" label="Where to host" /></div>}
          {creative ? <PosterCard c={creative} /> : <SkeletonCard tone="bg-alarm" label="Poster" />}
          {!running && log}
        </div>
        {plan && <DriveKit plan={plan} />}
        {partners && <div className="print:hidden"><PartnerTable partners={partners} excluded={excluded ?? []} picks={picks} /></div>}
        {creative && <CreativePanel c={creative} />}
        {plan?.receipts && plan.receipts.length > 0 && <div className="print:hidden"><ReceiptsPanel receipts={plan.receipts} /></div>}
        {plan && (
          <footer className="border-t-[3px] border-black pt-4">
            <h3 className="font-bold">Data limits for this run</h3>
            <ul className="mt-1 list-disc pl-5 font-semibold">{plan.limits.map((l) => <li key={l}>{l}</li>)}</ul>
          </footer>
        )}
      </>}
    </section>
  );
}
