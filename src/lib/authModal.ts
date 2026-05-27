export type AuthModalView = "login" | "signup" | "forgot";

const AUTH_VIEWS = new Set<string>(["login", "signup", "forgot"]);

export function parseAuthModalView(
  value: string | null | undefined,
): AuthModalView | null {
  if (!value || !AUTH_VIEWS.has(value)) return null;
  return value as AuthModalView;
}

/** Build URL that opens auth modal on the current page (shallow overlay). */
export function openAuthModalUrl(
  pathname: string,
  currentSearch: string,
  view: AuthModalView,
  redirectPath?: string,
): string {
  const params = new URLSearchParams(currentSearch);
  params.set("auth", view);
  if (redirectPath) {
    const trimmed = redirectPath.trim();
    if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
      params.set("redirect", trimmed);
    }
  }
  const q = params.toString();
  return q ? `${pathname}?${q}` : pathname;
}

/** Remove auth modal params while keeping other query keys. */
export function closeAuthModalUrl(pathname: string, currentSearch: string): string {
  const params = new URLSearchParams(currentSearch);
  params.delete("auth");
  params.delete("redirect");
  const q = params.toString();
  return q ? `${pathname}?${q}` : pathname;
}

export function switchAuthModalViewUrl(
  pathname: string,
  currentSearch: string,
  view: AuthModalView,
): string {
  const params = new URLSearchParams(currentSearch);
  const redirect = params.get("redirect");
  params.set("auth", view);
  if (redirect) params.set("redirect", redirect);
  const q = params.toString();
  return q ? `${pathname}?${q}` : pathname;
}
