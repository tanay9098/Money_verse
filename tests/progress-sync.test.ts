import { describe, expect, it } from "vitest";
import { createFreshProgress, grantMissionReward, STORAGE_KEY } from "@/lib/progress";
import { demoMissions } from "@/lib/content/demo";
import {
  clearPlayerCache,
  playerCacheKey,
  readPlayerCache,
  shouldRetainCacheOnSignOut,
  writePlayerCache,
  type KeyValueStore,
  type LocalEnvelope,
} from "@/lib/progress-cache";
import { progressDocumentId } from "@/lib/progress-document-id";
import { playerKeyFromGoogleSub, playerKeyFromSession } from "@/lib/player-identity";
import { applySyncResponse, decideWrite, normalizeWriteRequest, progressEqual } from "@/lib/progress-sync";
import type { PlayerProgress } from "@/lib/types";

const mission = demoMissions[0];
const playerKey = "google:1234567890";

function memoryStore(seed: Record<string, string> = {}): KeyValueStore & { data: Record<string, string> } {
  const data = { ...seed };
  return {
    data,
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = value;
    },
    removeItem: (key) => {
      delete data[key];
    },
  };
}

function envelope(progress: PlayerProgress, patch: Partial<LocalEnvelope> = {}): LocalEnvelope {
  return {
    version: 1,
    playerKey,
    progress,
    updatedAt: "2026-01-02T00:00:00.000Z",
    baseRevision: 1,
    pending: true,
    mutationId: "mutation-1",
    intent: "save",
    held: null,
    ...patch,
  };
}

describe("player identity", () => {
  it("uses the Google subject and ignores a display name", () => {
    expect(playerKeyFromGoogleSub("1234567890")).toBe("google:1234567890");
    expect(playerKeyFromGoogleSub("same-sub")).toBe(playerKeyFromGoogleSub("same-sub"));
    expect(playerKeyFromGoogleSub("")).toBeNull();
    expect(playerKeyFromGoogleSub("has space")).toBeNull();
    expect(playerKeyFromGoogleSub("pip@example.com")).toBeNull();
    expect(playerKeyFromSession({ user: { id: "1234567890" } })).toBe("google:1234567890");
    expect(playerKeyFromSession(null)).toBeNull();
  });

  it("keeps the guest storage key and isolates signed-in caches", () => {
    expect(STORAGE_KEY).toBe("moneyverse.progress.v1");
    const store = memoryStore();
    const local = envelope(createFreshProgress("2026-01-01T00:00:00.000Z"));
    writePlayerCache(store, local);
    expect(store.data[STORAGE_KEY]).toBeUndefined();
    expect(readPlayerCache(store, "google:other").envelope).toBeNull();
    expect(readPlayerCache(store, "google:other").corrupt).toBe(false);
    expect(readPlayerCache(store, playerKey).envelope?.progress.coins).toBe(20);
  });

  it("drops a synced cache on sign-out and keeps an unsynced or held one", () => {
    expect(shouldRetainCacheOnSignOut(null)).toBe(false);
    expect(shouldRetainCacheOnSignOut(envelope(createFreshProgress(), { pending: false }))).toBe(false);
    expect(shouldRetainCacheOnSignOut(envelope(createFreshProgress(), { pending: true }))).toBe(true);
    const held = envelope(createFreshProgress(), { pending: false, held: createFreshProgress() });
    expect(shouldRetainCacheOnSignOut(held)).toBe(true);
    const store = memoryStore();
    writePlayerCache(store, envelope(createFreshProgress(), { pending: false }));
    clearPlayerCache(store, playerKey);
    expect(readPlayerCache(store, playerKey).envelope).toBeNull();
  });

  it("rejects another player's envelope stored under this key", () => {
    const store = memoryStore();
    store.setItem(
      playerCacheKey(playerKey),
      JSON.stringify({ ...envelope(createFreshProgress()), playerKey: "google:other" }),
    );
    expect(readPlayerCache(store, playerKey)).toEqual({ envelope: null, corrupt: true });
  });
});

