import { wrapLanguageModel } from "ai";

type Model = ReturnType<typeof wrapLanguageModel>;

/**
 * Tries each model in turn: free-tier Gemini models go "high demand" (503) or stall for a minute at a time.
 * Each attempt gets its own timeout; the last model that answered is tried first next time, and a model that
 * answers 429 (free-tier quota) rests for quotaRestMs. If the whole
 * chain fails, it pauses briefly and runs once more. Throws a plain Error at the end so the AI SDK doesn't
 * retry the whole chain; the caller's abortSignal (agent deadline) stops it at any point.
 */
export function withFallback(models: Model[], opts: { attemptTimeoutMs?: number; rounds?: number; pauseMs?: number; quotaRestMs?: number } = {}): Model {
  const { attemptTimeoutMs = 15_000, rounds = 2, pauseMs = 1_500, quotaRestMs = 600_000 } = opts;
  let preferred = 0;
  const restingUntil = new Map<number, number>(); // model index → time a 429 (quota) rest ends
  return wrapLanguageModel({
    model: models[0],
    middleware: {
      wrapGenerate: async ({ params }) => {
        let last: unknown;
        for (let round = 0; round < rounds; round++) {
          if (round > 0) await new Promise((r) => setTimeout(r, pauseMs));
          for (let k = 0; k < models.length; k++) {
            const i = (preferred + k) % models.length;
            if ((restingUntil.get(i) ?? 0) > Date.now()) continue;
            if (params.abortSignal?.aborted) throw params.abortSignal.reason;
            const attempt = AbortSignal.timeout(attemptTimeoutMs);
            const signal = params.abortSignal ? AbortSignal.any([params.abortSignal, attempt]) : attempt;
            try {
              const r = await models[i].doGenerate({ ...params, abortSignal: signal });
              preferred = i;
              return r;
            } catch (e) {
              if (params.abortSignal?.aborted) throw e;
              last = e;
              if ((e as { statusCode?: number }).statusCode === 429) restingUntil.set(i, Date.now() + quotaRestMs);
            }
          }
        }
        throw new Error("No AI model is available right now", { cause: last });
      },
    },
  });
}
