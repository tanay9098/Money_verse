import { savingsProgress } from "@/lib/finance";
import type { Badge, LedgerEntry, LedgerKind, PlayerProgress } from "@/lib/types";

/**
 * The one place that changes coins. Every operation is pure: it returns a new
 * PlayerProgress or a failure plus the untouched original, so a failed call
 * never leaves balances half updated.
 *
 * Rules
 * - Coins are whole numbers, 1 to MAX_COIN_AMOUNT per operation. No decimals, so no rounding.
 * - wallet >= 0 and savings >= 0 always.
 * - coins + savings + totalSpent === totalEarned always (see checkInvariants).
 * - The savings goal target is chosen by the player. It never limits how much can be saved.
 */

export const MAX_COIN_AMOUNT = 1_000_000;
export const MAX_GOAL_TARGET = 1_000_000;
export const MAX_LEDGER = 40;
export const GOAL_BADGE_XP = 25;

export type EconomyFailure =
  | "invalid_amount"
  | "insufficient_funds"
  | "insufficient_savings"
  | "invalid_goal"
  | "duplicate";

export type EconomyResult =
  | { ok: true; progress: PlayerProgress }
  | { ok: false; reason: EconomyFailure; progress: PlayerProgress };

export function isValidCoinAmount(amount: unknown): amount is number {
  return typeof amount === "number" && Number.isSafeInteger(amount) && amount > 0 && amount <= MAX_COIN_AMOUNT;
}

/** Turns text typed by a child into a coin amount, or null. Rejects "", "1.5", "-3", "1e3", "abc". */
export function parseCoinInput(text: string): number | null {
  const trimmed = text.trim();
  if (!/^\d{1,7}$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return isValidCoinAmount(value) ? value : null;
}

function fail(progress: PlayerProgress, reason: EconomyFailure): EconomyResult {
  return { ok: false, reason, progress };
}

function appendLedger(
  progress: PlayerProgress,
  entry: Omit<LedgerEntry, "id" | "balanceAfter">,
  id = `${entry.kind}-${entry.at}-${progress.coins}-${progress.savings}-${progress.totalSpent}`,
): PlayerProgress {
  return {
    ...progress,
    ledger: [...progress.ledger, { ...entry, id, balanceAfter: progress.coins }].slice(-MAX_LEDGER),
  };
}

export type AwardInput = {
  amount: number;
  label: string;
  kind: Extract<LedgerKind, "mission-reward" | "lesson-reward">;
  /** Stable key such as "mission:needs-vs-wants". A second award with the same key is refused. */
  rewardKey: string;
  now: string;
};

export function rewardLedgerId(rewardKey: string): string {
  return `reward:${rewardKey}`;
}

export function awardCoins(progress: PlayerProgress, input: AwardInput): EconomyResult {
  if (!isValidCoinAmount(input.amount)) return fail(progress, "invalid_amount");
  const id = rewardLedgerId(input.rewardKey);
  if (progress.ledger.some((entry) => entry.id === id)) return fail(progress, "duplicate");
  const credited: PlayerProgress = {
    ...progress,
    coins: progress.coins + input.amount,
    totalEarned: progress.totalEarned + input.amount,
  };
  return {
    ok: true,
    progress: appendLedger(credited, { at: input.now, label: input.label, amount: input.amount, kind: input.kind }, id),
  };
}

export function transferToSavings(progress: PlayerProgress, amount: number, now: string): EconomyResult {
  if (!isValidCoinAmount(amount)) return fail(progress, "invalid_amount");
  if (amount > progress.coins) return fail(progress, "insufficient_funds");
  const moved: PlayerProgress = { ...progress, coins: progress.coins - amount, savings: progress.savings + amount };
  const withNote = appendLedger(moved, {
    at: now,
    label: `Moved to ${progress.savingsGoalName} jar`,
    amount: -amount,
    kind: "savings-transfer",
  });
  return { ok: true, progress: awardGoalBadge(progress, withNote, now) };
}

export function withdrawFromSavings(progress: PlayerProgress, amount: number, now: string): EconomyResult {
  if (!isValidCoinAmount(amount)) return fail(progress, "invalid_amount");
  if (amount > progress.savings) return fail(progress, "insufficient_savings");
  const moved: PlayerProgress = { ...progress, coins: progress.coins + amount, savings: progress.savings - amount };
  return {
    ok: true,
    progress: appendLedger(moved, {
      at: now,
      label: `Took out of ${progress.savingsGoalName} jar`,
      amount,
      kind: "savings-withdraw",
    }),
  };
}

/** Spends wallet coins on a supported in-game activity. Spent coins leave the economy. */
export function spendCoins(progress: PlayerProgress, amount: number, label: string, now: string): EconomyResult {
  if (!isValidCoinAmount(amount)) return fail(progress, "invalid_amount");
  if (amount > progress.coins) return fail(progress, "insufficient_funds");
  const spent: PlayerProgress = { ...progress, coins: progress.coins - amount, totalSpent: progress.totalSpent + amount };
  return { ok: true, progress: appendLedger(spent, { at: now, label, amount: -amount, kind: "spend" }) };
}

/**
 * Changes the goal name and target. Savings stay where they are, so a bigger
 * target leaves more to save and a smaller one may finish the goal.
 */
export function setSavingsGoal(progress: PlayerProgress, name: string, target: number): EconomyResult {
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > 60) return fail(progress, "invalid_goal");
  if (!Number.isSafeInteger(target) || target < 1 || target > MAX_GOAL_TARGET) return fail(progress, "invalid_goal");
  return { ok: true, progress: { ...progress, savingsGoalName: trimmed, savingsGoalTarget: target } };
}

