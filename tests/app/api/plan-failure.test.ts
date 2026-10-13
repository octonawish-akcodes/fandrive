import { expect, it, vi } from "vitest";

vi.mock("@/lib/qloo", () => ({ getQlooApi: () => { throw new Error("Missing QLOO_API_KEY"); } }));
vi.mock("@/lib/agent/model", () => ({ getModel: () => { throw new Error("Missing QLOO_API_KEY"); } }));
vi.mock("@/lib/store/plans", () => ({ savePlan: async () => undefined, getPlan: async () => null }));
vi.mock("@/lib/ratelimit", () => ({ limitByIp: vi.fn(async () => true) }));

const { POST } = await import("@/app/api/plan/route");

it("streams an error event (without details) when the server is misconfigured", async () => {
  const res = await POST(new Request("http://x/api/plan", { method: "POST", body: JSON.stringify({ city: "Houston", startDate: "2026-11-14", endDate: "2026-11-30" }) }));
  const text = await res.text();
  const last = JSON.parse(text.trim().split("\n").at(-1)!);
  expect(last).toMatchObject({ type: "error", code: "internal" });
  expect(text).not.toContain("QLOO_API_KEY");
});
