import { parseProgress } from "@/lib/progress";
import type { PlayerProgress } from "@/lib/types";

export const CACHE_VERSION = 1 as const;

export type ProgressIntent = "save" | "reset";

export type LocalEnvelope = {
  version: typeof CACHE_VERSION;
  playerKey: string;
  progress: PlayerProgress;
  updatedAt: string;
  baseRevision: number | null;
  pending: boolean;
  mutationId: string | null;
  intent: ProgressIntent;
  /** Wallet snapshot kept when a cloud conflict could not take these coins. */
  held: PlayerProgress | null;
};

export type KeyValueStore = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export function playerCacheKey(playerKey: string): string {
  return `moneyverse.progress.v1.player.${encodeURIComponent(playerKey)}`;
}

export function shouldRetainCacheOnSignOut(envelope: LocalEnvelope | null): boolean {
  if (!envelope) return false;
  return envelope.pending || envelope.held !== null;
}

export function readPlayerCache(store: KeyValueStore, playerKey: string): { envelope: LocalEnvelope | null; corrupt: boolean } {
  const raw = store.getItem(playerCacheKey(playerKey));
  if (!raw) return { envelope: null, corrupt: false };
  try {
    const parsed = JSON.parse(raw) as unknown;
    const envelope = normalizeEnvelope(parsed, playerKey);
    if (!envelope) return { envelope: null, corrupt: true };
    return { envelope, corrupt: false };
  } catch {
    return { envelope: null, corrupt: true };
  }
}

export function writePlayerCache(store: KeyValueStore, envelope: LocalEnvelope): void {
  store.setItem(playerCacheKey(envelope.playerKey), JSON.stringify(envelope));
}

export function clearPlayerCache(store: KeyValueStore, playerKey: string): void {
  store.removeItem(playerCacheKey(playerKey));
}

function normalizeEnvelope(value: unknown, expectedPlayerKey: string): LocalEnvelope | null {
  if (!isRecord(value) || value.version !== CACHE_VERSION) return null;
  if (value.playerKey !== expectedPlayerKey) return null;
  if (typeof value.updatedAt !== "string" || value.updatedAt.length === 0 || value.updatedAt.length > 40) return null;
  if (typeof value.pending !== "boolean") return null;
  if (value.intent !== "save" && value.intent !== "reset") return null;
  if (!(value.baseRevision === null || (Number.isInteger(value.baseRevision) && (value.baseRevision as number) >= 0))) return null;
  if (!(value.mutationId === null || (typeof value.mutationId === "string" && value.mutationId.length <= 80))) return null;
  const progress = acceptProgress(value.progress);
  if (!progress) return null;
  const held = value.held == null ? null : acceptProgress(value.held);
  if (value.held != null && !held) return null;
  return {
    version: CACHE_VERSION,
    playerKey: expectedPlayerKey,
    progress,
    updatedAt: value.updatedAt,
    baseRevision: value.baseRevision as number | null,
    pending: value.pending,
    mutationId: value.mutationId as string | null,
    intent: value.intent,
    held,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Accept a progress snapshot. Invalid documents are rejected instead of replaced with a fresh wallet. */
export function acceptProgress(raw: unknown): PlayerProgress | null {
  if (!isRecord(raw) || raw.version !== 1) return null;
  if (!Number.isInteger(raw.coins) || (raw.coins as number) < 0) return null;
  if (!Number.isInteger(raw.xp) || (raw.xp as number) < 0) return null;
  if (!Number.isInteger(raw.savings) || (raw.savings as number) < 0) return null;
  if (!Number.isInteger(raw.savingsGoalTarget) || (raw.savingsGoalTarget as number) <= 0) return null;
  if (typeof raw.savingsGoalName !== "string" || raw.savingsGoalName.trim().length === 0 || raw.savingsGoalName.length > 160) {
    return null;
  }
  if (!Array.isArray(raw.badges) || !Array.isArray(raw.ledger) || !isRecord(raw.missions)) return null;
  if (raw.badges.length > 24 || raw.ledger.length > 200 || Object.keys(raw.missions).length > 40) return null;
  if (raw.lessons !== undefined && (!isRecord(raw.lessons) || Object.keys(raw.lessons).length > 60)) return null;
  return parseProgress(raw).progress;
}
