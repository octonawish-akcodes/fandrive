import type { Excluded, Partner } from "@/lib/engine/tools";
import type { AgentPicks, CityInfo, Creative, ErrorCode, MapResult, PlainAiCheck, Plan, RunEvent, Step } from "@/lib/plan/schema";

export type RunState = {
  status: "idle" | "running" | "done" | "error"; steps: Step[]; city?: CityInfo; partners?: Partner[]; excluded?: Excluded[];
  maps?: MapResult[]; creative?: Creative; plainAi?: PlainAiCheck[] | null; plan?: Plan; error?: { code: ErrorCode; message: string };
  picks?: AgentPicks;
};
export const initialRun: RunState = { status: "idle", steps: [] };

export function fromPlan(p: Plan): RunState {
  return { status: "done", steps: p.steps, city: p.city, partners: p.partners, excluded: p.excluded, maps: p.maps, creative: p.creative, plainAi: p.plainAi, plan: p, picks: p.agentPicks ?? undefined };
}

export function applyEvent(s: RunState, a: RunEvent | { type: "reset" }): RunState {
  switch (a.type) {
    case "reset": return { status: "running", steps: [] };
    case "step": return { ...s, status: "running", steps: [...s.steps, a.step] };
    case "city": return { ...s, city: a.city };
    case "partners": return { ...s, partners: a.partners, excluded: a.excluded, picks: a.picks ?? s.picks };
    case "maps": return { ...s, maps: a.maps };
    case "creative": return { ...s, creative: a.creative };
    case "plainAi": return { ...s, plainAi: a.plainAi };
    case "done": return fromPlan(a.plan);
    case "error": return { ...s, status: "error", error: { code: a.code, message: a.message } };
  }
}