/** First time actual savings reach the goal: one badge and a one-time XP bump. */
function awardGoalBadge(before: PlayerProgress, after: PlayerProgress, now: string): PlayerProgress {
  const wasComplete = savingsProgress(before.savings, before.savingsGoalTarget).complete;
  const isComplete = savingsProgress(after.savings, after.savingsGoalTarget).complete;
  if (wasComplete || !isComplete) return after;
  if (after.badges.some((badge) => badge.id === "goal-getter")) return after;
  const badge: Badge = {
    id: "goal-getter",
    name: "Goal Getter",
    description: `You saved all ${after.savingsGoalTarget} game coins for ${after.savingsGoalName}.`,
    earnedAt: now,
  };
  return { ...after, xp: after.xp + GOAL_BADGE_XP, badges: [...after.badges, badge] };
}

export type WalletSummary = {
  wallet: number;
  savings: number;
  totalEarned: number;
  totalSpent: number;
  goal: ReturnType<typeof savingsProgress>;
  /** The most one transfer can move right now. It is the wallet, not the goal. */
  maxTransfer: number;
  maxWithdraw: number;
};

export function summarize(progress: PlayerProgress): WalletSummary {
  return {
    wallet: progress.coins,
    savings: progress.savings,
    totalEarned: progress.totalEarned,
    totalSpent: progress.totalSpent,
    goal: savingsProgress(progress.savings, progress.savingsGoalTarget),
    maxTransfer: progress.coins,
    maxWithdraw: progress.savings,
  };
}

/** Why a save of this size is unavailable, or null when it could run. */
export function transferBlockedReason(progress: PlayerProgress, amount: number): string | null {
  if (progress.coins === 0) return "Your wallet is empty. Finish a mission or a lesson quiz to earn game coins.";
  if (amount > progress.coins) return `Your wallet only has ${progress.coins} game coins.`;
  return null;
}

/** Describes the first broken money rule, or null when every rule holds. */
export function checkInvariants(progress: PlayerProgress): string | null {
  if (!Number.isSafeInteger(progress.coins) || progress.coins < 0) return "wallet must be a whole number of at least 0";
  if (!Number.isSafeInteger(progress.savings) || progress.savings < 0) return "savings must be a whole number of at least 0";
  if (progress.coins + progress.savings + progress.totalSpent !== progress.totalEarned) {
    return "wallet + savings + spent must equal total earned";
  }
  const last = progress.ledger.at(-1);
  if (last && last.balanceAfter !== progress.coins) return "latest note must match the wallet";
  return null;
}
