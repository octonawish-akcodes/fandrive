export type Clock = { now(): number; sleep(ms: number): Promise<void> };
export type RateGate = { (): Promise<void>; pause(ms: number): void };
const realClock: Clock = { now: () => Date.now(), sleep: (ms) => new Promise((r) => setTimeout(r, ms)) };

/** Sliding-window gate: at most `max` starts in any `windowMs`, served in order. `pause` holds everyone (used after a 429). */
export function createRateGate(max: number, windowMs: number, clock: Clock = realClock): RateGate {
  const starts: number[] = [];
  let pausedUntil = 0;
  let chain: Promise<void> = Promise.resolve();
  const gate = () => {
    const turn = chain.then(async () => {
      for (;;) {
        const t = clock.now();
        if (t < pausedUntil) { await clock.sleep(pausedUntil - t); continue; }
        while (starts.length && starts[0] <= t - windowMs) starts.shift();
        if (starts.length < max) { starts.push(t); return; }
        await clock.sleep(starts[0] + windowMs - t);
      }
    });
    chain = turn.catch(() => {});
    return turn;
  };
  return Object.assign(gate, { pause(ms: number) { pausedUntil = Math.max(pausedUntil, clock.now() + ms); } });
}
