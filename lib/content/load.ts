import "server-only";
import { resolveContent } from "@/lib/content/resolve";
import { isSanityConfigured } from "@/lib/sanity/client";
import { sanityFetch } from "@/lib/sanity/live";
import { lessonsQuery, missionsQuery } from "@/lib/sanity/queries";
import type { ContentBundle } from "@/lib/types";

export async function loadContent(): Promise<ContentBundle> {
  return resolveContent(
    isSanityConfigured() ? process.env.NEXT_PUBLIC_SANITY_PROJECT_ID : undefined,
    async () => {
      const [missions, lessons] = await Promise.all([
        sanityFetch({ query: missionsQuery, stega: false }),
        sanityFetch({ query: lessonsQuery, stega: false }),
      ]);
      return { missions: missions.data, lessons: lessons.data };
    },
    (message) => {
      console.info(message);
    },
    { allowDemoFallback: process.env.NODE_ENV !== "production" },
  );
}
