/** Stable Google `sub` values are letters, digits, underscore, or hyphen. */
const GOOGLE_SUB = /^[A-Za-z0-9_-]{1,255}$/;

export function playerKeyFromGoogleSub(sub: string | null | undefined): string | null {
  if (!sub || !GOOGLE_SUB.test(sub)) return null;
  return `google:${sub}`;
}

export function playerKeyFromSession(session: { user?: { id?: string | null } } | null | undefined): string | null {
  return playerKeyFromGoogleSub(session?.user?.id);
}
