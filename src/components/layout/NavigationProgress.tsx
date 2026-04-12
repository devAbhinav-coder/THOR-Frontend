"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/** Stable key for same-origin navigations (trailing slash + search order tolerant). */
function routeKeyFromLocation(pathname: string, searchWithoutQuestion: string): string {
  const path =
    pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  return `${path}?${searchWithoutQuestion}`;
}

const FAILSAFE_MS = 8000;

/**
 * Slim top bar during client navigations. Clears when the URL updates, on back/forward,
 * or after a failsafe — avoids getting stuck when a click does not change the route key.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const skipNextRouteClear = useRef(true);
  const failsafeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = searchParams.toString();

  const clearFailsafe = () => {
    if (failsafeRef.current != null) {
      clearTimeout(failsafeRef.current);
      failsafeRef.current = null;
    }
  };

  /** Successful navigation (pathname or query changed) always hides the bar. */
  useEffect(() => {
    if (skipNextRouteClear.current) {
      skipNextRouteClear.current = false;
      return;
    }
    setActive(false);
    clearFailsafe();
  }, [pathname, search]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const el = e.target as HTMLElement | null;
      const a = el?.closest?.("a") as HTMLAnchorElement | null;
      if (!a?.href) return;
      if (a.target === "_blank") return;
      if (a.hasAttribute("download")) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      let url: URL;
      try {
        url = new URL(a.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;

      const nextKey = routeKeyFromLocation(url.pathname, url.search.slice(1));
      const currentKey = routeKeyFromLocation(
        window.location.pathname,
        window.location.search.slice(1),
      );
      if (nextKey === currentKey) return;

      setActive(true);
      clearFailsafe();
      failsafeRef.current = setTimeout(() => {
        setActive(false);
        failsafeRef.current = null;
      }, FAILSAFE_MS);
    };

    const onPopState = () => {
      setActive(false);
      clearFailsafe();
    };

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
      clearFailsafe();
    };
  }, []);

  if (!active) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-1 overflow-hidden bg-navy-900/15"
      aria-busy
      aria-label="Loading page"
    >
      <div className="h-full w-2/5 max-w-[200px] bg-gradient-to-r from-brand-600 to-brand-400 shadow-[0_0_12px_rgba(196,18,48,0.45)] animate-nav-indeterminate" />
    </div>
  );
}
