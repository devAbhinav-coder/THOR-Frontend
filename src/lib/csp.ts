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
    "https://accounts.google.com",
    "https://www.googleapis.com",
    "https://*.google.com",
    "https://*.ingest.sentry.io",
    "https://*.ingest.de.sentry.io",
  ].filter(Boolean);

  const connectSrc = connectParts.join(" ");

  // Next.js dev (webpack + React Fast Refresh) relies on eval(); production builds do not.
  const scriptSrcExtra =
    process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : "";

  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://accounts.google.com https://apis.google.com https://www.gstatic.com${scriptSrcExtra}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
    "frame-src 'self' https://accounts.google.com https://*.google.com",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
  ];

  if (process.env.NODE_ENV === "production") {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}
