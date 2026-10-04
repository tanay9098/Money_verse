"use client";

import { ProgressProvider } from "@/components/game/progress-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <ProgressProvider>{children}</ProgressProvider>;
}
