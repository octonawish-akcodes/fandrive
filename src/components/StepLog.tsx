import { doneLabel } from "@/lib/client/view";
import type { Step } from "@/lib/plan/schema";

function Tick() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12.5L10 18L20 6" stroke="#000" strokeWidth="4" /></svg>;
}

export function StepLog({ steps, running }: { steps: Step[]; running: boolean }) {
  const done = !running ? doneLabel(steps) : null;
  return (
    <section aria-labelledby="agent-log-h" className="brut flex flex-col gap-3 self-start bg-mint p-6">
      <h3 id="agent-log-h" className="font-bold">{running ? "The agent is working…" : "What the agent did"}</h3>
      <ol aria-live="polite" className="flex flex-col gap-2 font-semibold">
        {steps.map((s, i) => {
          const active = running && i === steps.length - 1;
          return (
            <li key={i} className="flex gap-3">
              <span className="flex h-7 w-7 flex-none items-center justify-center border-[3px] border-black bg-white">
                {active ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-[3px] border-black border-t-transparent" aria-label="in progress" /> : <Tick />}
              </span>
              <span>{s.message} <span className="text-sm font-normal">{(s.at / 1000).toFixed(1)}s</span></span>
            </li>
          );
        })}
        {running && steps.length === 0 && <li>Starting…</li>}
      </ol>
      {done && <p className="mt-auto font-bold">{done}</p>}
    </section>
  );
}
