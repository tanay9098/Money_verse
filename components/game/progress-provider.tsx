"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import { createFreshProgress, readStoredProgress, STORAGE_KEY } from "@/lib/progress";
import type { PlayerProgress } from "@/lib/types";

type ProgressApi = {
  ready: boolean;
  recovered: boolean;
  progress: PlayerProgress | null;
  save: (next: PlayerProgress) => void;
  reset: () => void;
};

type Snapshot = {
  ready: boolean;
  recovered: boolean;
  progress: PlayerProgress | null;
};

const SERVER_SNAPSHOT: Snapshot = { ready: false, recovered: false, progress: null };

let snapshot: Snapshot = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function publish(next: Snapshot) {
  snapshot = next;
  for (const listener of listeners) listener();
}

function readSnapshot(): Snapshot {
  if (snapshot !== SERVER_SNAPSHOT) return snapshot;
  const existing = window.localStorage.getItem(STORAGE_KEY);
  const stored = readStoredProgress(existing);
  if (stored.recovered || existing === null) {
    const serialized = JSON.stringify(stored.progress);
    queueMicrotask(() => window.localStorage.setItem(STORAGE_KEY, serialized));
  }
  snapshot = { ready: true, recovered: stored.recovered, progress: stored.progress };
  return snapshot;
}

function commit(progress: PlayerProgress, recovered: boolean) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  publish({ ready: true, recovered, progress });
}

const ProgressContext = createContext<ProgressApi | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const state = useSyncExternalStore(subscribe, readSnapshot, () => SERVER_SNAPSHOT);

  const api = useMemo<ProgressApi>(
    () => ({
      ready: state.ready,
      recovered: state.recovered,
      progress: state.progress,
      save: (next) => commit(next, state.recovered),
      reset: () => commit(createFreshProgress(), false),
    }),
    [state],
  );

  return <ProgressContext.Provider value={api}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressApi {
  const value = useContext(ProgressContext);
  if (!value) {
    throw new Error("useProgress must be used inside ProgressProvider");
  }
  return value;
}
