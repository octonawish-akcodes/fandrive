import type { Partner } from "@/lib/engine/tools";
import type { AgentPicks, PlainAiCheck } from "@/lib/plan/schema";
import { plainAiVerdicts, signed } from "@/lib/client/view";

export function PlainAiPanel({ checks, partners, picks }: { checks: PlainAiCheck[] | null; partners: Partner[]; picks?: AgentPicks | null }) {
  const v = plainAiVerdicts(checks, partners, picks);
  const wrong = v.rows.filter((r) => r.verdict === "not-young").length;
  const headline = wrong && v.missed ? `AI without Qloo got ${wrong} wrong and missed ${v.missed.name}.`
    : v.missed ? `AI without Qloo missed ${v.missed.name}.`
    : wrong ? `AI without Qloo got ${wrong} wrong.` : "AI without Qloo agreed with Qloo this time.";
  return (
    <div className="brut flex flex-col gap-3 bg-white p-6">
      <div className="font-bold">Plain AI check</div>
      {!checks ? <p className="font-semibold">Plain-AI comparison unavailable for this run.</p> : <>
        <p className="font-display text-2xl leading-tight">{headline}</p>
        <ul className="flex flex-col gap-1.5 font-semibold">
          {v.rows.map((r) => (
            <li key={r.name} className="flex justify-between gap-3">
              <span className={r.verdict === "not-young" ? "line-through decoration-alarm decoration-[3px]" : ""}>{r.name}</span>
              <span className="text-right">{r.skew === null ? "no Qloo data" : `${signed(r.skew)}${r.verdict === "not-young" ? " not young" : ""}`}</span>
            </li>
          ))}
        </ul>
        {v.missed && <div className="flex justify-between gap-3 border-[3px] border-black bg-mint px-2 py-1 font-bold"><span>Missed: {v.missed.name}</span><span>{signed(v.missed.youthSkew)}</span></div>}
      </>}
    </div>
  );
}
