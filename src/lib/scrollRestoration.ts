import {
  isStoreProductDetailPath,
  isStoreShopListingPath,
} from "@/lib/storeRoutes";

/** Stable route key for scroll persistence (trailing slash tolerant). */
export function scrollRouteKey(pathname: string, search = ""): string {
  const path =
    pathname.length > 1 && pathname.endsWith("/") ?
      pathname.slice(0, -1)
    : pathname;
  const query = search.startsWith("?") ? search.slice(1) : search;
  return query ? `${path}?${query}` : path;
}

const SCROLL_STORAGE_PREFIX = "pia-scroll:";

let pendingPopState = false;
let popStateTrackingInitialized = false;

export function initPopStateScrollTracking(): () => void {
  if (typeof window === "undefined") return () => {};
  if (popStateTrackingInitialized) return () => {};
  popStateTrackingInitialized = true;

  window.history.scrollRestoration = "manual";

  const onPopState = () => {
    pendingPopState = true;
  };

  window.addEventListener("popstate", onPopState);
  return () => {
    window.removeEventListener("popstate", onPopState);
    popStateTrackingInitialized = false;
  };
}

export function consumePopStateNavigation(): boolean {
  const value = pendingPopState;
  pendingPopState = false;
  return value;
}

export function getCurrentScrollY(): number {
  if (typeof window === "undefined") return 0;
  return (
    window.scrollY ||
    window.pageYOffset ||
    document.documentElement.scrollTop ||
    document.body.scrollTop ||
    0
  );
}

export function saveScrollForRoute(routeKey: string, y: number): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      `${SCROLL_STORAGE_PREFIX}${routeKey}`,
      String(Math.max(0, Math.round(y))),
    );
  } catch {
    // Private mode / quota — ignore.
  }
}

function routePathFromKey(routeKey: string): string {
  const q = routeKey.indexOf("?");
  return q === -1 ? routeKey : routeKey.slice(0, q);
}

/** Forward navigations that should jump to top (respects shop filter scroll:false). */
export function shouldResetScrollOnForwardNav(
  prevRouteKey: string | null,
  nextRouteKey: string,
): boolean {
  if (!prevRouteKey || prevRouteKey === nextRouteKey) return false;

  const prevPath = routePathFromKey(prevRouteKey);
  const nextPath = routePathFromKey(nextRouteKey);

  if (prevPath === nextPath) return false;

  if (isStoreShopListingPath(prevPath) && isStoreShopListingPath(nextPath)) {
    return false;
  }

  if (prevPath.startsWith("/gifting") && nextPath.startsWith("/gifting")) {
    return false;
  }

  if (isStoreProductDetailPath(prevPath) && isStoreProductDetailPath(nextPath)) {
    const prevSlug = prevPath.split("/").pop();
    const nextSlug = nextPath.split("/").pop();
    if (prevSlug && prevSlug === nextSlug) return false;
  }

  return true;
}

export function readSavedScrollForRoute(routeKey: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${SCROLL_STORAGE_PREFIX}${routeKey}`);
    if (raw == null) return null;
    const y = Number.parseInt(raw, 10);
    return Number.isFinite(y) && y >= 0 ? y : null;
  } catch {
    return null;
  }
}

type ScrollApply = (y: number) => void;

export function scrollWindowTo(y: number, immediate = true): void {
  window.scrollTo({ top: y, left: 0, behavior: immediate ? "auto" : "smooth" });
  document.documentElement.scrollTop = y;
  document.body.scrollTop = y;
}

/** Re-apply saved Y while lazy sections grow (home / shop infinite grids). */
export function restoreScrollOptionsForPath(pathname: string): {
  maxAttempts: number;
  intervalMs: number;
} {
  if (isStoreShopListingPath(pathname) || isStoreProductDetailPath(pathname)) {
    return { maxAttempts: 6, intervalMs: 100 };
  }
  return { maxAttempts: 12, intervalMs: 120 };
}

/** Re-apply saved Y while lazy sections grow (home / shop infinite grids). */
export function restoreScrollPosition(
  y: number,
  apply: ScrollApply,
  { maxAttempts = 12, intervalMs = 120 } = {},
): () => void {
  let attempts = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let cancelled = false;

  const tryRestore = () => {
    if (cancelled) return;
    apply(y);
    attempts += 1;

    const maxScroll = Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight,
    );
    const current = getCurrentScrollY();
    const closeEnough = Math.abs(current - y) <= 8 || y >= maxScroll - 8;

    if (closeEnough || attempts >= maxAttempts) return;
    timer = setTimeout(tryRestore, intervalMs);
  };

  let inner = 0;
  const outer = requestAnimationFrame(() => {
    inner = requestAnimationFrame(tryRestore);
  });

  return () => {
    cancelled = true;
    cancelAnimationFrame(outer);
    if (inner) cancelAnimationFrame(inner);
    if (timer != null) clearTimeout(timer);
  };
}
