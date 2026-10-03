import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isCacheableAppRequest, isStaticAssetPath } from "@/lib/pwa-policy";

describe("service worker cache policy", () => {
  it("caches same-origin app pages and static files, not private APIs or Studio", () => {
    const origin = "https://moneyverse.example";
    expect(isCacheableAppRequest({ method: "GET", origin, pageOrigin: origin, pathname: "/" })).toBe(true);
    expect(isCacheableAppRequest({ method: "GET", origin, pageOrigin: origin, pathname: "/missions/lemonade-stand" })).toBe(true);
    expect(isStaticAssetPath("/_next/static/chunk.js")).toBe(true);
    expect(isCacheableAppRequest({ method: "POST", origin, pageOrigin: origin, pathname: "/api/progress" })).toBe(false);
    expect(isCacheableAppRequest({ method: "GET", origin, pageOrigin: origin, pathname: "/api/progress" })).toBe(false);
    expect(isCacheableAppRequest({ method: "GET", origin, pageOrigin: origin, pathname: "/api/auth/session" })).toBe(false);
    expect(isCacheableAppRequest({ method: "GET", origin, pageOrigin: origin, pathname: "/studio" })).toBe(false);
    expect(isCacheableAppRequest({ method: "GET", origin: "https://cdn.sanity.io", pageOrigin: origin, pathname: "/v1/data" })).toBe(false);
  });

  it("keeps the public worker aligned with those exclusions", () => {
    const source = readFileSync("public/sw.js", "utf8");
    expect(source).toContain('url.pathname.startsWith("/api/")');
    expect(source).toContain('url.pathname.startsWith("/studio")');
    expect(source).not.toContain("SANITY_API_WRITE_TOKEN");
    expect(source).not.toContain("GOOGLE_CLIENT_SECRET");
  });
});
