const PRODUCTION_DEFAULT = "https://www.thehouseofrani.com";

/**
 * Canonical absolute site URL (no trailing slash) for sitemap, robots, JSON-LD, and OG `url`.
 * Safe to import from server or client — uses `NEXT_PUBLIC_APP_URL` when set.
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (raw) {
    const normalized = raw.replace(/\/+$/, "");
    // In production, never allow localhost-style canonical URLs.
    if (process.env.NODE_ENV === "production") {
      try {
        const host = new URL(normalized).hostname.toLowerCase();
        if (host === "localhost" || host === "127.0.0.1") {
          return PRODUCTION_DEFAULT;
        }
      } catch {
        return PRODUCTION_DEFAULT;
      }
    }
    return normalized;
  }
  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_DEFAULT;
  }
  return "http://localhost:3000";
}
