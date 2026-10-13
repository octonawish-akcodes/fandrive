import type { Excluded, Partner } from "@/lib/engine/tools";
import type { AgentPicks } from "@/lib/plan/schema";

const pill: Record<Partner["confidence"], string> = { high: "bg-emerald-100 text-emerald-800", medium: "bg-amber-100 text-amber-800", low: "bg-zinc-200 text-zinc-700" };

export function PartnerTable({ partners, excluded, picks }: { partners: Partner[]; excluded: Excluded[]; picks?: AgentPicks }) {
  const picked = new Set(picks?.ids ?? []);
  return (
    <div>
      {picks && picked.size > 0 && (
        <p className="mb-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-950 dark:bg-rose-950/40 dark:text-rose-100">
          <b>AI planner&rsquo;s picks</b> are listed first{picks.rationale ? <>: {picks.rationale}</> : "."}
        </p>
      )}
      <div className="-mx-1 overflow-x-auto px-1"><table className="w-full min-w-[560px] text-sm">
        <thead className="text-left text-xs uppercase text-zinc-500">
          <tr><th className="py-2">#</th><th>Partner</th><th>Young-Donor Pull</th><th>Fans skew young</th><th>Local love</th><th>Confidence</th></tr>
        </thead>
        <tbody>
          {partners.slice(0, 10).map((p, i) => (
            <tr key={p.entityId} className="border-t border-zinc-200 align-top dark:border-zinc-800">
              <td className="py-2">{i + 1}</td>
              <td>
                <div className="font-medium">{p.name}{picked.has(p.entityId) && <span className="ml-2 rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">AI pick</span>}</div>
                <div className="text-xs text-zinc-500">{p.type.replace("_", " ")}</div>
                <details className="mt-1 text-xs"><summary className="cursor-pointer text-zinc-500">Qloo evidence</summary>
                  <ul className="mt-1 space-y-1">{p.evidence.map((e) => <li key={e.label}><b>{e.label}:</b> {e.value}<div className="text-zinc-400">{e.source}</div></li>)}</ul>
                </details>
              </td>
              <td><div className="h-2 w-28 rounded bg-zinc-200 dark:bg-zinc-800"><div className="h-2 rounded bg-rose-600" style={{ width: `${Math.round(p.pull * 100)}%` }} /></div><span className="text-xs">{p.pull.toFixed(2)}</span></td>
              <td>{p.youthSkew >= 0 ? "+" : ""}{p.youthSkew.toFixed(2)}</td>
              <td>{p.localLove === null ? <span className="text-zinc-400">below threshold</span> : p.localLove.toFixed(2)}</td>
              <td><span className={`rounded px-2 py-0.5 text-xs ${pill[p.confidence]}`}>{p.confidence}</span></td>
            </tr>
          ))}
        </tbody>
      </table></div>
      {excluded.length > 0 && (
        <details className="mt-3 text-xs text-zinc-500"><summary className="cursor-pointer">{excluded.length} names skipped</summary>
          <ul className="mt-1 list-disc pl-5">{excluded.map((e, i) => <li key={i}>{e.query}: {e.reason}</li>)}</ul>
        </details>
      )}
    </div>
  );
}
