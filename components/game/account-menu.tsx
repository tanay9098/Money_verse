"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useProgress } from "@/components/game/progress-provider";

export function AccountMenu({ configured }: { configured: boolean }) {
  const { status, data } = useSession();
  const { prepareSignOut } = useProgress();

  if (status === "loading") {
    return <span className="inline-block h-9 w-28 rounded-full bg-line" aria-hidden="true" />;
  }

  if (status === "authenticated" && data?.user) {
    const label = data.user.name?.trim() || "Signed in";
    return (
      <div className="flex items-center gap-2">
        {data.user.image ? (
          // Google profile hosts are remote and only used as a small avatar.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.user.image} alt="" referrerPolicy="no-referrer" className="h-9 w-9 rounded-full border-2 border-ink object-cover" />
        ) : null}
        <span className="max-w-36 truncate text-sm font-extrabold">{label}</span>
        <button
          type="button"
          className="inline-flex min-h-11 items-center rounded-full border-2 border-ink bg-paper px-4 text-sm font-extrabold"
          onClick={() => {
            void prepareSignOut().finally(() => {
              void signOut({ callbackUrl: "/" });
            });
          }}
        >
          Sign out
        </button>
      </div>
    );
  }

  if (!configured) {
    return (
      <p className="max-w-48 text-right text-xs font-bold text-ink-soft" title="Set the Google OAuth environment variables to enable sign-in.">
        Google sign-in is not set up
      </p>
    );
  }

  return (
    <button
      type="button"
      className="inline-flex min-h-11 items-center rounded-full border-2 border-ink bg-paper px-4 text-sm font-extrabold"
      onClick={() => {
        void signIn("google", { callbackUrl: "/" });
      }}
    >
      Sign in with Google
    </button>
  );
}
