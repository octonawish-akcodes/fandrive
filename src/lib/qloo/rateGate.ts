export type Clock = { now(): number; sleep(ms: number): Promise<void> };
const realClock: Clock = { now: () => Date.now(), sleep: (ms) => new Promise((r) => setTimeout(r, ms)) };

/** Sliding-window gate: at most `max` starts in any `windowMs`. Callers are served in order. */
export function createRateGate(max: number, windowMs: number, clock: Clock = realClock): () => Promise<void> {
  const starts: number[] = [];
  let chain: Promise<void> = Promise.resolve();
  return () => {
    const turn = chain.then(async () => {
      for (;;) {
        const t = clock.now();
        while (starts.length && starts[0] <= t - windowMs) starts.shift();
        if (starts.length < max) { starts.push(t); return; }
        await clock.sleep(starts[0] + windowMs - t);
      }
    });
    chain = turn.catch(() => {});
    return turn;
  };
}
