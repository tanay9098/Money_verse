/**
 * Content rules shared by Sanity Studio (sanity/schemaTypes) and the game's runtime validator
 * (lib/content/validate.ts). Keeping them in one place means content that passes Studio is not
 * silently dropped by the game.
 */

/** Ids and slugs: lowercase letters, numbers, and hyphens, 1 to 80 characters. */
export const ID_PATTERN = /^[a-z0-9-]{1,80}$/;

/** Slug rule matching the game's validator. A slug like "pip's-shop" would otherwise be dropped silently. */
export function slugFormat(value: { current?: string } | undefined): true | string {
  if (!value?.current) return true;
  return ID_PATTERN.test(value.current) ? true : "Use only lowercase letters, numbers, and hyphens (up to 80).";
}

/** Studio's "Generate" button for slugs: "Pip's Shop!" becomes "pips-shop". */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
}

/** Array rule: no two items may share the same value for `field`. The game drops documents with duplicates. */
export function uniqueBy(field: string, label: string) {
  return (items: unknown): true | string => {
    if (!Array.isArray(items)) return true;
    const seen = new Set<unknown>();
    for (const item of items) {
      const value = (item as Record<string, unknown> | null)?.[field];
      if (value === undefined || value === null) continue;
      if (seen.has(value)) return `Each ${label} must be different. "${String(value)}" is used twice.`;
      seen.add(value);
    }
    return true;
  };
}
