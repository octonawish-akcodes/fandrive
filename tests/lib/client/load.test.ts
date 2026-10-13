import { describe, expect, it } from "vitest";
import { loadRecording, loadSavedPlan } from "@/lib/client/load";

const respond = (status: number, body: unknown = {}) => (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;
const offline = (async () => { throw new TypeError("Failed to fetch"); }) as unknown as typeof fetch;

describe("loading recordings and saved plans", () => {
  it("explains a missing example recording", async () => {
    expect(await loadRecording("houston", respond(404))).toEqual({ error: "This example isn't available yet. Run the city live with the form above." });
  });
  it("explains a missing or expired plan link", async () => {
    expect(await loadSavedPlan("abc", respond(404))).toEqual({ error: "We couldn't find that plan. Shared plans are kept for 120 days." });
  });
  it("explains a network failure and returns the data when it loads", async () => {
    expect(await loadSavedPlan("abc", offline)).toEqual({ error: "Couldn't load the plan. Check your connection and try again." });
    expect(await loadRecording("houston", respond(200, { slug: "houston", events: [] }))).toMatchObject({ slug: "houston" });
  });
});