describe("cloud progress decisions", () => {
  it("creates a document id from the player key and ignores request identity fields", () => {
    expect(progressDocumentId(playerKey)).toBe(progressDocumentId(playerKey));
    expect(progressDocumentId(playerKey)).not.toBe(progressDocumentId("google:other"));
    expect(progressDocumentId(playerKey).startsWith("drafts.playerProgress.")).toBe(true);

    const progress = createFreshProgress("2026-01-01T00:00:00.000Z");
    const request = normalizeWriteRequest({
      progress,
      baseRevision: null,
      mutationId: "mutation-1",
      intent: "save",
      playerKey: "google:other",
    });
    expect(request?.progress.coins).toBe(20);
    expect(request && "playerKey" in request).toBe(false);
    expect(normalizeWriteRequest({ progress: { version: 1, coins: -1 }, baseRevision: null, mutationId: "mutation-1", intent: "save" })).toBeNull();
  });

  it("retries the same mutation without writing twice", () => {
    const progress = createFreshProgress("2026-01-01T00:00:00.000Z");
    const created = decideWrite(null, { progress, baseRevision: null, mutationId: "mutation-1", intent: "save" }, "2026-01-02T00:00:00.000Z");
    expect(created.type).toBe("write");
    if (created.type !== "write") return;
    const again = decideWrite(created.record, { progress, baseRevision: 1, mutationId: "mutation-1", intent: "save" }, "2026-01-03T00:00:00.000Z");
    expect(again.type).toBe("unchanged");
    if (again.type !== "unchanged") return;
    expect(again.record.revision).toBe(1);
    expect(progressEqual(again.record.progress, progress)).toBe(true);
  });

  it("accepts a successor and keeps the cloud wallet when devices diverge", () => {
    const base = createFreshProgress("2026-01-01T00:00:00.000Z");
    const rewarded = grantMissionReward(base, {
      slug: mission.slug,
      stars: 2,
      rewards: mission.rewards,
      quizCorrect: 1,
      now: "2026-01-02T00:00:00.000Z",
    }).progress;
    const remote = { progress: base, revision: 2, updatedAt: "2026-01-02T00:00:00.000Z", lastMutationId: "older" };
    const saved = decideWrite(remote, { progress: rewarded, baseRevision: 2, mutationId: "mutation-2", intent: "save" }, "2026-01-03T00:00:00.000Z");
    expect(saved.type).toBe("write");
    if (saved.type !== "write") return;
    expect(saved.record.progress.coins).toBe(rewarded.coins);
    expect(saved.conflict).toBe(false);

    const otherDevice = grantMissionReward(base, {
      slug: demoMissions[1].slug,
      stars: 3,
      rewards: demoMissions[1].rewards,
      quizCorrect: 0,
      now: "2026-01-04T00:00:00.000Z",
    }).progress;
    const conflict = decideWrite(
      { progress: rewarded, revision: 3, updatedAt: "2026-01-03T00:00:00.000Z", lastMutationId: "mutation-2" },
      { progress: otherDevice, baseRevision: 2, mutationId: "mutation-3", intent: "save" },
      "2026-01-05T00:00:00.000Z",
    );
    expect(conflict.type).toBe("write");
    if (conflict.type !== "write") return;
    expect(conflict.conflict).toBe(true);
    expect(conflict.record.progress.coins).toBe(rewarded.coins);
    expect(conflict.record.progress.missions[mission.slug]?.completions).toBe(1);
    expect(conflict.record.progress.missions[demoMissions[1].slug]?.completions).toBe(1);
    expect(conflict.record.progress.coins).not.toBe(otherDevice.coins);
  });

  it("does not apply a reset over a newer cloud save", () => {
    const remote = {
      progress: createFreshProgress("2026-01-01T00:00:00.000Z"),
      revision: 4,
      updatedAt: "2026-01-04T00:00:00.000Z",
      lastMutationId: "mutation-4",
    };
    remote.progress = { ...remote.progress, coins: 40 };
    const decision = decideWrite(
      remote,
      { progress: createFreshProgress("2026-01-05T00:00:00.000Z"), baseRevision: 3, mutationId: "mutation-5", intent: "reset" },
      "2026-01-05T00:00:00.000Z",
    );
    expect(decision.type).toBe("reject");
    expect(decision.conflict).toBe(true);
    expect(decision.record.progress.coins).toBe(40);
  });

  it("keeps a newer local edit when an older response returns", () => {
    const older = createFreshProgress("2026-01-01T00:00:00.000Z");
    const newer = { ...older, coins: 15, savings: 5 };
    const local = envelope(newer, { mutationId: "mutation-new", baseRevision: 1 });
    const next = applySyncResponse(
      local,
      "mutation-old",
      { progress: older, revision: 2, updatedAt: "2026-01-02T00:00:00.000Z", conflict: false, note: null },
      "2026-01-02T00:00:01.000Z",
    );
    expect(next.progress.coins).toBe(15);
    expect(next.pending).toBe(true);
    expect(next.baseRevision).toBe(2);

    const applied = applySyncResponse(
      local,
      "mutation-new",
      {
        progress: older,
        revision: 3,
        updatedAt: "2026-01-02T00:00:02.000Z",
        conflict: true,
        note: "A newer cloud save was kept.",
      },
      "2026-01-02T00:00:03.000Z",
    );
    expect(applied.pending).toBe(false);
    expect(applied.progress.coins).toBe(20);
    expect(applied.held?.coins).toBe(15);
  });
});
