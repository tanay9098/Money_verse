import { applyCoins, transferToSavings } from "@/lib/finance";
import type { Badge, LedgerEntry, MissionRecord, PlayerProgress, Rewards, Stars } from "@/lib/types";

export const PROGRESS_VERSION = 1 as const;
export const STORAGE_KEY = "moneyverse.progress.v1";
export const SAVINGS_GOAL_NAME = "Town bicycle";
export const SAVINGS_GOAL_TARGET = 150;
export const WELCOME_COINS = 20;
const MAX_LEDGER = 40;
const MAX_BADGES = 24;

const LEDGER_KINDS = new Set<LedgerEntry["kind"]>(["welcome", "mission-reward", "savings-transfer"]);

export function createFreshProgress(now = new Date().toISOString()): PlayerProgress {
  return {
    version: PROGRESS_VERSION,
    coins: WELCOME_COINS,
    xp: 0,
    savings: 0,
    savingsGoalName: SAVINGS_GOAL_NAME,
    savingsGoalTarget: SAVINGS_GOAL_TARGET,
    badges: [],
    missions: {},
    ledger: [
      {
        id: "welcome",
        at: now,
        label: "Starter pack of fictional game coins",
        amount: WELCOME_COINS,
        balanceAfter: WELCOME_COINS,
        kind: "welcome",
      },
    ],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 160;
}

function isIsoLike(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 40;
}

function isStars(value: unknown): value is Stars {
  return value === 1 || value === 2 || value === 3;
}

function parseBadge(value: unknown): Badge | null {
  if (!isRecord(value)) return null;
  if (!isNonEmptyString(value.id) || !isNonEmptyString(value.name) || !isNonEmptyString(value.description)) {
    return null;
  }
  if (!isIsoLike(value.earnedAt)) return null;
  return {
    id: value.id,
    name: value.name,
    description: value.description,
    earnedAt: value.earnedAt,
  };
}

function parseMissionRecord(value: unknown): MissionRecord | null {
  if (!isRecord(value)) return null;
  if (!Number.isInteger(value.completions) || (value.completions as number) < 0) return null;
  if (!Number.isInteger(value.lastQuizCorrect) || (value.lastQuizCorrect as number) < 0) return null;
  if (!isStars(value.bestStars) || !isIsoLike(value.lastPlayedAt)) return null;
  return {
    completions: value.completions as number,
    bestStars: value.bestStars,
    lastQuizCorrect: value.lastQuizCorrect as number,
    lastPlayedAt: value.lastPlayedAt,
  };
}

function parseLedger(value: unknown): LedgerEntry | null {
  if (!isRecord(value)) return null;
  if (!isNonEmptyString(value.id) || !isNonEmptyString(value.label) || !isIsoLike(value.at)) return null;
  if (!Number.isInteger(value.amount) || !Number.isInteger(value.balanceAfter)) return null;
  if ((value.balanceAfter as number) < 0) return null;
  if (typeof value.kind !== "string" || !LEDGER_KINDS.has(value.kind as LedgerEntry["kind"])) return null;
  return {
    id: value.id,
    at: value.at,
    label: value.label,
    amount: value.amount as number,
    balanceAfter: value.balanceAfter as number,
    kind: value.kind as LedgerEntry["kind"],
  };
}

export function parseProgress(raw: unknown): { progress: PlayerProgress; recovered: boolean } {
  if (!isRecord(raw) || raw.version !== PROGRESS_VERSION) {
    return { progress: createFreshProgress(), recovered: true };
  }
  if (!Number.isInteger(raw.coins) || (raw.coins as number) < 0) {
    return { progress: createFreshProgress(), recovered: true };
  }
  if (!Number.isInteger(raw.xp) || (raw.xp as number) < 0) {
    return { progress: createFreshProgress(), recovered: true };
  }
  if (!Number.isInteger(raw.savings) || (raw.savings as number) < 0) {
    return { progress: createFreshProgress(), recovered: true };
  }
  if (!Number.isInteger(raw.savingsGoalTarget) || (raw.savingsGoalTarget as number) <= 0) {
    return { progress: createFreshProgress(), recovered: true };
  }
  if (!isNonEmptyString(raw.savingsGoalName)) {
    return { progress: createFreshProgress(), recovered: true };
  }
  if (!Array.isArray(raw.badges) || !Array.isArray(raw.ledger) || !isRecord(raw.missions)) {
    return { progress: createFreshProgress(), recovered: true };
  }
  if (raw.badges.length > MAX_BADGES || raw.ledger.length > 200 || Object.keys(raw.missions).length > 40) {
    return { progress: createFreshProgress(), recovered: true };
  }

  const badges = raw.badges.map(parseBadge).filter((badge): badge is Badge => badge !== null);
  const ledger = raw.ledger.map(parseLedger).filter((entry): entry is LedgerEntry => entry !== null);
  const missions: Record<string, MissionRecord> = {};
  for (const [key, value] of Object.entries(raw.missions)) {
    if (!/^[a-z0-9-]{1,80}$/.test(key)) continue;
    const record = parseMissionRecord(value);
    if (record) missions[key] = record;
  }

  const dropped =
    badges.length !== raw.badges.length ||
    ledger.length !== raw.ledger.length ||
    Object.keys(missions).length !== Object.keys(raw.missions).length;

  return {
    recovered: dropped,
    progress: {
      version: PROGRESS_VERSION,
      coins: raw.coins as number,
      xp: raw.xp as number,
      savings: raw.savings as number,
      savingsGoalName: raw.savingsGoalName,
      savingsGoalTarget: raw.savingsGoalTarget as number,
      badges,
      missions,
      ledger: ledger.slice(-MAX_LEDGER),
    },
  };
}

export function readStoredProgress(raw: string | null): { progress: PlayerProgress; recovered: boolean } {
  if (!raw) return { progress: createFreshProgress(), recovered: false };
  try {
    return parseProgress(JSON.parse(raw) as unknown);
  } catch {
    return { progress: createFreshProgress(), recovered: true };
  }
}

function withLedger(progress: PlayerProgress, entry: LedgerEntry): PlayerProgress {
  return {
    ...progress,
    ledger: [...progress.ledger, entry].slice(-MAX_LEDGER),
  };
}

export function moveCoinsToSavings(
  progress: PlayerProgress,
  amount: number,
  now = new Date().toISOString(),
): { ok: true; progress: PlayerProgress } | { ok: false; reason: "insufficient_funds" | "invalid_amount"; progress: PlayerProgress } {
  const moved = transferToSavings(progress.coins, progress.savings, amount, progress.savingsGoalTarget);
  if (!moved.ok) return { ok: false, reason: moved.reason, progress };
  const next = withLedger(
    {
      ...progress,
      coins: moved.wallet,
      savings: moved.saved,
    },
    {
      id: `save-${now}-${amount}`,
      at: now,
      label: `Moved to ${progress.savingsGoalName} jar`,
      amount: -amount,
      balanceAfter: moved.wallet,
      kind: "savings-transfer",
    },
  );
  return { ok: true, progress: next };
}

export function grantMissionReward(
  progress: PlayerProgress,
  input: {
    slug: string;
    stars: Stars;
    rewards: Rewards;
    quizCorrect: number;
    now: string;
  },
): { progress: PlayerProgress; coinsAwarded: number; xpAwarded: number; badgeEarned: boolean } {
  const previous = progress.missions[input.slug];
  const firstClear = !previous || previous.completions === 0;
  const coinsAwarded = firstClear ? input.rewards.coins : 0;
  const quizXp = Math.max(0, input.quizCorrect) * 5;
  const xpAwarded = firstClear ? input.rewards.xp + quizXp : 15 + quizXp;
  const deposited = applyCoins(progress.coins, coinsAwarded);
  const coins = deposited.ok ? deposited.balance : progress.coins;
  const alreadyBadged = progress.badges.some((badge) => badge.id === input.rewards.badgeId);
  const badgeEarned = firstClear && !alreadyBadged;
  const badges = badgeEarned
    ? [
        ...progress.badges,
        {
          id: input.rewards.badgeId,
          name: input.rewards.badgeName,
          description: input.rewards.badgeDescription,
          earnedAt: input.now,
        },
      ]
    : progress.badges;

  let next: PlayerProgress = {
    ...progress,
    coins,
    xp: progress.xp + xpAwarded,
    badges,
    missions: {
      ...progress.missions,
      [input.slug]: {
        completions: (previous?.completions ?? 0) + 1,
        bestStars: Math.max(previous?.bestStars ?? 1, input.stars) as Stars,
        lastQuizCorrect: input.quizCorrect,
        lastPlayedAt: input.now,
      },
    },
  };

  if (coinsAwarded > 0) {
    next = withLedger(next, {
      id: `reward-${input.slug}-${input.now}`,
      at: input.now,
      label: `${input.rewards.badgeName} reward`,
      amount: coinsAwarded,
      balanceAfter: coins,
      kind: "mission-reward",
    });
  }

  return { progress: next, coinsAwarded, xpAwarded, badgeEarned };
}
