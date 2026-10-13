import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { LanguageModel } from "ai";
import { getConfig } from "@/lib/config";

export function getModel(): LanguageModel | null {
  const c = getConfig();
  return c.geminiApiKey ? createGoogleGenerativeAI({ apiKey: c.geminiApiKey })(c.geminiModel) : null;
}
