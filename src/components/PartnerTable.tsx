import type { Excluded, Partner } from "@/lib/engine/tools";
import type { AgentPicks } from "@/lib/plan/schema";
import { signed, youthBarPct } from "@/lib/client/view";

const BAR = ["bg-sun", "bg-bubble"];

export function PartnerTable({ partners, excluded, picks }: { partners: Partner[]; excluded: Excluded[]; picks?: AgentPicks }) {
  const picked = new Set(picks?.ids ?? []);
  return (
    <section aria-labelledby="ranking-h" className="brut bg-white p-6">
      <h3 id="ranking-h" className="mb-1 font-display text-3xl">Every fandom we tested</h3>
      <p className="mb-4 font-semibold">Bars: how far each fan base skews under 25 (Qloo). Pull blends youth, local love and fan density.</p>
      <ol className="flex flex-col gap-3">
        {partners.slice(0, 12).map((p, i) => (
          <li key={p.entityId} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t-[3px] border-black pt-3">
            <span className="w-7 font-display text-xl">{i + 1}</span>
            <div className="min-w-0 flex-[1_1_180px]">
              <div className="font-bold">{p.name}{picked.has(p.entityId) && <span className="ml-2 inline-block -rotate-2 border-2 border-black bg-alarm px-1.5 text-xs font-bold">AI PICK</span>}</div>
              <div className="text-sm">{p.type.replace("_", " ")} · local love {p.localLove === null ? "below threshold" : p.localLove.toFixed(2)} · {p.confidence} confidence</div>
            </div>
            <div className="h-6 flex-[2_1_200px] border-[3px] border-black bg-white" role="img" aria-label={`Youth skew ${signed(p.youthSkew)}`}>
              <div className={`h-full ${BAR[i] ?? "bg-sky"}`} style={{ width: `${youthBarPct(p.youthSkew)}%` }} />
            </div>
            <span className="w-16 text-right font-bold">{signed(p.youthSkew)}</span>
            <span className="w-20 text-right text-sm font-semibold">pull {p.pull.toFixed(2)}</span>
            <details className="w-full text-sm"><summary className="cursor-pointer font-semibold">Qloo evidence</summary>
              <ul className="mt-1 flex flex-col gap-1">{p.evidence.map((e) => <li key={e.label}><b>{e.label}:</b> {e.value} <span className="text-neutral-700">({e.source})</span></li>)}</ul>
            </details>
          </li>
        ))}
      </ol>
      {excluded.length > 0 && (
        <details className="mt-4 text-sm"><summary className="cursor-pointer font-semibold">{excluded.length} {excluded.length === 1 ? "name" : "names"} skipped</summary>
          <ul className="mt-1 list-disc pl-5">{excluded.map((e, i) => <li key={i}>{e.query}: {e.reason}</li>)}</ul>
        </details>
      )}
    </section>
  );
}
