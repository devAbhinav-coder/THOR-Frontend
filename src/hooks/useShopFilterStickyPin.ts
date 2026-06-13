"use client";

import { useEffect, useRef, useState } from "react";
import { useLenis } from "lenis/react";

const NAV_ROOT_SELECTOR = "[data-store-sticky-nav]";
const DEFAULT_NAV_HEIGHT = 68;

/**
 * Pins the shop filter toolbar under the store navbar on desktop scroll.
 * Uses fixed positioning so it works with Lenis (position: sticky does not).
 */
export function useShopFilterStickyPin(enabled: boolean) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(false);
  const [navHeight, setNavHeight] = useState(DEFAULT_NAV_HEIGHT);
  const [toolbarHeight, setToolbarHeight] = useState(56);
  const lenis = useLenis();

  useEffect(() => {
    if (!enabled) return;

    const measureNav = () => {
      const el = document.querySelector(NAV_ROOT_SELECTOR);
      setNavHeight(
        el instanceof HTMLElement ?
          el.getBoundingClientRect().height
        : DEFAULT_NAV_HEIGHT,
      );
    };

    measureNav();
    const ro = new ResizeObserver(measureNav);
    const nav = document.querySelector(NAV_ROOT_SELECTOR);
    if (nav instanceof HTMLElement) ro.observe(nav);
    window.addEventListener("resize", measureNav);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measureNav);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const toolbar = toolbarRef.current;
    if (!toolbar) return;

    const measure = () => {
      setToolbarHeight(toolbar.getBoundingClientRect().height);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(toolbar);
    return () => ro.disconnect();
  }, [enabled, pinned]);

  useEffect(() => {
    if (!enabled) return;

    const update = () => {
      const sentinel = sentinelRef.current;
      if (!sentinel) return;
      setPinned(sentinel.getBoundingClientRect().top <= navHeight);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    let lenisOff: (() => void) | undefined;
    if (lenis) {
      lenisOff = lenis.on("scroll", update);
    }

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      lenisOff?.();
    };
  }, [enabled, lenis, navHeight]);

  return { sentinelRef, toolbarRef, pinned, navHeight, toolbarHeight };
}
