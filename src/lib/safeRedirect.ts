/**
 * Prevent open redirects: only same-app relative paths (no protocol / //).
 */
export function safeRedirectPath(path: string | null | undefined): string | null {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return null;
  if (path.startsWith("/auth")) return null;
  return path;
}

/** Login URL with optional return path (pathname + search, internal only). */
export function loginUrlWithRedirect(currentPathWithQuery: string): string {
  const trimmed = currentPathWithQuery.trim() || "/";
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/auth/login";
  }
  if (trimmed.startsWith("/auth")) {
    return "/auth/login";
  }
  const safe = safeRedirectPath(trimmed.split("?")[0] || "/");
  if (!safe) return "/auth/login";
  return `/auth/login?redirect=${encodeURIComponent(trimmed)}`;
}
