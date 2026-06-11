/**
 * Subresource Integrity (sha384) for third-party scripts with stable URLs.
 * When a vendor updates a file, loading will fail until you refresh the hash:
 *   node scripts/compute-third-party-sri.mjs
 *
 * Optional env overrides (full `sha384-…` values) take precedence for GA / FB
 * because those URLs vary by account or change more often than Razorpay.
 */

/** https://checkout.razorpay.com/v1/checkout.js — verified 2026-06-11 */
export const RAZORPAY_CHECKOUT_JS_INTEGRITY =
  "sha384-GhsbifIunpkc+86jD9UsOYrz9J/NErn5qoTc6Bw/OfNHbL4HIWeDxj9fOQ6FMu+x";

/** https://connect.facebook.net/en_US/fbevents.js — verified 2026-05-21 */
export const FB_EVENTS_JS_INTEGRITY_DEFAULT =
  "sha384-EJ2FlglvD3VcuVzpUsZTGhx1FIAQNUNuAGfCemszqNJc3jCpSHNgKBasOBGQdBh2";

export function fbEventsJsIntegrity(): string | undefined {
  const fromEnv = process.env.NEXT_PUBLIC_FB_EVENTS_JS_INTEGRITY?.trim();
  if (fromEnv) return fromEnv;
  return FB_EVENTS_JS_INTEGRITY_DEFAULT;
}

/** GA `gtag/js?id=…` — depends on measurement ID; set env after running the compute script. */
export function gtagJsIntegrity(): string | undefined {
  const fromEnv = process.env.NEXT_PUBLIC_GTAG_JS_INTEGRITY?.trim();
  if (fromEnv) return fromEnv;
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  /** Known production stream — hash from `node scripts/compute-third-party-sri.mjs` (rotate if GA updates gtag). */
  if (gaId === "G-563PKNCB4J") {
    return "sha384-S3r1mEfYMFT36ZDVWXfB3D7Qp2Ki4PYpefsbRfjjstQT8FfJkjiJsjPHYu3Q5BpB";
  }
  return undefined;
}
