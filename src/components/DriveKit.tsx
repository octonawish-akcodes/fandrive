"use client";
import { campaignTasks, kitFileName, toIcs, venuesCsv } from "@/lib/plan/kit";
import type { Plan } from "@/lib/plan/schema";
import { dateLabel } from "@/lib/plan/templates";

const TONE = { prep: "bg-white", drive: "bg-alarm", after: "bg-mint" } as const;

function download(name: string, type: string, body: string) {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** The plan as something an organiser can act on: a dated campaign, a calendar file, a venue sheet and a printable brief. */
export function DriveKit({ plan }: { plan: Plan }) {
  const today = new Date().toISOString().slice(0, 10);
  const tasks = campaignTasks(plan, today);
  const name = kitFileName(plan);
  const btn = "press brut-sm min-h-11 px-3 py-2 font-bold";
  return (
    <section aria-labelledby="calendar-h" className="brut bg-sun p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 id="calendar-h" className="font-display text-2xl sm:text-3xl">Your campaign calendar</h3>
        <div className="flex flex-wrap gap-2 print:hidden">
          <button type="button" className={`${btn} bg-white`} onClick={() => download(`${name}.ics`, "text/calendar;charset=utf-8", toIcs(tasks, plan.id, new Date()))}>Add to calendar (.ics)</button>
          <button type="button" className={`${btn} bg-white`} onClick={() => download(`${name}-venues.csv`, "text/csv;charset=utf-8", "\uFEFF" + venuesCsv(plan))}>Venue sheet (.csv)</button>
          <button type="button" className={`${btn} bg-black text-white`} onClick={() => window.print()}>Print the brief</button>
        </div>
      </div>
      <p className="mt-2 max-w-3xl font-semibold">Every step from the first email to a return drive, built for your {plan.input.goalDonors}-donor goal. First-time donors are the hardest to win back, so the calendar already has the return drive.</p>
      <ol className="mt-4 grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr))]">
        {tasks.map((t, i) => (
          <li key={i} className={`border-[3px] border-black p-3 ${TONE[t.kind]}`}>
            <div className="text-sm font-bold">{dateLabel(t.date)}{t.date.slice(0, 4) !== plan.input.startDate.slice(0, 4) ? `, ${t.date.slice(0, 4)}` : ""}</div>
            <div className="font-display text-lg leading-tight">{t.title}</div>
            <p className="mt-1 text-sm">{t.detail}</p>
            {t.location && <p className="mt-1 text-sm font-bold">{t.location}</p>}
          </li>
        ))}
      </ol>
    </section>
  );
}
