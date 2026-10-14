import { afterEach, expect, it, vi } from "vitest";
import { resetConfigForTests } from "@/lib/config";

afterEach(() => { vi.unstubAllEnvs(); resetConfigForTests(); vi.resetModules(); });

const V = "2025-11-25";
async function rpc(POST: (r: Request) => Promise<Response>, method: string, params: object, ip = "203.0.113.7") {
  const res = await POST(new Request("http://localhost/api/mcp", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "mcp-protocol-version": V, "x-forwarded-for": ip },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  }));
  const raw = await res.text();
  const json = raw.trimStart().startsWith("{") ? raw : raw.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5)).at(-1) ?? "{}";
  return { status: res.status, body: JSON.parse(json) };
}

it("lists the three FanDrive tools over MCP, read-only", async () => {
  vi.stubEnv("QLOO_API_KEY", "test-key"); vi.stubEnv("UPSTASH_REDIS_REST_URL", ""); vi.stubEnv("KV_REST_API_URL", "");
  const { POST } = await import("@/app/api/mcp/route");
  const init = await rpc(POST, "initialize", { protocolVersion: V, capabilities: {}, clientInfo: { name: "test", version: "1" } });
  expect(init.status).toBe(200);
  expect(init.body.result.serverInfo.name).toBe("fandrive");
  const list = await rpc(POST, "tools/list", {});
  const tools = list.body.result.tools as { name: string; annotations?: { readOnlyHint?: boolean } }[];
  expect(tools.map((t) => t.name).sort()).toEqual(["city_strength", "plan_blood_drive", "score_fandoms"]);
  expect(tools.every((t) => t.annotations?.readOnlyHint)).toBe(true);
});

it("rate-limits each network before any work is done", async () => {
  vi.stubEnv("QLOO_API_KEY", "test-key"); vi.stubEnv("UPSTASH_REDIS_REST_URL", ""); vi.stubEnv("KV_REST_API_URL", "");
  const { POST } = await import("@/app/api/mcp/route");
  let last = 0;
  for (let i = 0; i < 61; i++) last = (await rpc(POST, "tools/list", {}, "198.51.100.9")).status;
  expect(last).toBe(429);
});

it("rejects oversized requests", async () => {
  const { POST } = await import("@/app/api/mcp/route");
  const res = await POST(new Request("http://localhost/api/mcp", { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": "192.0.2.1" }, body: "x".repeat(20_000) }));
  expect(res.status).toBe(413);
});
