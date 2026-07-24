/**
 * Prevent open redirects: only same-app relative paths (no protocol / //).
 */
export function safeRedirectPath(path: string | null | undefined): string | null {
  if (!path) return null;
  let decoded = String(path).trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    return null;
  }
  decoded = decoded.trim();
  if (!decoded.startsWith("/") || decoded.startsWith("//")) return null;
  if (decoded.includes("://") || decoded.includes("\\")) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(decoded)) return null;
  if (decoded.startsWith("/auth")) return null;
  return decoded;
}

/** Opens the sign-in modal on the current path with optional return URL. */
export function loginUrlWithRedirect(currentPathWithQuery: string): string {
  const trimmed = currentPathWithQuery.trim() || "/";
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/?auth=login";
  }
  if (trimmed.startsWith("/auth")) {
    return "/?auth=login";
  }
  const pathname = trimmed.split("?")[0] || "/";
  const safe = safeRedirectPath(pathname);
  if (!safe) return "/?auth=login";
  const params = new URLSearchParams();
  params.set("auth", "login");
  params.set("redirect", trimmed);
  return `${pathname}?${params.toString()}`;
}
