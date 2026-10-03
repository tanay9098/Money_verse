"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { useSession } from "next-auth/react";
import {
  clearPlayerCache,
  readPlayerCache,
  shouldRetainCacheOnSignOut,
  writePlayerCache,
  type LocalEnvelope,
} from "@/lib/progress-cache";
import { createFreshProgress, readStoredProgress, STORAGE_KEY, WELCOME_COINS } from "@/lib/progress";
import {
  applySyncResponse,
  progressEqual,
  type ServerProgressBody,
} from "@/lib/progress-sync";
import type { PlayerProgress } from "@/lib/types";

export type SyncPhase = "guest" | "checking" | "idle" | "synced" | "pending" | "offline" | "unavailable" | "conflict";

type ProgressApi = {
  ready: boolean;
  recovered: boolean;
  progress: PlayerProgress | null;
  signedIn: boolean;
  syncPhase: SyncPhase;
  syncNote: string | null;
  save: (next: PlayerProgress) => void;
  reset: () => void;
  dismissHeld: () => void;
  prepareSignOut: () => Promise<void>;
};

type Snapshot = {
  ready: boolean;
  recovered: boolean;
  progress: PlayerProgress | null;
  syncPhase: SyncPhase;
  syncNote: string | null;
  held: boolean;
};

const SERVER_SNAPSHOT: Snapshot = {
  ready: false,
  recovered: false,
  progress: null,
  syncPhase: "checking",
  syncNote: null,
  held: false,
};

let snapshot: Snapshot = SERVER_SNAPSHOT;
let activeScope = "pending";
const listeners = new Set<() => void>();
let syncChain: Promise<void> = Promise.resolve();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function browserStore() {
  return window.localStorage;
}

function publish(scope: string, next: Snapshot) {
  activeScope = scope;
  snapshot = next;
  emit();
}

function guestSnapshot(): Snapshot {
  const existing = window.localStorage.getItem(STORAGE_KEY);
  const stored = readStoredProgress(existing);
  if (stored.recovered || existing === null) {
    const serialized = JSON.stringify(stored.progress);
    queueMicrotask(() => {
      if (activeScope === "guest") window.localStorage.setItem(STORAGE_KEY, serialized);
    });
  }
  return {
    ready: true,
    recovered: stored.recovered,
    progress: stored.progress,
    syncPhase: "guest",
    syncNote: null,
    held: false,
  };
}

function playerSnapshot(playerKey: string): Snapshot {
  const stored = readPlayerCache(browserStore(), playerKey);
  if (!stored.envelope) {
    return {
      ready: false,
      recovered: stored.corrupt,
      progress: null,
      syncPhase: "checking",
      syncNote: stored.corrupt ? "The saved game on this device could not be read. Checking the cloud save." : null,
      held: false,
    };
  }
  return snapshotFromEnvelope(stored.envelope, false);
}

function snapshotFromEnvelope(envelope: LocalEnvelope, recovered: boolean): Snapshot {
  let syncPhase: SyncPhase = "synced";
  if (envelope.held) syncPhase = "conflict";
  else if (envelope.pending) syncPhase = typeof navigator !== "undefined" && navigator.onLine === false ? "offline" : "pending";
  return {
    ready: true,
    recovered,
    progress: envelope.progress,
    syncPhase,
    syncNote: envelope.held ? HELD_NOTE : null,
    held: envelope.held !== null,
  };
}

const HELD_NOTE = "A newer cloud save is showing. Coin changes from this device were kept aside in this browser and were not added to the cloud wallet.";

function selectSnapshot(scope: string): Snapshot {
  if (scope === "pending") return SERVER_SNAPSHOT;
  if (snapshot !== SERVER_SNAPSHOT && activeScope === scope) return snapshot;
  const next = scope === "guest" ? guestSnapshot() : playerSnapshot(scope);
  activeScope = scope;
  snapshot = next;
  return snapshot;
}

function commitGuest(progress: PlayerProgress, recovered: boolean) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  publish("guest", {
    ready: true,
    recovered,
    progress,
    syncPhase: "guest",
    syncNote: null,
    held: false,
  });
}

function commitPlayer(playerKey: string, progress: PlayerProgress, intent: LocalEnvelope["intent"]) {
  const existing = readPlayerCache(browserStore(), playerKey).envelope;
  const envelope: LocalEnvelope = {
    version: 1,
    playerKey,
    progress,
    updatedAt: new Date().toISOString(),
    baseRevision: existing?.baseRevision ?? null,
    pending: true,
    mutationId: crypto.randomUUID(),
    intent,
    held: null,
  };
  writePlayerCache(browserStore(), envelope);
  publish(playerKey, snapshotFromEnvelope(envelope, false));
  void enqueueSync(playerKey);
}

