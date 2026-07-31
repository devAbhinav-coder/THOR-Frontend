/** Existing Cloudflare Turnstile widget — do not rotate / recreate in production. */
export const TURNSTILE_SITE_KEY_PROD =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ||
  "0x4AAAAAAD8xzt2D6jkftCkc";

/**
 * Cloudflare official always-pass invisible test sitekey.
 * Works on localhost without Hostname Management.
 * @see https://developers.cloudflare.com/turnstile/troubleshooting/testing/
 */
export const TURNSTILE_SITE_KEY_TEST = "1x00000000000000000000BB";

export function isLocalDevHost(): boolean {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1" || h === "0.0.0.0";
}

/**
 * Localhost / explicit test mode → Cloudflare dummy key.
 * Production host → real widget sitekey.
 * Set NEXT_PUBLIC_TURNSTILE_FORCE_PROD_KEY=true to force the real key on localhost
 * (only if localhost is added in Cloudflare Hostname Management).
 */
export function resolveTurnstileSiteKey(): string {
  if (process.env.NEXT_PUBLIC_TURNSTILE_FORCE_PROD_KEY === "true") {
    return TURNSTILE_SITE_KEY_PROD;
  }
  if (
    process.env.NEXT_PUBLIC_TURNSTILE_USE_TEST_KEYS === "true" ||
    isLocalDevHost()
  ) {
    return TURNSTILE_SITE_KEY_TEST;
  }
  return TURNSTILE_SITE_KEY_PROD;
}

/** @deprecated Prefer resolveTurnstileSiteKey() — kept for callers that need a static string. */
export const TURNSTILE_SITE_KEY = TURNSTILE_SITE_KEY_PROD;

export function isTurnstileConfigured(): boolean {
  return Boolean(resolveTurnstileSiteKey() || TURNSTILE_SITE_KEY_PROD);
}

/** Spin telemetry action — required on every production widget embed. */
export const TURNSTILE_ACTION = "turnstile-spin-v2";
