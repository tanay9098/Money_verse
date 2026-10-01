"use client";

import { NextStudio } from "next-sanity/studio";
import config from "@/sanity.config";

export default function StudioClient({ configured }: { configured: boolean }) {
  if (!configured) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <div className="panel p-6">
          <h1 className="text-3xl font-semibold">Studio needs a Sanity project</h1>
          <p className="mt-3">
            The game is playable with demo lessons. To edit missions in Studio, create a project at sanity.io and set
            NEXT_PUBLIC_SANITY_PROJECT_ID in .env.local. Steps are in the README. No write token is required to open Studio after
            you log in.
          </p>
        </div>
      </main>
    );
  }
  return (
    <div className="fixed inset-0 z-50 bg-white">
      <NextStudio config={config} />
    </div>
  );
}
