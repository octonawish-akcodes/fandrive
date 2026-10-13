"use client";
import type { ReactNode } from "react";
import type { RunState } from "@/lib/client/runState";
import { CreativePanel } from "./CreativePanel";
import { FanMap } from "./FanMap";
import { PartnerTable } from "./PartnerTable";
import { PlainAiPanel } from "./PlainAiPanel";
import { VenueList } from "./VenueList";

const badge = { strong: "bg-emerald-100 text-emerald-800", medium: "bg-amber-100 text-amber-800", thin: "bg-rose-100 text-rose-800" };

function Section({ title, ready, children }: { title: string; ready: boolean; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <h3 className="mb-3 font-semibold">{title}</h3>
      {ready ? children : <div className="h-16 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />}
    </section>
  );
}

export function ReportView({ state }: { state: RunState }) {
  const { city, partners, excluded, maps, creative, plainAi, plan, error, status } = state;
  return (
    <div className="space-y-4">
      {error && <div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-rose-900">{error.message}</div>}
      {city && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold">{city.disambiguation ?? city.name}</span>
          <span className={`rounded px-2 py-0.5 text-xs ${badge[city.badge]}`}>Qloo data: {city.badge}</span>
          {plan && <span className="text-xs text-zinc-500">Planned by {plan.engine === "agent" ? "AI agent" : plan.engine}</span>}
        </div>
      )}
      {status !== "error" && <>
        <Section title="1 · Best partners for young first-time donors" ready={!!partners}>{partners && <PartnerTable partners={partners} excluded={excluded ?? []} />}</Section>
        <Section title="2 · Where their fans are, and where to host" ready={!!maps}>{maps && city && <><FanMap city={city} maps={maps} /><div className="mt-4"><VenueList maps={maps} /></div></>}</Section>
        <Section title="3 · Campaign copy" ready={!!creative}>{creative && <CreativePanel c={creative} />}</Section>
        <Section title="4 · FanDrive vs plain AI" ready={plainAi !== undefined}><PlainAiPanel checks={plainAi ?? null} /></Section>
        {plan && <Section title="Data limits for this run" ready><ul className="list-disc pl-5 text-sm text-zinc-600 dark:text-zinc-400">{plan.limits.map((l) => <li key={l}>{l}</li>)}</ul></Section>}
      </>}
    </div>
  );
}
