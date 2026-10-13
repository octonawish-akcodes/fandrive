import { describe, expect, it } from "vitest";
import { createRateGate } from "@/lib/qloo/rateGate";

function fakeClock() {
  const c = { t: 0, slept: [] as number[], now: () => c.t, sleep: async (ms: number) => { c.slept.push(ms); c.t += ms; } };
  return c;
}

describe("createRateGate", () => {
  it("lets max requests through per window, then waits for the oldest to expire", async () => {
    const clock = fakeClock();
    const gate = createRateGate(2, 1000, clock);
    await Promise.all([gate(), gate(), gate()]);
    expect(clock.slept).toEqual([1000]);
  });
  it("does not wait when calls are already spread out", async () => {
    const clock = fakeClock();
    const gate = createRateGate(2, 1000, clock);
    await gate(); clock.t = 600; await gate(); clock.t = 1200; await gate();
    expect(clock.slept).toEqual([]);
  });
});
