import { expect, it } from "vitest";
import { readNdjson } from "@/lib/client/ndjson";

it("parses events split across chunk boundaries", async () => {
  const enc = new TextEncoder();
  const chunks = ['{"type":"step","step":{"at":0,"tool":"a","message":"x"}}\n{"type":"ci', 'ty","city":{"name":"Houston","lat":1,"lon":2,"badge":"strong","cells":9}}\n'];
  const body = new ReadableStream<Uint8Array>({ start(c) { chunks.forEach((s) => c.enqueue(enc.encode(s))); c.close(); } });
  const out = [];
  for await (const e of readNdjson(body)) out.push(e.type);
  expect(out).toEqual(["step", "city"]);
});
