import { acceptProgress, type LocalEnvelope, type ProgressIntent } from "@/lib/progress-cache";
import type { LessonRecord, MissionRecord, PlayerProgress } from "@/lib/types";

export type CloudRecord = {
  progress: PlayerProgress;
  revision: number;
  updatedAt: string;
  lastMutationId: string | null;
};

export type WriteRequest = {
  progress: PlayerProgress;
  baseRevision: number | null;
  mutationId: string;
  intent: ProgressIntent;
};

export type WriteDecision =
  | { type: "unchanged"; record: CloudRecord; conflict: boolean; note: string | null }
  | { type: "write"; record: CloudRecord; conflict: boolean; note: string | null }
  | { type: "reject"; record: CloudRecord; conflict: boolean; note: string | null };

const MUTATION_ID = /^[A-Za-z0-9_-]{8,80}$/;

export function normalizeWriteRequest(raw: unknown): WriteRequest | null {
  if (!isRecord(raw)) return null;
  if (raw.intent !== "save" && raw.intent !== "reset") return null;
  if (typeof raw.mutationId !== "string" || !MUTATION_ID.test(raw.mutationId)) return null;
  if (!(raw.baseRevision === null || (Number.isInteger(raw.baseRevision) && (raw.baseRevision as number) >= 0))) return null;
  const progress = acceptProgress(raw.progress);
  if (!progress) return null;
  return {
    progress,
    baseRevision: raw.baseRevision as number | null,
    mutationId: raw.mutationId,
    intent: raw.intent,
  };
}

/**
 * Cloud wallet wins when two devices diverge. Mission completion is combined by
 * the higher count and star total, without adding the other device's coins again.
 */
export function decideWrite(remote: CloudRecord | null, input: WriteRequest, now: string): WriteDecision {
  const requested = input;
  if (remote && remote.lastMutationId === requested.mutationId) {
    return { type: "unchanged", record: remote, conflict: false, note: null };
  }

  if (!remote) {
    return {
      type: "write",
      conflict: false,
      note: null,
      record: {
        progress: requested.progress,
        revision: 1,
        updatedAt: now,
        lastMutationId: input.mutationId,
      },
    };
  }

  if (requested.baseRevision === remote.revision) {
    return {
      type: "write",
      conflict: false,
      note: null,
      record: {
        progress: requested.progress,
        revision: remote.revision + 1,
        updatedAt: now,
        lastMutationId: input.mutationId,
      },
    };
  }

  if (requested.intent === "reset") {
    return {
      type: "reject",
      record: remote,
      conflict: true,
      note: "A newer cloud save was kept. This device's reset was not applied to the cloud save.",
    };
  }

  const merged = mergeMissionRecords(remote.progress, requested.progress);
  const walletDiverged = !sameWallet(remote.progress, requested.progress);
  if (!merged.changed) {
    return {
      type: "reject",
      record: remote,
      conflict: walletDiverged,
      note: walletDiverged
        ? "A newer cloud save was kept. Coin changes on this device were not added to the cloud wallet."
        : null,
    };
  }

  return {
    type: "write",
    conflict: walletDiverged,
    note: walletDiverged
      ? "Mission progress was combined. The cloud wallet was kept, and this device's coin changes were not added on top."
      : "Mission progress from this device was combined with the cloud save.",
    record: {
      progress: merged.progress,
      revision: remote.revision + 1,
      updatedAt: now,
      lastMutationId: input.mutationId,
    },
  };
}

export type ServerProgressBody = {
  progress: PlayerProgress | null;
  revision: number | null;
  updatedAt: string | null;
  conflict: boolean;
  note: string | null;
};

export function applySyncResponse(local: LocalEnvelope, sentMutationId: string, body: ServerProgressBody, now: string): LocalEnvelope {
  if (!body.progress || body.revision === null) return local;
  const canonical = acceptProgress(body.progress);
  if (!canonical || body.revision < 0) return local;

  if (local.mutationId !== sentMutationId) {
    if (!body.conflict) {
      return { ...local, baseRevision: body.revision, updatedAt: now };
    }
    return local;
  }

  const walletDiverged = body.conflict && !sameWallet(local.progress, canonical);
  return {
    ...local,
    progress: canonical,
    updatedAt: body.updatedAt ?? now,
    baseRevision: body.revision,
    pending: false,
    mutationId: null,
    intent: "save",
    held: walletDiverged ? local.progress : local.held,
  };
}

export function progressEqual(left: PlayerProgress, right: PlayerProgress): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function sameWallet(left: PlayerProgress, right: PlayerProgress): boolean {
  return (
    left.coins === right.coins &&
    left.savings === right.savings &&
    left.xp === right.xp &&
    left.totalEarned === right.totalEarned &&
    left.totalSpent === right.totalSpent &&
    JSON.stringify(left.badges) === JSON.stringify(right.badges) &&
    JSON.stringify(left.ledger) === JSON.stringify(right.ledger)
  );
}

function mergeMissionRecords(remote: PlayerProgress, local: PlayerProgress): { progress: PlayerProgress; changed: boolean } {
  const missions: Record<string, MissionRecord> = { ...remote.missions };
  for (const [slug, record] of Object.entries(local.missions)) {
    const current = missions[slug];
    missions[slug] = !current ? record : preferMission(current, record);
  }
  const lessons: Record<string, LessonRecord> = { ...remote.lessons };
  for (const [slug, record] of Object.entries(local.lessons)) {
    const current = lessons[slug];
    lessons[slug] = !current ? record : preferLesson(current, record);
  }
  const progress: PlayerProgress = { ...remote, missions, lessons };
  const changed =
    JSON.stringify(progress.missions) !== JSON.stringify(remote.missions) ||
    JSON.stringify(progress.lessons) !== JSON.stringify(remote.lessons);
  return { progress, changed };
}

function preferLesson(left: LessonRecord, right: LessonRecord): LessonRecord {
  if (left.completed !== right.completed) return left.completed ? left : right;
  if (left.bestCorrect !== right.bestCorrect) return left.bestCorrect > right.bestCorrect ? left : right;
  if (left.attempts !== right.attempts) return left.attempts > right.attempts ? left : right;
  return left.lastPlayedAt >= right.lastPlayedAt ? left : right;
}

function preferMission(left: MissionRecord, right: MissionRecord): MissionRecord {
  if (left.completions !== right.completions) return left.completions > right.completions ? left : right;
  if (left.bestStars !== right.bestStars) return left.bestStars > right.bestStars ? left : right;
  return left.lastPlayedAt >= right.lastPlayedAt ? left : right;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
