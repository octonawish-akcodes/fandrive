import { getConfig } from "@/lib/config";

/** What powers this deployment, for the header badges. Never includes keys. */
export async function GET() {
  try {
    const c = getConfig();
    return Response.json({ qloo: "live", ai: c.geminiApiKey ? c.geminiModel : null, fallbacks: c.geminiFallbackModels.length, sharedCache: !!(c.upstashUrl && c.upstashToken) });
  } catch {
    return Response.json({ qloo: "missing", ai: null, fallbacks: 0, sharedCache: false });
  }
}
