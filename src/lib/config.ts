import { z } from "zod";

const Env = z.object({
  QLOO_API_KEY: z.string().optional(),
  QLOO_BASE_URL: z.string().url().default("https://hackathon.api.qloo.com"),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-3.5-flash-lite"),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
});

export type Config = {
  qlooApiKey: string; qlooBaseUrl: string; geminiApiKey?: string; geminiModel: string;
  upstashUrl?: string; upstashToken?: string;
};

let cached: Config | null = null;

const blankToUndef = (v?: string) => (v && v.trim() ? v : undefined);

export function getConfig(): Config {
  if (cached) return cached;
  const e = Env.parse({ ...process.env, QLOO_BASE_URL: blankToUndef(process.env.QLOO_BASE_URL), GEMINI_MODEL: blankToUndef(process.env.GEMINI_MODEL) });
  const key = blankToUndef(e.QLOO_API_KEY);
  if (!key) throw new Error("Missing QLOO_API_KEY");
  cached = {
    qlooApiKey: key, qlooBaseUrl: e.QLOO_BASE_URL, geminiApiKey: blankToUndef(e.GOOGLE_GENERATIVE_AI_API_KEY),
    geminiModel: e.GEMINI_MODEL, upstashUrl: blankToUndef(e.UPSTASH_REDIS_REST_URL), upstashToken: blankToUndef(e.UPSTASH_REDIS_REST_TOKEN),
  };
  return cached;
}

export function resetConfigForTests() { cached = null; }
