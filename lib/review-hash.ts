/**
 * A fingerprint of a Sanity document's editable content, used by the Studio review workflow.
 * Approve stores it in `approvedHash`. Publish is allowed only while the draft still matches it,
 * so an edit made after approval needs a new review before children can see it.
 *
 * Top-level system fields (`_id`, `_rev`, `_updatedAt`, …) and the review fields themselves are
 * ignored, so approving, adding a reviewer note, or publishing never changes the fingerprint.
 */

const IGNORED_FIELDS = new Set(["reviewStatus", "reviewerNote", "approvedHash"]);

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    // A missing field and a null one mean the same thing to the game, so they hash the same.
    .filter(([, item]) => item !== undefined && item !== null)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(",")}}`;
}

/** cyrb53: a small, fast, non-cryptographic 53-bit string hash. Enough to notice edits. */
function cyrb53(text: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 2654435761);
    h2 = Math.imul(h2 ^ code, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

export function reviewContentHash(document: Record<string, unknown>): string {
  const content: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(document)) {
    if (key.startsWith("_") || IGNORED_FIELDS.has(key)) continue;
    content[key] = value;
  }
  return cyrb53(stableStringify(content));
}

export type ReviewState = { reviewStatus?: unknown; approvedHash?: unknown } & Record<string, unknown>;

/** True when the document is approved and has not been edited since it was approved. */
export function isApprovedAsIs(document: ReviewState | null | undefined): boolean {
  if (!document || document.reviewStatus !== "approved") return false;
  return typeof document.approvedHash === "string" && document.approvedHash === reviewContentHash(document);
}
