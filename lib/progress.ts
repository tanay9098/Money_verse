import { awardCoins, MAX_LEDGER, transferToSavings } from "@/lib/economy";
import type {
  Badge,
  LedgerEntry,
  Lesson,
  LessonRecord,
  MissionRecord,
  PlayerProgress,
  Rewards,
  Stars,
} from "@/lib/types";

export const PROGRESS_VERSION = 1 as const;
export const STORAGE_KEY = "moneyverse.progress.v1";
export const SAVINGS_GOAL_NAME = "Town bicycle";
export const SAVINGS_GOAL_TARGET = 150;
export const WELCOME_COINS = 20;
const MAX_BADGES = 24;

const MAX_LESSONS = 60;

const LEDGER_KINDS = new Set<LedgerEntry["kind"]>([
  "welcome",
  "mission-reward",
  "lesson-reward",
  "savings-transfer",
  "savings-withdraw",
  "spend",
]);

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
    lessons: {},
    totalEarned: WELCOME_COINS,
    totalSpent: 0,
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

function parseLessonRecord(value: unknown): LessonRecord | null {
  if (!isRecord(value)) return null;
  if (typeof value.completed !== "boolean") return null;
  if (!Number.isInteger(value.attempts) || (value.attempts as number) < 0) return null;
  if (!Number.isInteger(value.bestCorrect) || (value.bestCorrect as number) < 0) return null;
  if (!Number.isInteger(value.total) || (value.total as number) < 0) return null;
  if ((value.bestCorrect as number) > (value.total as number)) return null;
  if (!isIsoLike(value.lastPlayedAt)) return null;
  if (!(value.completedAt === null || isIsoLike(value.completedAt))) return null;
  if (value.completed && value.completedAt === null) return null;
  return {
    completed: value.completed,
    attempts: value.attempts as number,
    bestCorrect: value.bestCorrect as number,
    total: value.total as number,
    lastPlayedAt: value.lastPlayedAt,
    completedAt: value.completedAt as string | null,
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

  const rawLessons = isRecord(raw.lessons) ? raw.lessons : {};
  if (Object.keys(rawLessons).length > MAX_LESSONS) {
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

  const lessons: Record<string, LessonRecord> = {};
  for (const [key, value] of Object.entries(rawLessons)) {
    if (!/^[a-z0-9-]{1,80}$/.test(key)) continue;
    const record = parseLessonRecord(value);
    if (record) lessons[key] = record;
  }

  // Saves made before totals existed have no spending, so everything held was earned.
  const totalSpent = Number.isInteger(raw.totalSpent) && (raw.totalSpent as number) >= 0 ? (raw.totalSpent as number) : 0;
  const totalEarned = (raw.coins as number) + (raw.savings as number) + totalSpent;

  const dropped =
    Object.keys(lessons).length !== Object.keys(rawLessons).length ||
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
      lessons,
      totalEarned,
      totalSpent,
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

export function moveCoinsToSavings(
  progress: PlayerProgress,
  amount: number,
  now = new Date().toISOString(),
): { ok: true; progress: PlayerProgress } | { ok: false; reason: "insufficient_funds" | "invalid_amount"; progress: PlayerProgress } {
  const moved = transferToSavings(progress, amount, now);
  if (!moved.ok) {
    return { ok: false, reason: moved.reason === "insufficient_funds" ? "insufficient_funds" : "invalid_amount", progress };
  }
  return { ok: true, progress: moved.progress };
}

function withBadge(progress: PlayerProgress, badge: Badge): PlayerProgress {
  if (progress.badges.some((existing) => existing.id === badge.id)) return progress;
  return { ...progress, badges: [...progress.badges, badge] };
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
  const quizXp = Math.max(0, input.quizCorrect) * 5;
  const xpAwarded = firstClear ? input.rewards.xp + quizXp : 15 + quizXp;

  let next = progress;
  let coinsAwarded = 0;
  if (firstClear && input.rewards.coins > 0) {
    const paid = awardCoins(progress, {
      amount: input.rewards.coins,
      label: `${input.rewards.badgeName} reward`,
      kind: "mission-reward",
      rewardKey: `mission:${input.slug}`,
      now: input.now,
    });
    if (paid.ok) {
      next = paid.progress;
      coinsAwarded = input.rewards.coins;
    }
  }

  const badgeEarned = firstClear && !next.badges.some((badge) => badge.id === input.rewards.badgeId);
  if (badgeEarned) {
    next = withBadge(next, {
      id: input.rewards.badgeId,
      name: input.rewards.badgeName,
      description: input.rewards.badgeDescription,
      earnedAt: input.now,
    });
  }

  next = {
    ...next,
    xp: next.xp + xpAwarded,
    missions: {
      ...next.missions,
      [input.slug]: {
        completions: (previous?.completions ?? 0) + 1,
        bestStars: Math.max(previous?.bestStars ?? 1, input.stars) as Stars,
        lastQuizCorrect: input.quizCorrect,
        lastPlayedAt: input.now,
      },
    },
  };

  return { progress: next, coinsAwarded, xpAwarded, badgeEarned };
}

export function lessonPassMark(lesson: Pick<Lesson, "quiz" | "passPercent">): number {
  return Math.ceil((lesson.quiz.length * lesson.passPercent) / 100);
}

export type LessonGrant = {
  progress: PlayerProgress;
  passed: boolean;
  /** True only on the attempt that completes the lesson for the first time. */
  firstCompletion: boolean;
  coinsAwarded: number;
  xpAwarded: number;
  correct: number;
  total: number;
};

/**
 * Records one quiz attempt. A lesson without a quiz completes when read.
 * Coins and XP are paid once, on the first passing attempt, and never again.
 */
export function recordLessonAttempt(
  progress: PlayerProgress,
  lesson: Lesson,
  answers: Record<string, string>,
  now: string,
): LessonGrant {
  const total = lesson.quiz.length;
  const correct = lesson.quiz.filter((question) =>
    question.choices.some((choice) => choice.correct && choice.id === answers[question.id]),
  ).length;
  const passed = correct >= lessonPassMark(lesson);
  const previous = progress.lessons[lesson.slug];
  const firstCompletion = passed && !previous?.completed;

  let next = progress;
  let coinsAwarded = 0;
  let xpAwarded = 0;
  if (firstCompletion && lesson.rewards) {
    xpAwarded = lesson.rewards.xp;
    if (lesson.rewards.coins > 0) {
      const paid = awardCoins(next, {
        amount: lesson.rewards.coins,
        label: `${lesson.title} lesson reward`,
        kind: "lesson-reward",
        rewardKey: `lesson:${lesson.slug}`,
        now,
      });
      if (paid.ok) {
        next = paid.progress;
        coinsAwarded = lesson.rewards.coins;
      }
    }
  }

  const record: LessonRecord = {
    completed: Boolean(previous?.completed) || passed,
    attempts: (previous?.attempts ?? 0) + 1,
    bestCorrect: Math.max(previous?.bestCorrect ?? 0, correct),
    total,
    lastPlayedAt: now,
    completedAt: previous?.completedAt ?? (passed ? now : null),
  };
  next = { ...next, xp: next.xp + xpAwarded, lessons: { ...next.lessons, [lesson.slug]: record } };
  return { progress: next, passed, firstCompletion, coinsAwarded, xpAwarded, correct, total };
}
