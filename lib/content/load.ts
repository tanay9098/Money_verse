import "server-only";
import { resolveContent } from "@/lib/content/resolve";
import { getSanityClient, isSanityConfigured } from "@/lib/sanity/client";
import { lessonsQuery, missionsQuery } from "@/lib/sanity/queries";
import type { ContentBundle } from "@/lib/types";

export async function loadContent(): Promise<ContentBundle> {
  return resolveContent(
    isSanityConfigured() ? process.env.NEXT_PUBLIC_SANITY_PROJECT_ID : undefined,
    async () => {
      const client = getSanityClient();
      const [missions, lessons] = await Promise.all([
        client.fetch(missionsQuery),
        client.fetch(lessonsQuery),
      ]);
      return { missions, lessons };
    },
    (message) => {
      console.info(message);
    },
  );
}
