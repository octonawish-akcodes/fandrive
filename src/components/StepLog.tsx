import type { Step } from "@/lib/plan/schema";

export function StepLog({ steps, running }: { steps: Step[]; running: boolean }) {
  return (
    <section aria-label="Agent steps" className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">What the agent is doing</h2>
      <ol className="space-y-2 text-sm">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-2">
            <span aria-hidden>{i === steps.length - 1 && running ? "⟳" : "✓"}</span>
            <span>{s.message}<span className="ml-2 text-xs text-zinc-400">{(s.at / 1000).toFixed(1)}s</span></span>
          </li>
        ))}
        {running && steps.length === 0 && <li className="text-zinc-400">Starting…</li>}
      </ol>
    </section>
  );
}
