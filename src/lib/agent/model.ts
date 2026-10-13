import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { LanguageModel } from "ai";
import { getConfig } from "@/lib/config";
import { withFallback } from "./fallbackModel";

let model: LanguageModel | null | undefined;
/** One shared model per server instance, so the fallback chain remembers which Gemini model last answered. */
export function getModel(): LanguageModel | null {
  if (model !== undefined) return model;
  const c = getConfig();
  if (!c.geminiApiKey) return (model = null);
  const google = createGoogleGenerativeAI({ apiKey: c.geminiApiKey });
  return (model = withFallback([...new Set([c.geminiModel, ...c.geminiFallbackModels])].map((id) => google(id))));
}
export function resetModelForTests() { model = undefined; }
