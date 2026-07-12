const POST_CHECKOUT_GUARD_KEY = "hor_post_checkout_guard";

/** Set before post-order cart teardown so a transient 401 does not redirect to login. */
export function armPostCheckoutAuthGuard(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(POST_CHECKOUT_GUARD_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function isPostCheckoutAuthGuardActive(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = sessionStorage.getItem(POST_CHECKOUT_GUARD_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return false;
    return Date.now() - ts < 120_000;
  } catch {
    return false;
  }
}

export function clearPostCheckoutAuthGuard(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(POST_CHECKOUT_GUARD_KEY);
  } catch {
    /* ignore */
  }
}
