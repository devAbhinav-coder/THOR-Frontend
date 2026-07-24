/** Existing Cloudflare Turnstile widget — do not rotate / recreate. */
export const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ||
  "0x4AAAAAAD8xzt2D6jkftCkc";

export function isTurnstileConfigured(): boolean {
  return Boolean(TURNSTILE_SITE_KEY);
}

/** Spin telemetry action — required on every widget embed. */
export const TURNSTILE_ACTION = "turnstile-spin-v2";
