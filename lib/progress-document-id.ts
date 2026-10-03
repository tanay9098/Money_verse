import { createHash } from "node:crypto";

/** Draft ids stay out of the public published content API. */
export function progressDocumentId(playerKey: string): string {
  const digest = createHash("sha256").update(playerKey).digest("hex");
  return `drafts.playerProgress.${digest}`;
}
