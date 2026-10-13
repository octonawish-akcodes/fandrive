import { getPlan } from "@/lib/store/plans";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const plan = await getPlan((await params).id);
  return plan ? Response.json(plan) : Response.json({ error: "Plan not found" }, { status: 404 });
}
