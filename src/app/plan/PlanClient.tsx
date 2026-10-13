"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useReducer, useState } from "react";
import { PlanForm, type PlanFormValues } from "@/components/PlanForm";
import { ReportView } from "@/components/ReportView";
import { StepLog } from "@/components/StepLog";
import { readNdjson } from "@/lib/client/ndjson";
import { replay, type Recording } from "@/lib/client/replay";
import { applyEvent, fromPlan, initialRun, type RunState } from "@/lib/client/runState";

export function PlanClient() {
  const params = useSearchParams();
  const id = params.get("id");
  const example = params.get("example");
  const [state, dispatch] = useReducer(applyEvent, initialRun);
  const [loaded, setLoaded] = useState<RunState | null>(null);
  const [recordedAt, setRecordedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/plan/${encodeURIComponent(id)}`).then((r) => (r.ok ? r.json() : null)).then((p) => p && setLoaded(fromPlan(p))).catch(() => undefined);
  }, [id]);

  useEffect(() => {
    if (!example || !/^[a-z]{2,20}$/.test(example)) return;
    fetch(`/examples/${example}.json`).then((r) => (r.ok ? r.json() : null)).then((rec: Recording | null) => {
      if (!rec) return;
      setRecordedAt(rec.recordedAt);
      dispatch({ type: "reset" });
      replay(rec.events, dispatch);
    }).catch(() => undefined);
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
    for await (const e of readNdjson(res.body)) {
      dispatch(e);
      if (e.type === "done") window.history.replaceState(null, "", `/plan?id=${e.plan.id}`);
    }
  }

  const view = loaded ?? state;
  return (
    <main className="mx-auto w-full max-w-7xl p-4">
      <h1 className="mb-4 text-2xl font-bold">Plan young-donor drives</h1>
      <PlanForm onSubmit={start} disabled={state.status === "running"} />
      {recordedAt && <p className="mt-4 rounded bg-amber-50 p-2 text-sm text-amber-900">Recorded run from {recordedAt}, replayed. Use the form above to run it live.</p>}
      {view.status !== "idle" && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="h-fit min-w-0 lg:sticky lg:top-4"><StepLog steps={view.steps} running={view.status === "running"} /></aside>
          <div className="min-w-0"><ReportView state={view} /></div>
        </div>
      )}
    </main>
  );
}
