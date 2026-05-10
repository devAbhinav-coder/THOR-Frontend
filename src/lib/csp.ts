/** Build Content-Security-Policy for a request (used by middleware). */

function apiOrigin(): string {
  const u = process.env.NEXT_PUBLIC_API_URL;
  if (!u) return "";
  try {
    return new URL(u).origin;
  } catch {
    return "";
  }
}

function randomNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]!);
  }
  return btoa(bin);
}

export { randomNonce };

export function buildContentSecurityPolicy(nonce: string): string {
  const api = apiOrigin();
  const connectParts = [
    "'self'",
    api,
    "https://www.google-analytics.com",
    "https://region1.google-analytics.com",
    "https://stats.g.doubleclick.net",
    "https://accounts.google.com",
    "https://www.googleapis.com",
    "https://*.google.com",
    "https://*.ingest.sentry.io",
    "https://*.ingest.de.sentry.io",
    "https://www.googletagmanager.com",
    "https://www.clarity.ms",
    "https://*.clarity.ms",
    "https://us.i.posthog.com",
    "https://us-assets.i.posthog.com",
    // Razorpay Checkout (SDK + payment flows)
    "https://api.razorpay.com",
    "https://checkout.razorpay.com",
    "https://lumberjack.razorpay.com",
  ].filter(Boolean);

  const connectSrc = connectParts.join(" ");

  // Next.js dev (webpack + React Fast Refresh) relies on eval(); production builds do not.
  const scriptSrcExtra =
    process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : "";

  const directives = [
    "default-src 'self'",
    // `strict-dynamic` lets nonced scripts spawn additional scripts (GTM,
    // PostHog, Clarity all do this). With it, allow-listed origins below
    // become a fallback for browsers that don't support strict-dynamic and
    // satisfy Lighthouse "Ensure CSP is effective against XSS attacks".
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https: 'unsafe-inline'${scriptSrcExtra}`,
    // Modern Lighthouse audit accepts `script-src-elem` separately.
    `script-src-elem 'self' 'nonce-${nonce}' 'strict-dynamic' https: 'unsafe-inline'`,
    "style-src 'self' 'unsafe-inline'",
    "style-src-elem 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src ${connectSrc}`,
    "frame-src 'self' https://accounts.google.com https://*.google.com https://api.razorpay.com https://checkout.razorpay.com https://www.googletagmanager.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "media-src 'self' https: data: blob:",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
  ];

  if (process.env.NODE_ENV === "production") {
    directives.push("upgrade-insecure-requests");
    directives.push("block-all-mixed-content");
  }

  return directives.join("; ");
}