async function enqueueSync(playerKey: string) {
  syncChain = syncChain.then(() => syncPlayer(playerKey)).catch(() => undefined);
  await syncChain;
}

async function syncPlayer(playerKey: string) {
  for (let guard = 0; guard < 4; guard += 1) {
    if (activeScope !== playerKey) return;
    const stored = readPlayerCache(browserStore(), playerKey);
    const local = stored.envelope;
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      if (local) publish(playerKey, { ...snapshotFromEnvelope(local, false), syncPhase: "offline" });
      else publishFresh(playerKey, stored.corrupt, "offline");
      return;
    }

    let remote: ServerProgressBody;
    try {
      remote = await fetchProgress();
    } catch (error) {
      if (error instanceof AuthExpiredError) {
        publish("guest", guestSnapshot());
        return;
      }
      if (local) {
        publish(playerKey, {
          ...snapshotFromEnvelope(local, false),
          syncPhase: local.pending ? "pending" : "unavailable",
          syncNote: "Saved on this device. The cloud save could not be reached.",
        });
      } else {
        publishFresh(playerKey, stored.corrupt, "unavailable");
      }
      if (!(error instanceof SyncRequestError) || error.status >= 500) retryLater(playerKey);
      return;
    }

    if (!local?.pending) {
      if (!remote.progress) {
        if (local && !isUntouched(local.progress)) {
          const pending = { ...local, pending: true, mutationId: local.mutationId ?? crypto.randomUUID(), intent: "save" as const };
          writePlayerCache(browserStore(), pending);
          continue;
        }
        publishFresh(playerKey, stored.corrupt, "idle");
        return;
      }
      if (!local || local.baseRevision !== remote.revision || !progressEqual(local.progress, remote.progress)) {
        const adopted: LocalEnvelope = {
          version: 1,
          playerKey,
          progress: remote.progress,
          updatedAt: remote.updatedAt ?? new Date().toISOString(),
          baseRevision: remote.revision,
          pending: false,
          mutationId: null,
          intent: "save",
          held: local?.held ?? null,
        };
        writePlayerCache(browserStore(), adopted);
        publish(playerKey, snapshotFromEnvelope(adopted, false));
      } else {
        publish(playerKey, snapshotFromEnvelope(local, false));
      }
      return;
    }

    if (remote.progress && local.baseRevision === remote.revision && progressEqual(local.progress, remote.progress)) {
      const synced = { ...local, pending: false, mutationId: null };
      writePlayerCache(browserStore(), synced);
      publish(playerKey, snapshotFromEnvelope(synced, false));
      return;
    }

    const sentMutationId = local.mutationId ?? crypto.randomUUID();
    let body: ServerProgressBody;
    try {
      body = await pushProgress(local, sentMutationId);
    } catch (error) {
      if (error instanceof AuthExpiredError) {
        publish("guest", guestSnapshot());
        return;
      }
      publish(playerKey, {
        ...snapshotFromEnvelope(local, false),
        syncPhase: "pending",
        syncNote: "Saved on this device. Cloud sync will retry.",
      });
      if (!(error instanceof SyncRequestError) || error.status >= 500 || error.status === 503) retryLater(playerKey);
      return;
    }

    const current = readPlayerCache(browserStore(), playerKey).envelope ?? local;
    const next = applySyncResponse(current, sentMutationId, body, new Date().toISOString());
    writePlayerCache(browserStore(), next);
    const view = snapshotFromEnvelope(next, false);
    if (body.conflict && body.note) view.syncNote = body.note;
    publish(playerKey, view);
    if (next.pending && next.mutationId !== sentMutationId) continue;
    return;
  }
}

function publishFresh(playerKey: string, recovered: boolean, phase: SyncPhase) {
  const progress = createFreshProgress();
  const envelope: LocalEnvelope = {
    version: 1,
    playerKey,
    progress,
    updatedAt: new Date().toISOString(),
    baseRevision: null,
    pending: false,
    mutationId: null,
    intent: "save",
    held: null,
  };
  writePlayerCache(browserStore(), envelope);
  publish(playerKey, {
    ready: true,
    recovered,
    progress,
    syncPhase: phase,
    syncNote:
      phase === "unavailable"
        ? "A new town wallet is on this device. The cloud save could not be reached."
        : phase === "offline"
          ? "A new town wallet is on this device. It will check the cloud save when you are back online."
          : null,
    held: false,
  });
}

