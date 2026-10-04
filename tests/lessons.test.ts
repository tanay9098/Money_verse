import { describe, expect, it } from "vitest";
import { starterLessons } from "@/lib/content/lessons";
import { resolveContent } from "@/lib/content/resolve";
import { validateLesson, validateLessons } from "@/lib/content/validate";
import { demoMissions } from "@/lib/content/demo";
import { checkInvariants } from "@/lib/economy";
import { createFreshProgress, lessonPassMark, recordLessonAttempt } from "@/lib/progress";
import type { Lesson } from "@/lib/types";

const now = "2026-01-02T00:00:00.000Z";
const lesson = starterLessons[0];

function allCorrect(target: Lesson): Record<string, string> {
  return Object.fromEntries(target.quiz.map((question) => [question.id, question.choices.find((choice) => choice.correct)!.id]));
}

function allWrong(target: Lesson): Record<string, string> {
  return Object.fromEntries(target.quiz.map((question) => [question.id, question.choices.find((choice) => !choice.correct)!.id]));
}

describe("starter lessons", () => {
  it("covers the eight required topics and every lesson passes validation", () => {
    expect(starterLessons).toHaveLength(8);
    expect(validateLessons(starterLessons)).toHaveLength(8);
    expect(starterLessons.map((item) => item.topic)).toEqual([
      "Income and earning",
      "Needs vs wants",
      "Spending and opportunity cost",
      "Budgeting",
      "Saving",
      "Profit and business",
      "Unexpected expenses",
      "Making thoughtful choices",
    ]);
    for (const item of starterLessons) {
      expect(item.quiz.length).toBeGreaterThanOrEqual(3);
      expect(item.sections.length).toBeGreaterThanOrEqual(3);
      expect(item.rewards?.coins).toBeGreaterThan(0);
      for (const question of item.quiz) expect(question.choices.filter((choice) => choice.correct)).toHaveLength(1);
    }
  });
});

describe("lesson validation", () => {
  it("accepts a legacy text-only lesson as read-only", () => {
    const legacy = validateLesson({
      slug: "old", title: "Old", summary: "S", body: "B", topic: "T", ageMin: 8, ageMax: 12, order: 1,
    });
    expect(legacy).toMatchObject({ quiz: [], sections: [], rewards: null, difficulty: "easy" });
  });

  it("rejects malformed quizzes and sections", () => {
    const base = { ...lesson };
    const twoCorrect = { ...base, quiz: [{ ...base.quiz[0], choices: base.quiz[0].choices.map((choice) => ({ ...choice, correct: true })) }] };
    const noCorrect = { ...base, quiz: [{ ...base.quiz[0], choices: base.quiz[0].choices.map((choice) => ({ ...choice, correct: false })) }] };
    const oneChoice = { ...base, quiz: [{ ...base.quiz[0], choices: [base.quiz[0].choices[0]] }] };
    const dupChoice = { ...base, quiz: [{ ...base.quiz[0], choices: [base.quiz[0].choices[0], base.quiz[0].choices[0]] }] };
    const dupQuestion = { ...base, quiz: [base.quiz[0], base.quiz[0]] };
    const badIcon = { ...base, sections: [{ ...base.sections[0], illustration: "dragon" }] };
    const badPass = { ...base, passPercent: 0 };
    const badCoins = { ...base, rewards: { coins: 9999, xp: 1 } };
    for (const bad of [twoCorrect, noCorrect, oneChoice, dupChoice, dupQuestion, badIcon, badPass, badCoins, null, "x"]) {
      expect(validateLesson(bad)).toBeNull();
    }
  });

  it("excludes lessons that are not approved", () => {
    expect(validateLesson({ ...lesson, reviewStatus: "draft" })).toBeNull();
    expect(validateLesson({ ...lesson, reviewStatus: "inReview" })).toBeNull();
    expect(validateLesson({ ...lesson, reviewStatus: "approved" })?.slug).toBe(lesson.slug);
  });

  it("drops the reward when there is no quiz to earn it", () => {
    expect(validateLesson({ ...lesson, quiz: [], rewards: { coins: 50, xp: 50 } })?.rewards).toBeNull();
  });
});

