import { expect, it } from "vitest";
import { replay } from "@/lib/client/replay";
import type { RunEvent } from "@/lib/plan/schema";

it("replays all events in order and squeezes timing", () => {
  const ev: RunEvent[] = [
    { type: "step", step: { at: 0, tool: "a", message: "1" } }, { type: "step", step: { at: 60_000, tool: "b", message: "2" } },
    { type: "plainAi", plainAi: null },
  ];
  const delays: number[] = [];
  const seen: string[] = [];
  replay(ev, (e) => seen.push(e.type), { maxMs: 8000, schedule: (fn, ms) => { delays.push(ms); fn(); } });
  expect(seen).toEqual(["step", "step", "plainAi"]);
  expect(Math.max(...delays)).toBeLessThanOrEqual(8000);
});
