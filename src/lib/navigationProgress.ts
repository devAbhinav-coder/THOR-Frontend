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

/** Next.js soft-navigation RSC fetch (not viewport prefetch). */
export function isNavigationRscFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): boolean {
  const headers = readHeaders(input, init);
  if (headers.get("Next-Router-Prefetch") === "1") return false;
  if (headers.get("Purpose") === "prefetch") return false;
  if (headers.get("RSC") === "1") return true;

  const raw =
    typeof input === "string" ? input
    : input instanceof URL ? input.href
    : input.url;
  try {
    const url = new URL(raw, window.location.href);
    return url.searchParams.has("_rsc");
  } catch {
    return false;
  }
}

export type NetworkActivityTracker = {
  /** In-flight fetch/XHR count (excluding Next prefetch). */
  pending: () => number;
  /** Resolves after `idleMs` with no in-flight requests, or after `timeoutMs`. */
  waitForIdle: (opts?: { idleMs?: number; timeoutMs?: number }) => Promise<void>;
  dispose: () => void;
};

export function createNetworkActivityTracker(opts?: {
  onNavigationRscFetch?: () => void;
}): NetworkActivityTracker {
  let inFlight = 0;
  let disposed = false;

  const originalFetch = window.fetch.bind(window);
  const originalXhrOpen = XMLHttpRequest.prototype.open;
  const originalXhrSend = XMLHttpRequest.prototype.send;

  const begin = () => {
    if (!disposed) inFlight += 1;
  };

  const end = () => {
    if (disposed) return;
    inFlight = Math.max(0, inFlight - 1);
  };

  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const navRsc = isNavigationRscFetch(input, init);
    if (navRsc) {
      opts?.onNavigationRscFetch?.();
    } else {
      begin();
    }
    return originalFetch(input, init).finally(() => {
      if (!navRsc) end();
    });
  }) as typeof window.fetch;

  XMLHttpRequest.prototype.open = function open(
    this: XMLHttpRequest,
    method: string,
    url: string | URL,
    async?: boolean,
    username?: string | null,
    password?: string | null,
  ) {
    (this as XMLHttpRequest & { __navTrack?: boolean }).__navTrack = true;
    return originalXhrOpen.call(this, method, url, async ?? true, username, password);
  };

  XMLHttpRequest.prototype.send = function send(
    this: XMLHttpRequest,
    body?: Document | XMLHttpRequestBodyInit | null,
  ) {
    if ((this as XMLHttpRequest & { __navTrack?: boolean }).__navTrack) {
      begin();
      this.addEventListener("loadend", end, { once: true });
    }
    return originalXhrSend.call(this, body);
  };

  const waitForIdle = ({
    idleMs = 280,
    timeoutMs = 15000,
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
    pending: () => inFlight,
    waitForIdle,
    dispose: () => {
      disposed = true;
      window.fetch = originalFetch;
      XMLHttpRequest.prototype.open = originalXhrOpen;
      XMLHttpRequest.prototype.send = originalXhrSend;
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
