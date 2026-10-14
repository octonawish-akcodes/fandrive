import { describe, expect, it, vi } from "vitest";
import { MemoryCache } from "@/lib/qloo/cache";
import { createQlooClient } from "@/lib/qloo/client";
import { collectReceipts, toCurl } from "@/lib/qloo/receipts";

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });
const client = () => createQlooClient({ baseUrl: "https://q.test", apiKey: "secret", cache: new MemoryCache(), fetchImpl: vi.fn(async () => ok({ results: [] })) as unknown as typeof fetch, retryDelayMs: 0, rateLimitDelayMs: 0 });

describe("Qloo receipts", () => {
  it("records every request made inside a run, live or cached, without the key", async () => {
    const c = client();
    const { result, receipts } = await collectReceipts(async () => {
      await c.get("/search", { query: "Kai Cenat", take: 5, types: undefined });
      await c.get("/search", { query: "Kai Cenat", take: 5, types: undefined });
      return "done";
    });
    expect(result).toBe("done");
    expect(receipts).toEqual([
      { path: "/search", params: { query: "Kai Cenat", take: "5" }, cached: false },
      { path: "/search", params: { query: "Kai Cenat", take: "5" }, cached: true },
    ]);
    expect(JSON.stringify(receipts)).not.toContain("secret");
  });
  it("records nothing (and does not fail) outside a run", async () => {
    await expect(client().get("/search", { query: "x" })).resolves.toBeDefined();
  });
  it("turns a receipt into a reproducible curl with a key placeholder", () => {
    expect(toCurl({ path: "/v2/insights", params: { "filter.type": "urn:heatmap", "filter.location.query": "Houston, TX" }, cached: false }, "https://hackathon.api.qloo.com"))
      .toBe(`curl -H "X-Api-Key: $QLOO_API_KEY" "https://hackathon.api.qloo.com/v2/insights?filter.location.query=Houston%2C+TX&filter.type=urn%3Aheatmap"`);
  });
});
