import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeApi, heat, id } from "../../helpers/fakeApi";

const young = { age: { "24_and_younger": 0.8 }, gender: {} };
const data = {
  demo: { [id("Sabrina Carpenter")]: young, [id("Olivia Rodrigo")]: young, [id("Bad Bunny")]: young },
  heat: { [id("Sabrina Carpenter")]: heat([["g1", 0.9], ["g2", 0.8], ["g3", 0.6]]) },
  places: [{ entityId: "p1", name: "Fitness Connection", lat: 29.7, lon: -95.52, affinity: 0.8, neighborhood: "Sharpstown", genre: "gym", tags: [] }],
};
const saved: unknown[] = [];
vi.mock("@/lib/qloo", () => ({ getQlooApi: () => fakeApi(data) }));
vi.mock("@/lib/agent/model", () => ({ getModel: () => null }));
vi.mock("@/lib/store/plans", () => ({ savePlan: async (p: unknown) => { saved.push(p); }, getPlan: async () => null }));
vi.mock("@/lib/ratelimit", () => ({ limitByIp: vi.fn(async () => true) }));

const { POST } = await import("@/app/api/plan/route");
const { limitByIp } = await import("@/lib/ratelimit");
const req = (body: unknown) => new Request("http://x/api/plan", { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body), headers: { "x-forwarded-for": "9.9.9.9" } });
const good = { city: "Houston", startDate: "2026-11-14", endDate: "2026-11-30" };

describe("POST /api/plan", () => {
  beforeEach(() => { saved.length = 0; });
  it("streams NDJSON events ending in done and saves the plan", async () => {
    const res = await POST(req(good));
    expect(res.headers.get("content-type")).toContain("application/x-ndjson");
    const lines = (await res.text()).trim().split("\n").map((l) => JSON.parse(l));
    expect(lines.at(-1).type).toBe("done");
    expect(saved).toHaveLength(1);
  });
  it("rejects bad input, huge bodies and rate-limited callers", async () => {
    expect((await POST(req({ ...good, city: "x".repeat(500) }))).status).toBe(400);
    expect((await POST(req("y".repeat(5000)))).status).toBe(413);
    expect((await POST(req("{not json"))).status).toBe(400);
    vi.mocked(limitByIp).mockResolvedValueOnce(false);
    expect((await POST(req(good))).status).toBe(429);
  });
});
