import { z } from "zod";

const Env = z.object({
  QLOO_API_KEY: z.string().optional(),
  QLOO_BASE_URL: z.string().url().default("https://hackathon.api.qloo.com"),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-3.1-flash-lite"),
  GEMINI_FALLBACK_MODELS: z.string().default("gemini-3.5-flash-lite,gemini-3.5-flash,gemini-3-flash-preview"),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  QLOO_CACHE_DIR: z.string().optional(),
  QLOO_DAILY_BUDGET: z.coerce.number().int().positive().default(400),
});

export type Config = {
  qlooApiKey: string; qlooBaseUrl: string; geminiApiKey?: string; geminiModel: string; geminiFallbackModels: string[];
  upstashUrl?: string; upstashToken?: string; qlooCacheDir?: string; qlooDailyBudget: number;
};

let cached: Config | null = null;

const blankToUndef = (v?: string) => (v && v.trim() ? v : undefined);

export function getConfig(): Config {
  if (cached) return cached;
  const e = Env.parse({ ...process.env, QLOO_BASE_URL: blankToUndef(process.env.QLOO_BASE_URL), GEMINI_MODEL: blankToUndef(process.env.GEMINI_MODEL), GEMINI_FALLBACK_MODELS: blankToUndef(process.env.GEMINI_FALLBACK_MODELS), QLOO_DAILY_BUDGET: blankToUndef(process.env.QLOO_DAILY_BUDGET) });
  const key = blankToUndef(e.QLOO_API_KEY);
  if (!key) throw new Error("Missing QLOO_API_KEY");
  cached = {
    qlooApiKey: key, qlooBaseUrl: e.QLOO_BASE_URL, geminiApiKey: blankToUndef(e.GOOGLE_GENERATIVE_AI_API_KEY),
    geminiModel: e.GEMINI_MODEL, geminiFallbackModels: e.GEMINI_FALLBACK_MODELS.split(",").map((m) => m.trim()).filter(Boolean), upstashUrl: blankToUndef(e.UPSTASH_REDIS_REST_URL), upstashToken: blankToUndef(e.UPSTASH_REDIS_REST_TOKEN),
    qlooCacheDir: blankToUndef(e.QLOO_CACHE_DIR), qlooDailyBudget: e.QLOO_DAILY_BUDGET,
  };
  return cached;
}

export function resetConfigForTests() { cached = null; }
