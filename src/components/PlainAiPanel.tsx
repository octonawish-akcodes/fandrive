import type { PlainAiCheck } from "@/lib/plan/schema";

export function PlainAiPanel({ checks }: { checks: PlainAiCheck[] | null }) {
  if (!checks) return <p className="text-sm text-zinc-500">Plain-AI comparison unavailable for this run.</p>;
  return (
    <table className="w-full text-sm">
      <thead className="text-left text-xs uppercase text-zinc-500"><tr><th className="py-2">Plain AI suggested</th><th>Its reason</th><th>Qloo check</th></tr></thead>
      <tbody>{checks.map((c, i) => (
        <tr key={i} className="border-t border-zinc-200 dark:border-zinc-800"><td className="py-2 font-medium">{c.name}</td><td>{c.why}</td><td>{c.note}</td></tr>
      ))}</tbody>
    </table>
  );
}