describe("quiz scoring and rewards", () => {
  it("scores all-correct, mixed, and all-wrong answers", () => {
    const fresh = createFreshProgress(now);
    expect(recordLessonAttempt(fresh, lesson, allCorrect(lesson), now)).toMatchObject({ correct: 3, total: 3, passed: true });
    expect(recordLessonAttempt(fresh, lesson, allWrong(lesson), now)).toMatchObject({ correct: 0, passed: false });
    const mixed = { ...allWrong(lesson), [lesson.quiz[0].id]: lesson.quiz[0].choices.find((choice) => choice.correct)!.id };
    expect(recordLessonAttempt(fresh, lesson, mixed, now)).toMatchObject({ correct: 1, passed: false });
    const twoRight = { ...allCorrect(lesson), [lesson.quiz[2].id]: lesson.quiz[2].choices.find((choice) => !choice.correct)!.id };
    expect(recordLessonAttempt(fresh, lesson, twoRight, now)).toMatchObject({ correct: 2, passed: true });
    expect(recordLessonAttempt(fresh, lesson, {}, now).correct).toBe(0);
    expect(lessonPassMark(lesson)).toBe(2);
    expect(lessonPassMark({ quiz: lesson.quiz, passPercent: 100 })).toBe(3);
  });

  it("pays once on the first pass and never on a repeat", () => {
    const fresh = createFreshProgress(now);
    const failed = recordLessonAttempt(fresh, lesson, allWrong(lesson), now);
    expect(failed.progress.coins).toBe(20);
    expect(failed.progress.lessons[lesson.slug]).toMatchObject({ completed: false, attempts: 1 });

    const first = recordLessonAttempt(failed.progress, lesson, allCorrect(lesson), "2026-01-03T00:00:00.000Z");
    expect(first).toMatchObject({ firstCompletion: true, coinsAwarded: 6, xpAwarded: 20 });
    expect(first.progress).toMatchObject({ coins: 26, xp: 20, totalEarned: 26 });
    expect(first.progress.lessons[lesson.slug]).toMatchObject({ completed: true, attempts: 2, bestCorrect: 3 });
    expect(first.progress.ledger.at(-1)).toMatchObject({ kind: "lesson-reward", amount: 6 });

    const again = recordLessonAttempt(first.progress, lesson, allCorrect(lesson), "2026-01-04T00:00:00.000Z");
    expect(again).toMatchObject({ passed: true, firstCompletion: false, coinsAwarded: 0, xpAwarded: 0 });
    expect(again.progress.coins).toBe(26);
    expect(again.progress.lessons[lesson.slug].completedAt).toBe("2026-01-03T00:00:00.000Z");
    expect(checkInvariants(again.progress)).toBeNull();
  });

  it("completes a read-only lesson without paying anything", () => {
    const readOnly: Lesson = { ...lesson, slug: "read-only", quiz: [], rewards: null };
    const result = recordLessonAttempt(createFreshProgress(now), readOnly, {}, now);
    expect(result).toMatchObject({ passed: true, firstCompletion: true, coinsAwarded: 0 });
    expect(result.progress.coins).toBe(20);
  });
});

describe("content states", () => {
  const prod = { allowDemoFallback: false };

  it("shows approved lessons and missions from Sanity", async () => {
    const bundle = await resolveContent("p", async () => ({ missions: demoMissions, lessons: starterLessons }), () => {}, prod);
    expect(bundle.source).toBe("sanity");
    expect(bundle.lessons).toHaveLength(8);
  });

  it("filters drafts and in-review lessons out of what Sanity returns", async () => {
    const bundle = await resolveContent(
      "p",
      async () => ({
        missions: demoMissions,
        lessons: [{ ...lesson, reviewStatus: "draft" }, { ...starterLessons[1], reviewStatus: "approved" }, { ...starterLessons[2], reviewStatus: "inReview" }],
      }),
      () => {},
      prod,
    );
    expect(bundle.lessons.map((item) => item.slug)).toEqual(["needs-and-wants"]);
  });

  it("reports an empty production dataset without inventing content", async () => {
    const bundle = await resolveContent("p", async () => ({ missions: [], lessons: [] }), () => {}, prod);
    expect(bundle).toMatchObject({ source: "unavailable", missions: [], lessons: [] });
    expect(bundle.reason).toContain("Studio");
  });

  it("reports a failed Sanity request in production without inventing content", async () => {
    const bundle = await resolveContent("p", async () => { throw new Error("offline"); }, () => {}, prod);
    expect(bundle).toMatchObject({ source: "unavailable", missions: [], lessons: [] });
    expect(bundle.reason).toContain("could not be reached");
  });

  it("shows no lessons, with an explanation, when only missions are published", async () => {
    const bundle = await resolveContent("p", async () => ({ missions: demoMissions, lessons: [] }), () => {}, prod);
    expect(bundle.source).toBe("sanity");
    expect(bundle.lessons).toEqual([]);
    expect(bundle.reason).toContain("No approved lessons");
  });
});
