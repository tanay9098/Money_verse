import "server-only";
import { createClient, type SanityClient } from "next-sanity";

export function isSanityConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID);
}

export function getSanityClient(): SanityClient {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  if (!projectId) {
    throw new Error("Sanity project id is not configured");
  }
  const token = process.env.SANITY_API_READ_TOKEN;
  return createClient({
    projectId,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2026-01-01",
    useCdn: true,
    perspective: "published",
    token: token || undefined,
  });
}
