import type { Excluded, Partner } from "@/lib/engine/tools";

const pill: Record<Partner["confidence"], string> = { high: "bg-emerald-100 text-emerald-800", medium: "bg-amber-100 text-amber-800", low: "bg-zinc-200 text-zinc-700" };

export function PartnerTable({ partners, excluded }: { partners: Partner[]; excluded: Excluded[] }) {
  return (
    <div>
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase text-zinc-500">
          <tr><th className="py-2">#</th><th>Partner</th><th>Young-Donor Pull</th><th>Fans skew young</th><th>Local love</th><th>Confidence</th></tr>
        </thead>
        <tbody>
          {partners.slice(0, 10).map((p, i) => (
            <tr key={p.entityId} className="border-t border-zinc-200 align-top dark:border-zinc-800">
              <td className="py-2">{i + 1}</td>
              <td>
                <div className="font-medium">{p.name}</div>
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
      </table>
      {excluded.length > 0 && (
        <details className="mt-3 text-xs text-zinc-500"><summary className="cursor-pointer">{excluded.length} names skipped</summary>
          <ul className="mt-1 list-disc pl-5">{excluded.map((e, i) => <li key={i}>{e.query}: {e.reason}</li>)}</ul>
        </details>
      )}
    </div>
  );
}
