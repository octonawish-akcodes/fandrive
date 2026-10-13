import type { RunEvent } from "@/lib/plan/schema";

export type Recording = { slug: string; city: string; recordedAt: string; events: RunEvent[] };

export function replay(events: RunEvent[], onEvent: (e: RunEvent) => void, opts: { maxMs?: number; schedule?: (fn: () => void, ms: number) => void } = {}) {
  const maxMs = opts.maxMs ?? 8000;
  const schedule = opts.schedule ?? ((fn, ms) => setTimeout(fn, ms));
  const lastAt = Math.max(1, ...events.map((e) => (e.type === "step" ? e.step.at : 0)));
  let t = 0;
  events.forEach((e, i) => {
    if (e.type === "step") t = (e.step.at / lastAt) * (maxMs - 500);
    schedule(() => onEvent(e), Math.min(maxMs, Math.round(t + i * 10)));
  });
}
