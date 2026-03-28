"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Shows a slim top bar while client-side navigation is in flight.
 * Next often keeps the previous page visible until the new route is ready (especially in dev where prefetch is limited).
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const prevRouteKey = useRef<string | null>(null);

  const routeKey = `${pathname}?${searchParams.toString()}`;

  useEffect(() => {
    if (prevRouteKey.current === null) {
      prevRouteKey.current = routeKey;
      return;
    }
    if (prevRouteKey.current !== routeKey) {
      prevRouteKey.current = routeKey;
      setActive(false);
    }
  }, [routeKey]);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
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
      const nextKey = `${url.pathname}${url.search}`;
      const currentKey = `${window.location.pathname}${window.location.search}`;
      if (nextKey === currentKey) return;
      setActive(true);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
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
