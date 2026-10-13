import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { FileCache } from "@/lib/qloo/fileCache";

let dir = "";
afterEach(async () => { if (dir) await rm(dir, { recursive: true, force: true }); });

describe("FileCache", () => {
  it("persists values across instances and expires them", async () => {
    dir = await mkdtemp(path.join(tmpdir(), "fc-"));
    let now = 1_000;
    await new FileCache(dir, () => now).set("abc123", { results: [1] }, 10);
    expect(await new FileCache(dir, () => now).get("abc123")).toEqual({ results: [1] });
    now += 11_000;
    expect(await new FileCache(dir, () => now).get("abc123")).toBeNull();
  });
  it("returns null for a missing key", async () => {
    dir = await mkdtemp(path.join(tmpdir(), "fc-"));
    expect(await new FileCache(dir).get("nope")).toBeNull();
  });
});
