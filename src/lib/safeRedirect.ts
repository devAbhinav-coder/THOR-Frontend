/**
 * Prevent open redirects: only same-app relative paths (no protocol / //).
 */
export function safeRedirectPath(path: string | null | undefined): string | null {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return null;
  if (path.startsWith("/auth")) return null;
  return path;
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
