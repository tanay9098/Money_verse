import { describe, expect, it } from "vitest";
import { demoMissions } from "@/lib/content/demo";
import {
  createFreshProgress,
  grantMissionReward,
  moveCoinsToSavings,
  parseProgress,
  readStoredProgress,
} from "@/lib/progress";

const mission = demoMissions[0];

describe("saved progress", () => {
  it("starts a fresh wallet when data is missing or malformed", () => {
    expect(readStoredProgress(null).recovered).toBe(false);
    expect(readStoredProgress(null).progress.coins).toBe(20);
    expect(readStoredProgress("{").recovered).toBe(true);
    expect(readStoredProgress("[]").progress.coins).toBe(20);
    expect(parseProgress({ version: 2, coins: 10 }).recovered).toBe(true);
    expect(parseProgress({ version: 1, coins: -5, xp: 0, savings: 0 }).progress.coins).toBe(20);
    expect(parseProgress("nope").recovered).toBe(true);
  });

  it("keeps a valid wallet and drops a broken badge", () => {
    const fresh = createFreshProgress("2026-01-01T00:00:00.000Z");
    const parsed = parseProgress({
      ...fresh,
      badges: [{ id: "ok", name: "Ok", description: "Fine", earnedAt: "2026-01-01T00:00:00.000Z" }, { id: "" }],
    });
    expect(parsed.recovered).toBe(true);
    expect(parsed.progress.coins).toBe(20);
    expect(parsed.progress.badges).toHaveLength(1);
  });

  it("awards mission coins once and allows another completion without more coins", () => {
    const first = grantMissionReward(createFreshProgress("2026-01-01T00:00:00.000Z"), {
      slug: mission.slug,
      stars: 2,
      rewards: mission.rewards,
      quizCorrect: 2,
      now: "2026-01-02T00:00:00.000Z",
    });
    expect(first.coinsAwarded).toBe(12);
    expect(first.progress.coins).toBe(32);
    expect(first.badgeEarned).toBe(true);
    expect(first.xpAwarded).toBe(50);

    const replay = grantMissionReward(first.progress, {
      slug: mission.slug,
      stars: 3,
      rewards: mission.rewards,
      quizCorrect: 1,
      now: "2026-01-03T00:00:00.000Z",
    });
    expect(replay.coinsAwarded).toBe(0);
    expect(replay.progress.coins).toBe(32);
    expect(replay.badgeEarned).toBe(false);
    expect(replay.progress.missions[mission.slug]).toMatchObject({ completions: 2, bestStars: 3, lastQuizCorrect: 1 });
  });

  it("moves coins into the bicycle jar", () => {
    const moved = moveCoinsToSavings(createFreshProgress("2026-01-01T00:00:00.000Z"), 5, "2026-01-01T00:00:00.000Z");
    expect(moved.ok).toBe(true);
    if (!moved.ok) return;
    expect(moved.progress.coins).toBe(15);
    expect(moved.progress.savings).toBe(5);
    expect(moved.progress.ledger.at(-1)?.kind).toBe("savings-transfer");
  });
});
