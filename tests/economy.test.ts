import { describe, expect, it } from "vitest";
import {
  awardCoins,
  checkInvariants,
  GOAL_BADGE_XP,
  isValidCoinAmount,
  MAX_COIN_AMOUNT,
  parseCoinInput,
  setSavingsGoal,
  spendCoins,
  summarize,
  transferBlockedReason,
  transferToSavings,
  withdrawFromSavings,
} from "@/lib/economy";
import { createFreshProgress, moveCoinsToSavings, parseProgress, readStoredProgress } from "@/lib/progress";
import type { PlayerProgress } from "@/lib/types";

const t0 = "2026-01-01T00:00:00.000Z";
const t1 = "2026-01-01T00:00:01.000Z";
const t2 = "2026-01-01T00:00:02.000Z";

function mustOk(result: { ok: boolean; progress: PlayerProgress }): PlayerProgress {
  expect(result.ok).toBe(true);
  return result.progress;
}

function earn(progress: PlayerProgress, amount: number, key: string, now = t1): PlayerProgress {
  return mustOk(awardCoins(progress, { amount, label: "Test reward", kind: "mission-reward", rewardKey: key, now }));
}

describe("starter balance", () => {
  it("starts with 20 fictional coins, nothing saved, and a 150 coin default goal", () => {
    const fresh = createFreshProgress(t0);
    expect(fresh).toMatchObject({ coins: 20, savings: 0, totalEarned: 20, totalSpent: 0, savingsGoalTarget: 150 });
    expect(fresh.ledger).toHaveLength(1);
    expect(checkInvariants(fresh)).toBeNull();
  });
});

describe("coin amount validation", () => {
  it("accepts only whole positive numbers", () => {
    expect(isValidCoinAmount(1)).toBe(true);
    expect(isValidCoinAmount(MAX_COIN_AMOUNT)).toBe(true);
    for (const bad of [0, -1, 1.5, NaN, Infinity, -Infinity, MAX_COIN_AMOUNT + 1, "5", null, undefined, Number.MAX_SAFE_INTEGER + 2]) {
      expect(isValidCoinAmount(bad)).toBe(false);
    }
  });

  it("parses typed text strictly", () => {
    expect(parseCoinInput(" 25 ")).toBe(25);
    for (const bad of ["", "1.5", "-3", "1e3", "abc", "0", "12345678", "٣"]) expect(parseCoinInput(bad)).toBeNull();
  });

  it("rejects bad amounts on every operation and leaves progress untouched", () => {
    const fresh = createFreshProgress(t0);
    for (const bad of [0, -5, 2.5, NaN, Infinity]) {
      expect(transferToSavings(fresh, bad, t1)).toMatchObject({ ok: false, reason: "invalid_amount", progress: fresh });
      expect(withdrawFromSavings(fresh, bad, t1)).toMatchObject({ ok: false, reason: "invalid_amount" });
      expect(spendCoins(fresh, bad, "x", t1)).toMatchObject({ ok: false, reason: "invalid_amount" });
      expect(awardCoins(fresh, { amount: bad, label: "x", kind: "mission-reward", rewardKey: "k", now: t1 })).toMatchObject({
        ok: false,
        reason: "invalid_amount",
      });
    }
  });
});

describe("earning", () => {
  it("adds a valid reward to the wallet, totals, and history", () => {
    const next = earn(createFreshProgress(t0), 12, "mission:a");
    expect(next.coins).toBe(32);
    expect(next.totalEarned).toBe(32);
    expect(next.ledger.at(-1)).toMatchObject({ amount: 12, balanceAfter: 32, kind: "mission-reward" });
    expect(checkInvariants(next)).toBeNull();
  });

  it("refuses the same reward key twice", () => {
    const once = earn(createFreshProgress(t0), 12, "mission:a");
    const twice = awardCoins(once, { amount: 12, label: "again", kind: "mission-reward", rewardKey: "mission:a", now: t2 });
    expect(twice).toMatchObject({ ok: false, reason: "duplicate" });
    expect(twice.progress.coins).toBe(32);
  });
});

