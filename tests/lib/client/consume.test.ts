import { describe, expect, it } from "vitest";
import { consumePlanStream } from "@/lib/client/consume";
import type { RunEvent } from "@/lib/plan/schema";

const enc = new TextEncoder();
const streamOf = (lines: string[], failAfter = false) => new ReadableStream<Uint8Array>({
  start(c) { for (const l of lines) c.enqueue(enc.encode(l)); if (failAfter) c.error(new Error("network down")); else c.close(); },
});
const step = JSON.stringify({ type: "step", step: { at: 0, tool: "city_strength", message: "Checking" } }) + "\n";

describe("consumePlanStream", () => {
  it("reports a lost connection when the stream ends without done or error", async () => {
    const got: RunEvent[] = [];
    expect(await consumePlanStream(streamOf([step]), (e) => got.push(e))).toBeNull();
    expect(got.at(-1)).toMatchObject({ type: "error", code: "upstream" });
  });
  it("reports a lost connection when the stream fails or a line is malformed", async () => {
    for (const s of [streamOf([step], true), streamOf([step, "{not json\n"])]) {
      const got: RunEvent[] = [];
      await consumePlanStream(s, (e) => got.push(e));
      expect(got.at(-1)).toMatchObject({ type: "error", code: "upstream" });
    }
  });
  it("returns the plan and adds nothing after done", async () => {
    const done = JSON.stringify({ type: "done", plan: { id: "abc" } }) + "\n";
    const got: RunEvent[] = [];
    expect(await consumePlanStream(streamOf([step, done]), (e) => got.push(e))).toMatchObject({ id: "abc" });
    expect(got.map((e) => e.type)).toEqual(["step", "done"]);
  });
});
