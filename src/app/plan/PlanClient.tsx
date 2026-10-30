"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useReducer, useState } from "react";
import { PlanForm, type PlanFormValues } from "@/components/PlanForm";
import { ReportView } from "@/components/ReportView";
import { SiteHeader } from "@/components/SiteHeader";
import { consumePlanStream } from "@/lib/client/consume";
import { loadRecording, loadSavedPlan } from "@/lib/client/load";
import { replay } from "@/lib/client/replay";
import { applyEvent, fromPlan, initialRun, type RunState } from "@/lib/client/runState";
import { headlineParts, signed, topTwo } from "@/lib/client/view";

export function PlanClient() {
  const params = useSearchParams();
  const id = params.get("id");
  const example = params.get("example");
  const [state, dispatch] = useReducer(applyEvent, initialRun);
  const [loaded, setLoaded] = useState<RunState | null>(null);
  const [recordedAt, setRecordedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    loadSavedPlan(id).then((p) => {
      if ("error" in p) { dispatch({ type: "reset" }); dispatch({ type: "error", code: "bad_input", message: p.error }); }
      else setLoaded(fromPlan(p));
    });
  }, [id]);

  useEffect(() => {
    if (!example || !/^[a-z]{2,20}$/.test(example)) return;
    loadRecording(example).then((rec) => {
      dispatch({ type: "reset" });
      if ("error" in rec) { dispatch({ type: "error", code: "bad_input", message: rec.error }); return; }
      setRecordedAt(rec.recordedAt);
      replay(rec.events, dispatch);
    });
  }, [example]);

  async function start(v: PlanFormValues) {
    setLoaded(null);
    setRecordedAt(null);
    dispatch({ type: "reset" });
    const res = await fetch("/api/plan", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(v) }).catch(() => null);
    if (!res || !res.ok || !res.body) {
      const j = res ? await res.json().catch(() => ({})) : {};
      dispatch({ type: "error", code: res?.status === 429 ? "rate_limited" : "bad_input", message: j.error ?? "Request failed. Check your connection and try again." });
      return;
    }
    const plan = await consumePlanStream(res.body, dispatch);
    if (plan) window.history.replaceState(null, "", `/plan?id=${plan.id}`);
  }

  const view = loaded ?? state;
  const [top] = topTwo(view.partners ?? [], view.picks);
  const h = headlineParts(view.city?.name, top);
  const lead = view.status === "idle" ? "Type your city. FanDrive’s AI agent tests a dozen fandoms against Qloo taste data and builds your plan live, in about a minute."
    : view.status === "running" && !top ? "The agent is testing fandoms against Qloo taste data. Watch it work below."
    : top ? `${top.name} leads: fans skew ${signed(top.youthSkew)} toward under-25s${top.localLove !== null ? `, with local love ${top.localLove.toFixed(2)}` : ""}. Their fans live near halls that can host.`
    : "Something went wrong. Check the message below and try again.";
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-8 sm:px-6">
        <section className="flex flex-wrap items-stretch gap-8">
          <div className="flex min-w-0 flex-[999_1_560px] flex-col justify-center gap-5">
            <div className="flex flex-wrap gap-3 font-bold">
              {view.city && <span className="-rotate-3 border-[3px] border-black bg-sun px-3 py-1">{view.city.name}</span>}
              {view.plan && <span className="rotate-2 border-[3px] border-black bg-bubble px-3 py-1">Ages {view.plan.input.band.replace("-", "–")}</span>}
              {view.plan && <span className="-rotate-1 border-[3px] border-black bg-sky px-3 py-1">{view.plan.engine === "agent" ? "Planned by AI" : view.plan.engine === "autopilot" ? "Autopilot" : "Recorded"}</span>}
            </div>
            <h1 className="font-display text-5xl leading-[0.95] sm:text-7xl">
              {h.before} <span className="inline-block -rotate-2 border-[3px] border-black bg-alarm px-3 shadow-[6px_6px_0_#000]">{h.sticker}</span> {h.after}
            </h1>
            <p className="max-w-2xl text-xl">{lead}</p>
          </div>
          <div className="min-w-0 flex-[1_1_340px] print:hidden"><PlanForm onSubmit={start} disabled={state.status === "running"} /></div>
        </section>
        {recordedAt && <p className="print:hidden brut-sm bg-bubble p-3 font-bold">Recorded run from {recordedAt}, replayed. Use the form to run it live.</p>}
        {view.status !== "idle" && <ReportView state={view} />}
      </main>
    </>
  );
}
