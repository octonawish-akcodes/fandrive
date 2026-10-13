import { wrapLanguageModel } from "ai";

type Model = ReturnType<typeof wrapLanguageModel>;

/**
 * Tries each model in turn: free-tier Gemini models go "high demand" (503) or stall for a minute at a time.
 * Each attempt gets its own timeout; the last model that answered is tried first next time.
 * Throws a plain Error when all fail so the AI SDK doesn't retry the whole chain.
 */
export function withFallback(models: Model[], opts: { attemptTimeoutMs?: number } = {}): Model {
  const timeout = opts.attemptTimeoutMs ?? 25_000;
  let preferred = 0;
  return wrapLanguageModel({
    model: models[0],
    middleware: {
      wrapGenerate: async ({ params }) => {
        let last: unknown;
        for (let k = 0; k < models.length; k++) {
          const i = (preferred + k) % models.length;
          if (params.abortSignal?.aborted) throw params.abortSignal.reason;
          const attempt = AbortSignal.timeout(timeout);
          const signal = params.abortSignal ? AbortSignal.any([params.abortSignal, attempt]) : attempt;
          try {
            const r = await models[i].doGenerate({ ...params, abortSignal: signal });
            preferred = i;
            return r;
          } catch (e) {
            if (params.abortSignal?.aborted) throw e;
            last = e;
          }
        }
        throw new Error("No AI model is available right now", { cause: last });
      },
    },
  });
}
