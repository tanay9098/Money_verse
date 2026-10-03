import "server-only";
import { createClient, type SanityClient } from "@sanity/client";
import { acceptProgress } from "@/lib/progress-cache";
import { progressDocumentId } from "@/lib/progress-document-id";
import { decideWrite, type CloudRecord, type WriteDecision, type WriteRequest } from "@/lib/progress-sync";

export { progressDocumentId };

export function getProgressWriteClient(): SanityClient | null {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!projectId || !token) return null;
  return createClient({
    projectId,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2026-01-01",
    token,
    useCdn: false,
    perspective: "raw",
  });
}

export async function readCloudProgress(client: SanityClient, playerKey: string): Promise<CloudRecord | null> {
  const document = await client.getDocument(progressDocumentId(playerKey));
  if (!document) return null;
  if (document.playerKey !== playerKey) {
    throw new Error("Progress document does not match the signed-in player");
  }
  return cloudRecordFromDocument(document);
}

export async function writeCloudProgress(client: SanityClient, playerKey: string, input: WriteRequest, now: string): Promise<WriteDecision> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const id = progressDocumentId(playerKey);
    const existing = await client.getDocument(id);
    if (existing && existing.playerKey !== playerKey) {
      throw new Error("Progress document does not match the signed-in player");
    }
    const remote = existing ? cloudRecordFromDocument(existing) : null;
    const decision = decideWrite(remote, input, now);
    if (decision.type !== "write") return decision;

    const next = {
      _id: id,
      _type: "playerProgress",
      playerKey,
      provider: "google",
      revision: decision.record.revision,
      updatedAt: decision.record.updatedAt,
      lastMutationId: decision.record.lastMutationId,
      progressJson: JSON.stringify(decision.record.progress),
    };

    try {
      if (!existing) {
        await client.createIfNotExists(next);
        const stored = await client.getDocument(id);
        if (stored?.lastMutationId === input.mutationId) return decision;
        continue;
      }
      await client
        .patch(id)
        .set({
          playerKey,
          provider: "google",
          revision: next.revision,
          updatedAt: next.updatedAt,
          lastMutationId: next.lastMutationId,
          progressJson: next.progressJson,
        })
        .ifRevisionId(existing._rev as string)
        .commit();
      return decision;
    } catch (error) {
      if (attempt < 2 && isRevisionConflict(error)) continue;
      throw error;
    }
  }
  throw new Error("Progress write could not be completed");
}

function cloudRecordFromDocument(document: { [key: string]: unknown }): CloudRecord {
  const progress = acceptProgress(parseJson(document.progressJson));
  if (!progress) {
    throw new Error("Stored progress could not be read");
  }
  if (!Number.isInteger(document.revision) || (document.revision as number) < 1) {
    throw new Error("Stored progress revision is missing");
  }
  if (typeof document.updatedAt !== "string") {
    throw new Error("Stored progress timestamp is missing");
  }
  return {
    progress,
    revision: document.revision as number,
    updatedAt: document.updatedAt,
    lastMutationId: typeof document.lastMutationId === "string" ? document.lastMutationId : null,
  };
}

function parseJson(value: unknown): unknown {
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function isRevisionConflict(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const status = "statusCode" in error ? error.statusCode : null;
  return status === 409;
}
