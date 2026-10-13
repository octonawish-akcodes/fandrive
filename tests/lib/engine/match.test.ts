import { describe, expect, it } from "vitest";
import { matchConfidence } from "@/lib/engine/match";
import { MATCH_OK } from "@/lib/engine/weights";

describe("matchConfidence", () => {
  it.each([
    ["Kendrick Lamar", "Kendrick Lamar"], ["F1", "F1: The Movie"], ["Demon Slayer", "Demon Slayer: Kimetsu no Yaiba"],
    ["Formula 1", "Formula One"], ["Zelda: Tears of the Kingdom", "The Legend of Zelda: Tears of the Kingdom"],
    ["Beyoncé", "Beyonce"],
  ])("accepts %s → %s", (q, n) => expect(matchConfidence(q, n)).toBeGreaterThanOrEqual(MATCH_OK));
  it.each([
    ["Alex Warren", "Alex Clare"], ["sombr", "Sombres Forêts"], ["The Ranveer Show", "Adam Carolla Show"],
    ["Dude Perfect", "Dude Harlino"], ["Stumble Guys", "Spellbound Stumble"],
  ])("rejects %s → %s", (q, n) => expect(matchConfidence(q, n)).toBeLessThan(MATCH_OK));
});
