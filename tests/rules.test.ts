import { describe, expect, it } from "vitest";
import { demoMissions } from "@/lib/content/demo";
import { ID_PATTERN, slugFormat, slugify, uniqueBy } from "@/lib/content/rules";
import { validateMission } from "@/lib/content/validate";

describe("content rules shared by Studio and the game", () => {
  it("generates slugs the game accepts", () => {
    expect(slugify("Pip's Shop!")).toBe("pips-shop");
    expect(slugify("  Needs vs. Wants  ")).toBe("needs-vs-wants");
    expect(slugify("x".repeat(100))).toHaveLength(80);
    for (const title of ["Pip's Shop!", "Ça va?", "A — B", "1, 2, 3"]) {
      const slug = slugify(title);
      expect(slug === "" || ID_PATTERN.test(slug)).toBe(true);
    }
  });

  it("flags slugs the game would drop", () => {
    expect(slugFormat({ current: "pips-shop" })).toBe(true);
    expect(slugFormat({ current: "pip's-shop" })).not.toBe(true);
    expect(validateMission({ ...demoMissions[0], slug: "pip's-shop" })).toBeNull();
  });

  it("flags duplicate ids, which the game also rejects", () => {
    expect(uniqueBy("id", "step id")([{ id: "a" }, { id: "b" }])).toBe(true);
    expect(uniqueBy("id", "step id")([{ id: "a" }, { id: "a" }])).toMatch(/used twice/);
    const steps = demoMissions[0].steps;
    expect(validateMission({ ...demoMissions[0], steps: [steps[0], steps[0]] })).toBeNull();
  });
});
