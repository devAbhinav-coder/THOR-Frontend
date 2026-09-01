/** First-party UX gate only — real auth stays on API httpOnly cookies. */
export const AUTH_GATE_COOKIE = "hor_gate";

function cookieSecureSuffix(): string {
  return typeof window !== "undefined" && window.location.protocol === "https:"
    ? "; Secure"
    : "";
}

export function setAuthGateCookie(role: "admin" | "user"): void {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_GATE_COOKIE}=${role}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax${cookieSecureSuffix()}`;
}

export function clearAuthGateCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_GATE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${cookieSecureSuffix()}`;
}

export function syncAuthGateCookie(user: { role?: string } | null, isAuthenticated: boolean): void {
  if (!isAuthenticated || !user) {
    clearAuthGateCookie();
    return;
  }
  setAuthGateCookie(user.role === "admin" ? "admin" : "user");
}

export function readAuthGateFromRequestCookie(cookieHeader: string | null): "admin" | "user" | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|;\s*)hor_gate=(admin|user)(?:;|$)/);
  return match?.[1] === "admin" || match?.[1] === "user" ? match[1] : null;
}