class AuthExpiredError extends Error {}

class SyncRequestError extends Error {
  constructor(readonly status: number) {
    super("progress request failed");
  }
}

function retryLater(playerKey: string) {
  window.setTimeout(() => {
    if (activeScope === playerKey) void enqueueSync(playerKey);
  }, 5000);
}

async function fetchProgress(): Promise<ServerProgressBody> {
  const response = await fetch("/api/progress", { cache: "no-store" });
  if (response.status === 401) throw new AuthExpiredError();
  if (!response.ok) throw new SyncRequestError(response.status);
  return (await response.json()) as ServerProgressBody;
}

async function pushProgress(local: LocalEnvelope, mutationId: string): Promise<ServerProgressBody> {
  const response = await fetch("/api/progress", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      progress: local.progress,
      baseRevision: local.baseRevision,
      mutationId,
      intent: local.intent,
    }),
  });
  if (response.status === 401) throw new AuthExpiredError();
  if (!response.ok) throw new SyncRequestError(response.status);
  return (await response.json()) as ServerProgressBody;
}

function isUntouched(progress: PlayerProgress): boolean {
  return (
    progress.coins === WELCOME_COINS &&
    progress.xp === 0 &&
    progress.savings === 0 &&
    progress.badges.length === 0 &&
    Object.keys(progress.missions).length === 0 &&
    Object.keys(progress.lessons).length === 0
  );
}

const ProgressContext = createContext<ProgressApi | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const { status, data } = useSession();
  const scope =
    status === "loading"
      ? "pending"
      : status === "authenticated" && data?.user?.id
        ? `google:${data.user.id}`
        : "guest";

  const state = useSyncExternalStore(subscribe, () => selectSnapshot(scope), () => SERVER_SNAPSHOT);

  useEffect(() => {
    if (!scope.startsWith("google:")) return;
    let cancelled = false;
    const run = () => {
      if (!cancelled) void enqueueSync(scope);
    };
    run();
    const onOnline = () => run();
    const onVisible = () => {
      if (document.visibilityState === "visible") run();
    };
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [scope]);

  const api = useMemo<ProgressApi>(() => {
    const signedIn = scope.startsWith("google:");
    return {
      ready: state.ready,
      recovered: state.recovered,
      progress: state.progress,
      signedIn,
      syncPhase: state.syncPhase,
      syncNote: state.syncNote,
      save: (next) => {
        if (scope.startsWith("google:")) commitPlayer(scope, next, "save");
        else if (scope === "guest") commitGuest(next, state.recovered);
      },
      reset: () => {
        const fresh = createFreshProgress();
        if (scope.startsWith("google:")) commitPlayer(scope, fresh, "reset");
        else if (scope === "guest") commitGuest(fresh, false);
      },
      dismissHeld: () => {
        if (!scope.startsWith("google:")) return;
        const envelope = readPlayerCache(browserStore(), scope).envelope;
        if (!envelope?.held) return;
        const next = { ...envelope, held: null };
        writePlayerCache(browserStore(), next);
        publish(scope, snapshotFromEnvelope(next, false));
      },
      prepareSignOut: async () => {
        if (!scope.startsWith("google:")) return;
        await enqueueSync(scope);
        const envelope = readPlayerCache(browserStore(), scope).envelope;
        if (!shouldRetainCacheOnSignOut(envelope)) clearPlayerCache(browserStore(), scope);
        activeScope = "guest";
        snapshot = SERVER_SNAPSHOT;
      },
    };
  }, [scope, state]);

  return <ProgressContext.Provider value={api}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressApi {
  const value = useContext(ProgressContext);
  if (!value) {
    throw new Error("useProgress must be used inside ProgressProvider");
  }
  return value;
}

export function syncStatusCopy(phase: SyncPhase, note: string | null): string | null {
  if (note) return note;
  if (phase === "idle") return "Signed in. The next change is stored in your cloud save.";
  if (phase === "synced") return "Saved to your cloud save.";
  if (phase === "pending") return "Saved on this device. Cloud sync is waiting.";
  if (phase === "offline") return "Saved on this device. It will sync when you are back online.";
  if (phase === "unavailable") return "Saved on this device. The cloud save could not be reached.";
  if (phase === "checking") return "Checking your cloud save…";
  return null;
}
