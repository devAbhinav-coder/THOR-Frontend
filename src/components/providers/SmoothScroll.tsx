"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ReactLenis, useLenis } from "lenis/react";
import type Lenis from "lenis";
import "lenis/dist/lenis.css";
import { forceUnlockBodyScroll } from "@/lib/bodyScrollLock";
import { shouldEnableLenisSmoothScrollForPath } from "@/lib/scrollSurface";
import {
  consumePopStateNavigation,
  getCurrentScrollY,
  initPopStateScrollTracking,
  readSavedScrollForRoute,
  restoreScrollOptionsForPath,
  restoreScrollPosition,
  saveScrollForRoute,
  scrollRouteKey,
  scrollWindowTo,
  shouldResetScrollOnForwardNav,
} from "@/lib/scrollRestoration";
import { subscribeWindowScroll } from "@/lib/windowScrollBus";

function currentRouteKey(pathname: string): string {
  const search =
    typeof window !== "undefined" ? window.location.search.slice(1) : "";
  return scrollRouteKey(pathname, search);
}

function applyScrollY(y: number, lenis: Lenis | null | undefined): void {
  if (lenis) {
    lenis.scrollTo(y, { immediate: true });
    return;
  }
  scrollWindowTo(y, true);
}

function scrollToTop(lenis: Lenis | null | undefined): void {
  applyScrollY(0, lenis);
}

/** Persist scroll while reading; restore on back/forward, top on forward nav. */
function RouteScrollManager({ lenis }: { lenis?: Lenis | null }) {
  const pathname = usePathname();
  const prevRouteRef = useRef<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => initPopStateScrollTracking(), []);

  useEffect(() => {
    const persistScroll = () => {
      saveScrollForRoute(
        currentRouteKey(pathnameRef.current),
        getCurrentScrollY(),
      );
    };

    const unsubscribe = subscribeWindowScroll(() => {
      if (saveTimerRef.current != null) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(persistScroll, 80);
    });

    persistScroll();

    return () => {
      unsubscribe();
      if (saveTimerRef.current != null) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      persistScroll();
    };
  }, [pathname]);

  useEffect(() => {
    forceUnlockBodyScroll();

    const routeKey = currentRouteKey(pathname);
    const prevRoute = prevRouteRef.current;
    prevRouteRef.current = routeKey;

    if (prevRoute && prevRoute !== routeKey) {
      const leavingY = readSavedScrollForRoute(prevRoute) ?? getCurrentScrollY();
      saveScrollForRoute(prevRoute, leavingY);
    }

    const isBackForward = consumePopStateNavigation();
    let cancelRestore: (() => void) | undefined;
    let inner = 0;

    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        if (isBackForward) {
          const saved = readSavedScrollForRoute(routeKey);
          if (saved != null && saved > 0) {
            const routePath = routeKey.split("?")[0] ?? routeKey;
            cancelRestore = restoreScrollPosition(
              saved,
              (y) => applyScrollY(y, lenis),
              restoreScrollOptionsForPath(routePath),
            );
            return;
          }
        }
        if (shouldResetScrollOnForwardNav(prevRoute, routeKey)) {
          scrollToTop(lenis);
        }
      });
    });

    return () => {
      cancelAnimationFrame(outer);
      if (inner) cancelAnimationFrame(inner);
      cancelRestore?.();
    };
  }, [pathname, lenis]);

  return null;
}

function LenisRouteScrollManager() {
  const lenis = useLenis();
  return <RouteScrollManager lenis={lenis} />;
}

const LENIS_RESIZE_DEBOUNCE_MS = 150;

/** Keep Lenis scroll limits in sync when page height changes (debounced). */
function LenisResizeSync() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;

    let raf = 0;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const flush = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => lenis.resize());
    };

    const schedule = () => {
      if (debounceTimer != null) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(flush, LENIS_RESIZE_DEBOUNCE_MS);
    };

    const ro = new ResizeObserver(schedule);
    ro.observe(document.documentElement);
    ro.observe(document.body);

    window.addEventListener("load", schedule, { passive: true });
    document.fonts?.ready?.then(schedule).catch(() => {});

    schedule();

    return () => {
      if (debounceTimer != null) clearTimeout(debounceTimer);
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("load", schedule);
    };
  }, [lenis]);

  return null;
}

/**
 * Keep `children` outside the Lenis on/off branch so orientation / pointer
 * media flips do not remount the whole app (looked like random logout).
 */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [lenisOn, setLenisOn] = useState(false);

  useEffect(() => {
    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mqPointer = window.matchMedia("(hover: hover) and (pointer: fine)");

    const sync = () =>
      setLenisOn(shouldEnableLenisSmoothScrollForPath(pathname));

    sync();
    mqReduce.addEventListener("change", sync);
    mqPointer.addEventListener("change", sync);

    return () => {
      mqReduce.removeEventListener("change", sync);
      mqPointer.removeEventListener("change", sync);
    };
  }, [pathname]);

  return (
    <>
      {lenisOn ?
        <ReactLenis
          root
          options={{
            autoRaf: true,
            lerp: 0.2,
            duration: 1,
            smoothWheel: true,
            wheelMultiplier: 1,
            syncTouch: false,
          }}
        >
          <LenisRouteScrollManager />
          <LenisResizeSync />
        </ReactLenis>
      : <RouteScrollManager />}
      {children}
    </>
  );
}
