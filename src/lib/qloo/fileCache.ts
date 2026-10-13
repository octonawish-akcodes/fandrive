import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Cache } from "./cache";

/** Disk cache for local scripts (spike, recordings) so re-runs don't spend the monthly Qloo quota. */
export class FileCache implements Cache {
  constructor(private dir: string, private now: () => number = () => Date.now()) {}
  private file(key: string) { return path.join(this.dir, `${key.replace(/[^a-z0-9_-]/gi, "_")}.json`); }
  async get<T>(key: string): Promise<T | null> {
    try {
      const { v, exp } = JSON.parse(await readFile(this.file(key), "utf8"));
      return exp < this.now() ? null : (v as T);
    } catch { return null; }
  }
  async set(key: string, value: unknown, ttlSec: number) {
    await mkdir(this.dir, { recursive: true });
    const f = this.file(key);
    const tmp = `${f}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify({ v: value, exp: this.now() + ttlSec * 1000 }));
    await rename(tmp, f);
  }
}
