import { expect, it } from "vitest";
import { applyEvent, initialRun } from "@/lib/client/runState";

it("accumulates steps and sections, and resets", () => {
  let s = applyEvent(initialRun, { type: "reset" });
  expect(s.status).toBe("running");
  s = applyEvent(s, { type: "step", step: { at: 5, tool: "fan_age", message: "Checking" } });
  s = applyEvent(s, { type: "city", city: { name: "Houston", lat: 1, lon: 2, badge: "strong", cells: 9 } });
  expect(s.steps).toHaveLength(1);
  expect(s.city?.name).toBe("Houston");
  s = applyEvent(s, { type: "error", code: "too_few_partners", message: "Only 2" });
  expect(s.status).toBe("error");
  expect(applyEvent(s, { type: "reset" }).steps).toEqual([]);
});

it("keeps the agent's picks from the partners event", () => {
  const s = applyEvent(applyEvent(initialRun, { type: "reset" }), { type: "partners", partners: [], excluded: [], picks: { ids: ["a"], rationale: "Young" } });
  expect(s.picks).toEqual({ ids: ["a"], rationale: "Young" });
});
