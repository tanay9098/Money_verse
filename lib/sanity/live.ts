import "server-only";
import { createClient } from "next-sanity";
import { defineLive } from "next-sanity/live";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const token = process.env.SANITY_API_READ_TOKEN || false;

function createLive() {
  if (!projectId) {
    return {
      sanityFetch: async () => {
        throw new Error("Sanity project id is not configured");
      },
      SanityLive: function DisabledSanityLive() {
        return null;
      },
    };
  }

  const client = createClient({
    projectId,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2026-01-01",
    useCdn: true,
    perspective: "published",
  });

  return defineLive({
    client,
    serverToken: token,
    browserToken: token,
  });
}

export const { sanityFetch, SanityLive } = createLive();