describe("saving toward a goal", () => {
  it("rejects a transfer larger than the wallet and changes nothing", () => {
    const fresh = createFreshProgress(t0);
    const result = transferToSavings(fresh, 21, t1);
    expect(result).toMatchObject({ ok: false, reason: "insufficient_funds" });
    expect(result.progress).toBe(fresh);
  });

  it("keeps the wallet from going negative across many moves", () => {
    let progress = createFreshProgress(t0);
    for (let i = 0; i < 10; i += 1) {
      const result = transferToSavings(progress, 7, `2026-01-01T00:00:0${i}.000Z`);
      if (result.ok) progress = result.progress;
      expect(progress.coins).toBeGreaterThanOrEqual(0);
      expect(checkInvariants(progress)).toBeNull();
    }
    expect(progress.coins).toBe(20 - 14);
    expect(progress.savings).toBe(14);
  });

  it("lets a player save more than 30 coins toward 150 when the wallet allows", () => {
    // The brief's example: 100 in the wallet, 20 already saved, goal 150.
    let progress = createFreshProgress(t0);
    progress = mustOk(transferToSavings(progress, 20, t0));
    progress = earn(progress, 100, "mission:big");
    expect(progress).toMatchObject({ coins: 100, savings: 20 });

    progress = mustOk(transferToSavings(progress, 100, t2));
    expect(progress).toMatchObject({ coins: 0, savings: 120 });
    expect(summarize(progress).goal).toMatchObject({ saved: 120, target: 150, remaining: 30, percent: 80, complete: false });
    expect(checkInvariants(progress)).toBeNull();
  });

  it("supports Save all via the wallet balance", () => {
    const progress = earn(createFreshProgress(t0), 55, "mission:x");
    const saved = mustOk(transferToSavings(progress, progress.coins, t2));
    expect(saved).toMatchObject({ coins: 0, savings: 75 });
  });

  it("keeps the old helper working", () => {
    const moved = moveCoinsToSavings(createFreshProgress(t0), 5, t1);
    expect(moved.ok && moved.progress.savings).toBe(5);
    expect(moveCoinsToSavings(createFreshProgress(t0), 500, t1)).toMatchObject({ ok: false, reason: "insufficient_funds" });
    expect(moveCoinsToSavings(createFreshProgress(t0), 1.5, t1)).toMatchObject({ ok: false, reason: "invalid_amount" });
  });

  it("completes the goal from real savings, once, with a badge and XP", () => {
    let progress = earn(createFreshProgress(t0), 130, "mission:big");
    const partial = mustOk(transferToSavings(progress, 149, t1));
    expect(partial.badges).toHaveLength(0);
    expect(summarize(partial).goal.complete).toBe(false);

    const done = mustOk(transferToSavings(partial, 1, t2));
    expect(summarize(done).goal.complete).toBe(true);
    expect(done.badges.map((badge) => badge.id)).toEqual(["goal-getter"]);
    expect(done.xp).toBe(GOAL_BADGE_XP);

    progress = mustOk(withdrawFromSavings(done, 10, t2));
    progress = mustOk(transferToSavings(progress, 10, "2026-01-01T00:00:03.000Z"));
    expect(progress.badges).toHaveLength(1);
    expect(progress.xp).toBe(GOAL_BADGE_XP);
  });

  it("explains why saving is unavailable", () => {
    const empty = mustOk(transferToSavings(createFreshProgress(t0), 20, t1));
    expect(transferBlockedReason(empty, 1)).toContain("empty");
    expect(transferBlockedReason(createFreshProgress(t0), 1)).toBeNull();
    expect(transferBlockedReason(createFreshProgress(t0), 50)).toContain("only has 20");
  });
});

