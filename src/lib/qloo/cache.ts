import type { Redis } from "@upstash/redis";

export interface Cache {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSec: number): Promise<void>;
}

export class MemoryCache implements Cache {
  private m = new Map<string, { v: unknown; exp: number }>();
  constructor(private now: () => number = () => Date.now()) {}
  async get<T>(key: string): Promise<T | null> {
    const e = this.m.get(key);
    if (!e) return null;
    if (e.exp < this.now()) { this.m.delete(key); return null; }
    return e.v as T;
  }
  async set(key: string, value: unknown, ttlSec: number) { this.m.set(key, { v: value, exp: this.now() + ttlSec * 1000 }); }
}

export class RedisCache implements Cache {
  constructor(private redis: Redis, private prefix = "q:") {}
  async get<T>(key: string) { return ((await this.redis.get<T>(this.prefix + key)) ?? null) as T | null; }
  async set(key: string, value: unknown, ttlSec: number) { await this.redis.set(this.prefix + key, value, { ex: ttlSec }); }
}
