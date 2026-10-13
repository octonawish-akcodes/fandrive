import { expect, it } from "vitest";
import { createTools } from "@/lib/engine/tools";
import { fakeApi } from "../../helpers/fakeApi";

it("types user names from untyped search and reports unknown ones", async () => {
  const t = createTools(fakeApi({ types: { "Houston Astros": "brand", "Stranger Things": "tv_show" }, notFound: ["zzqx"] }));
  const r = await t.typeNames(["Houston Astros", "Stranger Things", "zzqx"]);
  expect(r.refs).toEqual([{ name: "Houston Astros", type: "brand" }, { name: "Stranger Things", type: "tv_show" }]);
  expect(r.unresolved).toEqual(["zzqx"]);
});
