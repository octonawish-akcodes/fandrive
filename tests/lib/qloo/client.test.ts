import { describe, expect, it, vi } from "vitest";
import { MemoryCache } from "@/lib/qloo/cache";
import { createQlooClient, QlooError } from "@/lib/qloo/client";

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
const status = (s: number) => new Response("{}", { status: s });
const make = (fetchImpl: typeof fetch, extra: object = {}) =>
  createQlooClient({ baseUrl: "https://q.test", apiKey: "secret", cache: new MemoryCache(), fetchImpl, retryDelayMs: 0, rateLimitDelayMs: 0, ...extra });

describe("createQlooClient", () => {
  it("sends the key header, sorts params, drops undefined, clamps take", async () => {
    const f = vi.fn(async () => ok({ results: [] }));
    await make(f as unknown as typeof fetch).get("/search", { types: "urn:entity:artist", query: "Bad Bunny", take: 500, x: undefined });
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://q.test/search?query=Bad+Bunny&take=50&types=urn%3Aentity%3Aartist");
    expect((init.headers as Record<string, string>)["X-Api-Key"]).toBe("secret");
  });
  it("caches successful responses", async () => {
    const f = vi.fn(async () => ok({ results: [1] }));
    const c = make(f as unknown as typeof fetch);
    await c.get("/v2/insights", { a: 1 });
    expect(await c.get("/v2/insights", { a: 1 })).toEqual({ results: [1] });
    expect(f).toHaveBeenCalledTimes(1);
  });
  it("retries once on 5xx", async () => {
    const f = vi.fn().mockResolvedValueOnce(status(503)).mockResolvedValueOnce(ok({ fine: true }));
    expect(await make(f as unknown as typeof fetch).get("/p", {})).toEqual({ fine: true });
    expect(f).toHaveBeenCalledTimes(2);
  });
  it("does not retry 400 and throws bad_request", async () => {
    const f = vi.fn(async () => status(400));
    await expect(make(f as unknown as typeof fetch).get("/p", {})).rejects.toMatchObject({ kind: "bad_request", status: 400 });
    expect(f).toHaveBeenCalledTimes(1);
  });
  it("maps 401/403 to auth and 429 to rate_limited", async () => {
    await expect(make((async () => status(401)) as unknown as typeof fetch).get("/p", {})).rejects.toMatchObject({ kind: "auth" });
    await expect(make((async () => status(429)) as unknown as typeof fetch).get("/p", {})).rejects.toMatchObject({ kind: "rate_limited" });
  });
  it("times out, retries once, then throws timeout", async () => {
    const f = vi.fn((_u: string, init: RequestInit) => new Promise<Response>((_, rej) =>
      init.signal?.addEventListener("abort", () => rej(Object.assign(new Error("aborted"), { name: "AbortError" })))));
    const err = (await make(f as unknown as typeof fetch, { timeoutMs: 5 }).get("/p", {}).catch((e) => e)) as QlooError;
    expect(err).toBeInstanceOf(QlooError);
    expect(err.kind).toBe("timeout");
    expect(f).toHaveBeenCalledTimes(2);
  });
  it("on 429 pauses the shared gate and retries up to twice", async () => {
    const gate = Object.assign(vi.fn(async () => {}), { pause: vi.fn() });
    const f = vi.fn().mockResolvedValueOnce(status(429)).mockResolvedValueOnce(status(429)).mockResolvedValueOnce(ok({ fine: true }));
    expect(await make(f as unknown as typeof fetch, { rateGate: gate }).get("/p", {})).toEqual({ fine: true });
    expect(f).toHaveBeenCalledTimes(3);
    expect(gate.pause).toHaveBeenCalledTimes(2);
  });
  it("passes every attempt, including retries, through the rate gate", async () => {
    const gate = Object.assign(vi.fn(async () => {}), { pause: vi.fn() });
    const f = vi.fn().mockResolvedValueOnce(status(503)).mockResolvedValueOnce(ok({ fine: true }));
    await make(f as unknown as typeof fetch, { rateGate: gate }).get("/p", {});
    expect(gate).toHaveBeenCalledTimes(2);
  });
  it("treats a broken cache as a miss instead of failing the request", async () => {
    const broken = { get: async () => { throw new Error("redis down"); }, set: async () => { throw new Error("value too large"); } };
    const f = vi.fn(async () => ok({ fine: true }));
    expect(await make(f as unknown as typeof fetch, { cache: broken }).get("/p", {})).toEqual({ fine: true });
  });
  it("never includes the api key in error messages", async () => {
    const err = (await make((async () => status(500)) as unknown as typeof fetch).get("/p", {}).catch((e) => e)) as QlooError;
    expect(String(err.message)).not.toContain("secret");
  });
});
