import { describe, expect, it } from "vitest";
import { spearman, youngLean } from "@/lib/eval/validate";

describe("age validation", () => {
  it("spearman: +1 for the same order, -1 for the reverse, ties get average ranks", () => {
    expect(spearman([1, 2, 3, 4], [10, 20, 30, 40])).toBeCloseTo(1);
    expect(spearman([1, 2, 3, 4], [40, 30, 20, 10])).toBeCloseTo(-1);
    expect(spearman([1, 2, 3], [5, 5, 9])).toBeCloseTo(0.866, 2);
  });
  it("youngLean: Qloo's under-35 affinity minus its 45-and-over affinity", () => {
    expect(youngLean({ "24_and_younger": 0.3, "25_to_29": 0.3, "30_to_34": 0.3, "35_to_44": 0, "45_to_54": -0.2, "55_and_older": -0.4 })).toBeCloseTo(0.6);
    expect(youngLean({})).toBe(0);
  });
});
