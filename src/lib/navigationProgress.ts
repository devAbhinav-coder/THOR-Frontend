/** Stable key for same-origin navigations (trailing slash + search order tolerant). */
export function routeKeyFromLocation(
  pathname: string,
  searchWithoutQuestion: string,
): string {
  const path =
    pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  return `${path}?${searchWithoutQuestion}`;
}

export function routeKeyFromUrl(url: URL): string {
  return routeKeyFromLocation(url.pathname, url.search.slice(1));
}

export function routeKeyFromWindow(): string {
  return routeKeyFromLocation(
    window.location.pathname,
    window.location.search.slice(1),
  );
}

function readHeaders(
  input: RequestInfo | URL,
  init?: RequestInit,
): Headers {
  if (init?.headers) return new Headers(init.headers);
  if (input instanceof Request) return new Headers(input.headers);
  return new Headers();
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

/** Next.js flight/RSC request (navigation or prefetch). */
export function isRscFetch(input: RequestInfo | URL, init?: RequestInit): boolean {
  const headers = readHeaders(input, init);
  if (headers.get("rsc") === "1") return true;

  try {
    const url = new URL(requestUrl(input), window.location.href);
    return url.searchParams.has("_rsc");
  } catch {
    return false;
  }
}

/** Background prefetch — must not start the top loading bar. */
export function isPrefetchRscFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): boolean {
  const headers = readHeaders(input, init);
  if (headers.get("next-router-prefetch") === "1") return true;
  if (headers.has("next-router-segment-prefetch")) return true;
  if (headers.get("purpose") === "prefetch") return true;
  return false;
}

export type NavigationRscTracker = {
  waitForIdle: (opts?: { idleMs?: number; timeoutMs?: number }) => Promise<void>;
  dispose: () => void;
};

/**
 * Tracks in-flight route-transition RSC fetches only while a navigation is active.
 * Ignores viewport/hover prefetches so the home page is not stuck loading.
 */
export function createNavigationRscTracker(
  isNavigationActive: () => boolean,
): NavigationRscTracker {
  let inFlight = 0;
  let disposed = false;

  const originalFetch = window.fetch.bind(window);

  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const track =
      !disposed &&
      isNavigationActive() &&
      isRscFetch(input, init) &&
      !isPrefetchRscFetch(input, init);

    if (track) inFlight += 1;

    return originalFetch(input, init).finally(() => {
      if (track) inFlight = Math.max(0, inFlight - 1);
    });
  }) as typeof window.fetch;

  const waitForIdle = ({
    idleMs = 200,
    timeoutMs = 10000,
  }: { idleMs?: number; timeoutMs?: number } = {}) =>
    new Promise<void>((resolve) => {
      if (disposed) {
        resolve();
        return;
      }

      let idleTimer: ReturnType<typeof setTimeout> | null = null;
      let settled = false;

      const finish = () => {
        if (settled) return;
        settled = true;
        if (idleTimer != null) clearTimeout(idleTimer);
        clearTimeout(hardTimer);
        resolve();
      };

      const scheduleIdleCheck = () => {
        if (idleTimer != null) clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
          if (inFlight === 0) finish();
          else scheduleIdleCheck();
        }, idleMs);
      };

      scheduleIdleCheck();
      const hardTimer = setTimeout(finish, timeoutMs);
    });

  return {
    waitForIdle,
    dispose: () => {
      disposed = true;
      window.fetch = originalFetch;
    },
  };
}

/** Wait for React commit + paint after a route update. */
export function waitForRoutePaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

/** Short buffer for client components to mount after the route commit. */
export function waitForHydrationSettle(ms = 350): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
