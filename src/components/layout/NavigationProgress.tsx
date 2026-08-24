"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  createNetworkActivityTracker,
  routeKeyFromUrl,
  routeKeyFromWindow,
  waitForRoutePaint,
} from "@/lib/navigationProgress";

const FAILSAFE_MS = 30000;

/**
 * Slim top bar during client navigations. Stays visible until the new route is
 * painted and in-flight page/API requests settle — not merely when the URL updates.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const skipNextRouteClear = useRef(true);
  const failsafeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navGenerationRef = useRef(0);
  const completingRef = useRef(false);
  const activeRef = useRef(false);
  const trackerRef = useRef<ReturnType<typeof createNetworkActivityTracker> | null>(
    null,
  );

  const search = searchParams.toString();

  const clearFailsafe = () => {
    if (failsafeRef.current != null) {
      clearTimeout(failsafeRef.current);
      failsafeRef.current = null;
    }
  };

  const armFailsafe = () => {
    clearFailsafe();
    failsafeRef.current = setTimeout(() => {
      activeRef.current = false;
      setActive(false);
      completingRef.current = false;
      failsafeRef.current = null;
    }, FAILSAFE_MS);
  };

  const beginNavigation = () => {
    navGenerationRef.current += 1;
    completingRef.current = false;
    activeRef.current = true;
    setActive(true);
    armFailsafe();
  };

  const completeNavigation = async (generation: number) => {
    if (completingRef.current) return;
    completingRef.current = true;

    try {
      await waitForRoutePaint();
      await trackerRef.current?.waitForIdle({ idleMs: 280, timeoutMs: 12000 });
    } finally {
      if (navGenerationRef.current !== generation) return;
      activeRef.current = false;
      setActive(false);
      completingRef.current = false;
      clearFailsafe();
    }
  };

  /** Route committed — wait for paint + network before hiding the bar. */
  useEffect(() => {
    if (skipNextRouteClear.current) {
      skipNextRouteClear.current = false;
      return;
    }
    if (!activeRef.current) return;

    const generation = navGenerationRef.current;
    void completeNavigation(generation);
  }, [pathname, search]);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const tracker = createNetworkActivityTracker({
      onNavigationRscFetch: () => {
        if (!activeRef.current) beginNavigation();
      },
    });
    trackerRef.current = tracker;

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

      const nextKey = routeKeyFromUrl(url);
      if (nextKey === routeKeyFromWindow()) return;

      beginNavigation();
    };

    const onPopState = () => {
      beginNavigation();
    };

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);

    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
      tracker.dispose();
      trackerRef.current = null;
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
      <div className="h-full w-2/5 max-w-[200px] bg-gradient-to-r from-brand-600 to-brand-400 shadow-[0_0_12px_rgba(197,160,89,0.45)] animate-nav-indeterminate" />
    </div>
  );
}
