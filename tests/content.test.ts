import { describe, expect, it } from "vitest";
import { demoLessons, demoMissions } from "@/lib/content/demo";
import { resolveContent } from "@/lib/content/resolve";
import { validateLesson, validateMission, validateMissions } from "@/lib/content/validate";

describe("demo and remote content", () => {
  it("accepts every built-in lesson and mission", () => {
    expect(demoLessons.every((lesson) => validateLesson(lesson))).toBe(true);
    expect(demoMissions.every((mission) => validateMission(mission))).toBe(true);
    expect(validateMissions(demoMissions).map((mission) => mission.slug)).toEqual([
      "needs-vs-wants",
      "savings-quest",
      "lemonade-stand",
    ]);
  });

  it("uses demo content when Sanity is not configured", async () => {
    const logs: string[] = [];
    const bundle = await resolveContent(undefined, async () => ({ missions: [], lessons: [] }), (message) => logs.push(message));
    expect(bundle.source).toBe("demo");
    expect(bundle.missions).toHaveLength(3);
    expect(logs[0]).toContain("Content source: demo");
  });

  it("does not claim success when the request fails or missions are invalid", async () => {
    const failed = await resolveContent("example", async () => {
      throw new Error("offline");
    });
    expect(failed.source).toBe("demo");
    expect(failed.reason).toContain("could not be reached");

    const empty = await resolveContent("example", async () => ({ missions: [{ title: "Broken" }], lessons: [] }));
    expect(empty.source).toBe("demo");
    expect(empty.reason).toContain("no valid missions");
  });

  it("keeps production empty when Sanity is missing or has no approved missions", async () => {
    const missing = await resolveContent(undefined, async () => ({ missions: [], lessons: [] }), () => {}, {
      allowDemoFallback: false,
    });
    expect(missing.source).toBe("unavailable");
    expect(missing.missions).toEqual([]);

    const empty = await resolveContent("example", async () => ({ missions: [{ title: "Broken" }], lessons: [] }), () => {}, {
      allowDemoFallback: false,
    });
    expect(empty.source).toBe("unavailable");
    expect(empty.missions).toEqual([]);
    expect(empty.reason).toContain("approved");
  });

  it("rejects a mission that is still in review", () => {
    expect(validateMission({ ...demoMissions[0], reviewStatus: "inReview" })).toBeNull();
    expect(validateMission({ ...demoMissions[0], reviewStatus: "approved" })?.slug).toBe("needs-vs-wants");
  });

  it("keeps valid Sanity missions", async () => {
    const bundle = await resolveContent("example", async () => ({
      missions: demoMissions,
      lessons: demoLessons,
    }));
    expect(bundle.source).toBe("sanity");
    expect(bundle.reason).toBeNull();
    expect(bundle.missions[2].engine).toBe("lemonade");
  });
});
