import { expect, it } from "vitest";
import { createTools } from "@/lib/engine/tools";
import { fakeApi } from "../../helpers/fakeApi";

it("types user names from untyped search and reports unknown ones", async () => {
  const t = createTools(fakeApi({ types: { "Houston Astros": "brand", "Stranger Things": "tv_show" }, notFound: ["zzqx"] }));
  const r = await t.typeNames(["Houston Astros", "Stranger Things", "zzqx"]);
  expect(r.refs).toEqual([{ name: "Houston Astros", type: "brand" }, { name: "Stranger Things", type: "tv_show" }]);
  expect(r.unresolved).toEqual(["zzqx"]);
});

it("picks the entity people mean when a name exists under several types (Kai Cenat: person, not his little-known music page)", async () => {
  const api = fakeApi({});
  api.search = async (q) => [
    { entityId: "kai-person", name: q, type: "person", popularity: 0.95 },
    { entityId: "kai-artist", name: q, type: "artist", popularity: 0.12 },
  ];
  expect((await createTools(api).typeNames(["Kai Cenat"])).refs).toEqual([{ name: "Kai Cenat", type: "person" }]);
});
