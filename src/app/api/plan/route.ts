import { getModel } from "@/lib/agent/model";
import { runPlan } from "@/lib/agent/run";
import { createTools } from "@/lib/engine/tools";
import { PlanInputSchema, type RunEvent } from "@/lib/plan/schema";
import { getQlooApi } from "@/lib/qloo";
import { limitByIp } from "@/lib/ratelimit";
import { savePlan } from "@/lib/store/plans";

export const maxDuration = 300;

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const raw = await req.text();
  if (raw.length > 4000) return Response.json({ error: "Request too large" }, { status: 413 });
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = PlanInputSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid input", issues: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) }, { status: 400 });
  if (!(await limitByIp(ip, "plan"))) return Response.json({ error: "Too many plans from your network. Try an example city or wait a few minutes." }, { status: 429 });

  const enc = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (e: RunEvent) => controller.enqueue(enc.encode(`${JSON.stringify(e)}\n`));
      const plan = await runPlan(parsed.data, { makeTools: (on) => createTools(getQlooApi(), on), model: getModel() }, send);
      if (plan) await savePlan(plan).catch(() => undefined);
      controller.close();
    },
  });
  return new Response(stream, { headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" } });
}
