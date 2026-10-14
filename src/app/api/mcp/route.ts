import { createMcpHandler } from "mcp-handler";
import { getModel } from "@/lib/agent/model";
import { qlooBudgetOk } from "@/lib/budget";
import { createTools } from "@/lib/engine/tools";
import { cityDataStrength, CityArgsSchema, planBloodDrive, PlanArgsSchema, scoreFandoms, ScoreArgsSchema, type McpResult } from "@/lib/mcp/tools";
import { getQlooApi } from "@/lib/qloo";
import { limitByIp } from "@/lib/ratelimit";
import { savePlan } from "@/lib/store/plans";

export const maxDuration = 300;

const BUDGET_USED = "Today's live-planning budget is used up. Try again tomorrow, or watch an example at https://fandrive-nu.vercel.app.";
const readOnly = { readOnlyHint: true, openWorldHint: true } as const;
const reply = (r: McpResult) => ({ content: [{ type: "text" as const, text: r.text }], isError: r.isError });
const makeTools = (on: Parameters<typeof createTools>[1]) => createTools(getQlooApi(), on);

/** One server per request, so each tool call knows which network it is rate-limiting. */
const handlerFor = (ip: string, origin: string) => createMcpHandler((server) => {
  server.registerTool("plan_blood_drive", {
    title: "Plan a blood drive",
    description: "Plan a youth blood drive for a city: the fandoms whose fans skew young there (scored with Qloo taste data), the neighbourhoods where those fans live, venues that can host, a poster, and a link to the full report. Takes 30–90 seconds.",
    inputSchema: PlanArgsSchema, annotations: readOnly,
  }, async (args) => reply(await planBloodDrive(args, {
    makeTools, model: getModel(), baseUrl: origin, save: savePlan,
    allowPlan: async () => !(await limitByIp(ip, "plan")) ? "Too many plans from your network. Wait a few minutes." : !(await qlooBudgetOk()) ? BUDGET_USED : null,
  })));

  server.registerTool("score_fandoms", {
    title: "Score fandoms for young donors",
    description: "Rank up to 12 artists, teams, shows, games or creators by how young their fans are, how much young people in the city love them and how concentrated their fans are (Qloo taste data). Older-skewing fan bases always rank last.",
    inputSchema: ScoreArgsSchema, annotations: readOnly,
  }, async (args) => reply(await qlooBudgetOk() ? await scoreFandoms(args, { makeTools }) : { text: BUDGET_USED, isError: true }));

  server.registerTool("city_strength", {
    title: "Check city data strength",
    description: "Check whether Qloo has enough taste data for a city to rank fandoms there (strong, medium or thin).",
    inputSchema: CityArgsSchema, annotations: readOnly,
  }, async (args) => reply(await qlooBudgetOk() ? await cityDataStrength(args, { makeTools }) : { text: BUDGET_USED, isError: true }));
}, { serverInfo: { name: "fandrive", version: "1.0.0" } });

async function handle(req: Request): Promise<Response> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const raw = req.method === "POST" ? await req.text() : null;
  if (raw !== null && raw.length > 8000) return Response.json({ error: "Request too large" }, { status: 413 });
  if (!(await limitByIp(ip, "mcp", 60))) {
    return Response.json({ jsonrpc: "2.0", id: null, error: { code: -32000, message: "Too many requests from your network. Wait a few minutes." } }, { status: 429 });
  }
  const forwarded = raw === null ? req : new Request(req.url, { method: req.method, headers: req.headers, body: raw });
  return handlerFor(ip, new URL(req.url).origin)(forwarded);
}

export { handle as GET, handle as POST, handle as DELETE };