describe("withdrawing and spending", () => {
  it("moves savings back to the wallet but never below zero", () => {
    const saved = mustOk(transferToSavings(createFreshProgress(t0), 15, t1));
    const back = mustOk(withdrawFromSavings(saved, 10, t2));
    expect(back).toMatchObject({ coins: 15, savings: 5 });
    expect(withdrawFromSavings(back, 6, t2)).toMatchObject({ ok: false, reason: "insufficient_savings" });
  });

  it("spends only what the wallet holds and keeps totals consistent", () => {
    const fresh = createFreshProgress(t0);
    const spent = mustOk(spendCoins(fresh, 8, "Park snack", t1));
    expect(spent).toMatchObject({ coins: 12, totalSpent: 8, totalEarned: 20 });
    expect(spendCoins(spent, 13, "Too much", t2)).toMatchObject({ ok: false, reason: "insufficient_funds" });
    expect(checkInvariants(spent)).toBeNull();
  });
});

describe("goals", () => {
  it("accepts any positive target, including above 30, 150, and 100000", () => {
    const fresh = createFreshProgress(t0);
    for (const target of [1, 31, 150, 5000, 999_999]) {
      const result = setSavingsGoal(fresh, "Skateboard", target);
      expect(result.ok && result.progress.savingsGoalTarget).toBe(target);
    }
    for (const bad of [0, -1, 1.5, NaN, 1_000_001]) expect(setSavingsGoal(fresh, "Skateboard", bad).ok).toBe(false);
    expect(setSavingsGoal(fresh, "   ", 100).ok).toBe(false);
  });
});

describe("history agrees with balances", () => {
  it("every note's balanceAfter matches the wallet at that point", () => {
    let progress = createFreshProgress(t0);
    progress = earn(progress, 40, "mission:a", "2026-01-01T00:00:01.000Z");
    progress = mustOk(transferToSavings(progress, 25, "2026-01-01T00:00:02.000Z"));
    progress = mustOk(withdrawFromSavings(progress, 5, "2026-01-01T00:00:03.000Z"));
    progress = mustOk(spendCoins(progress, 3, "Snack", "2026-01-01T00:00:04.000Z"));
    const walletFromNotes = progress.ledger.reduce((sum, entry) => sum + entry.amount, 0);
    expect(walletFromNotes).toBe(progress.coins);
    expect(progress.ledger.at(-1)?.balanceAfter).toBe(progress.coins);
    expect(new Set(progress.ledger.map((entry) => entry.id)).size).toBe(progress.ledger.length);
    expect(checkInvariants(progress)).toBeNull();
  });
});

describe("browser persistence", () => {
  it("survives a page refresh because saved JSON reads back identically", () => {
    let progress = earn(createFreshProgress(t0), 30, "mission:a");
    progress = mustOk(transferToSavings(progress, 35, t2));
    const reloaded = readStoredProgress(JSON.stringify(progress));
    expect(reloaded.recovered).toBe(false);
    expect(reloaded.progress).toEqual(progress);
  });

  it("reads a save made before lessons and totals existed", () => {
    const old = {
      version: 1,
      coins: 5,
      xp: 10,
      savings: 20,
      savingsGoalName: "Town bicycle",
      savingsGoalTarget: 150,
      badges: [],
      missions: {},
      ledger: [],
    };
    const parsed = parseProgress(old);
    expect(parsed.recovered).toBe(false);
    expect(parsed.progress).toMatchObject({ coins: 5, savings: 20, totalEarned: 25, totalSpent: 0, lessons: {} });
    expect(checkInvariants(parsed.progress)).toBeNull();
  });

  it("repairs tampered totals instead of trusting them", () => {
    const fresh = createFreshProgress(t0);
    const parsed = parseProgress({ ...fresh, totalEarned: 9_999_999, coins: 20 });
    expect(parsed.progress.totalEarned).toBe(20);
  });
});
