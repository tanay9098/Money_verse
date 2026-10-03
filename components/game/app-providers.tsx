"use client";

import { SessionProvider } from "next-auth/react";
import { ProgressProvider } from "@/components/game/progress-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus>
      <ProgressProvider>{children}</ProgressProvider>
    </SessionProvider>
  );
}
