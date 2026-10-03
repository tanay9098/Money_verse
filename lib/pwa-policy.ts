/** Which GET responses the service worker may store. Private APIs stay on the network. */

export function isCacheableAppRequest(input: { method: string; origin: string; pageOrigin: string; pathname: string }): boolean {
  if (input.method !== "GET") return false;
  if (input.origin !== input.pageOrigin) return false;
  if (input.pathname.startsWith("/api/")) return false;
  if (input.pathname.startsWith("/studio")) return false;
  return true;
}

export function isStaticAssetPath(pathname: string): boolean {
  return (
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/icons/") ||
    pathname === "/icon.svg" ||
    pathname === "/manifest.webmanifest"
  );
}
