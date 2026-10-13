import { createHash } from "node:crypto";
import pLimit from "p-limit";
import type { Cache } from "./cache";
import { createRateGate, type RateGate } from "./rateGate";
import type { Params } from "./types";

export type QlooErrorKind = "bad_request" | "auth" | "rate_limited" | "server" | "timeout" | "network";
export class QlooError extends Error {
  constructor(public kind: QlooErrorKind, public status: number | undefined, message: string) { super(message); this.name = "QlooError"; }
}
export type QlooClient = { get<T = unknown>(path: string, params: Params): Promise<T> };
export type QlooClientOptions = {
  baseUrl: string; apiKey: string; cache: Cache; fetchImpl?: typeof fetch;
  concurrency?: number; timeoutMs?: number; ttlSec?: number; retryDelayMs?: number;
  /** Qloo allows 5 requests/second per key and counts the previous second too; the default gate allows 3. */
  rateGate?: RateGate; rateLimitDelayMs?: number;
};

export function buildUrl(baseUrl: string, path: string, params: Params): string {
  const entries = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => [k, k === "take" ? String(Math.max(1, Math.min(50, Number(v)))) : String(v)] as [string, string])
    .sort(([a], [b]) => a.localeCompare(b));
  const qs = new URLSearchParams(entries).toString();
  return `${baseUrl.replace(/\/$/, "")}${path}${qs ? `?${qs}` : ""}`;
}

const kindFor = (s: number): QlooErrorKind =>
  s === 401 || s === 403 ? "auth" : s === 429 ? "rate_limited" : s >= 500 ? "server" : "bad_request";
const retryable = (k: QlooErrorKind) => k === "server" || k === "timeout" || k === "network";

export function createQlooClient(o: QlooClientOptions): QlooClient {
  const fetchImpl = o.fetchImpl ?? fetch;
  const limit = pLimit(o.concurrency ?? 6);
  const timeoutMs = o.timeoutMs ?? 20_000;
  const ttl = o.ttlSec ?? 604_800;
  const delay = o.retryDelayMs ?? 400;
  const rateLimitDelay = o.rateLimitDelayMs ?? 1100;
  const gate = o.rateGate ?? createRateGate(3, 1000);

  async function attempt(url: string, path: string): Promise<unknown> {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    try {
      const res = await fetchImpl(url, { headers: { "X-Api-Key": o.apiKey, accept: "application/json" }, signal: ac.signal });
      if (!res.ok) throw new QlooError(kindFor(res.status), res.status, `Qloo ${path} failed with HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (e instanceof QlooError) throw e;
      if ((e as Error).name === "AbortError") throw new QlooError("timeout", undefined, `Qloo ${path} timed out after ${timeoutMs}ms`);
      throw new QlooError("network", undefined, `Qloo ${path} network error`);
    } finally { clearTimeout(timer); }
  }

  return {
    async get<T>(path: string, params: Params): Promise<T> {
      const url = buildUrl(o.baseUrl, path, params);
      const key = createHash("sha1").update(url).digest("hex");
      const hit = await o.cache.get<T>(key);
      if (hit !== null) return hit;
      const body = await limit(async () => {
        let rateLimitRetries = 2, otherRetries = 1;
        for (;;) {
          try { await gate(); return await attempt(url, path); }
          catch (e) {
            if (!(e instanceof QlooError)) throw e;
            if (e.kind === "rate_limited" && rateLimitRetries-- > 0) { gate.pause(rateLimitDelay); continue; }
            if (retryable(e.kind) && otherRetries-- > 0) { await new Promise((r) => setTimeout(r, delay)); continue; }
            throw e;
          }
        }
      });
      await o.cache.set(key, body, ttl);
      return body as T;
    },
  };
}
