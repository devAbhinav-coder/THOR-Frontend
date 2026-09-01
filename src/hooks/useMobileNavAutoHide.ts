"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { subscribeWindowScroll } from "@/lib/windowScrollBus";

type Options = {
  enabled?: boolean;
  /** Apply hide-on-scroll on desktop too (PDP). */
  allBreakpoints?: boolean;
  /** Always show nav when scrollY is below this (px). */
  topReveal?: number;
  /** Cumulative scroll-down (px) before hiding. */
  hideThreshold?: number;
  /** Cumulative scroll-up (px) before revealing. */
  revealThreshold?: number;
  /** Ignore toggles for this long after a hide/show (ms). */
  cooldownMs?: number;
};

/**
 * Hide top chrome on scroll-down, reveal on scroll-up (mobile/tablet only).
 * Uses cumulative scroll distance + cooldown so touch momentum cannot flip visibility every frame.
 */
export function useMobileNavAutoHide({
  enabled = true,
  allBreakpoints = false,
  topReveal = 80,
  hideThreshold = 24,
  revealThreshold = 24,
  cooldownMs = 300,
}: Options = {}) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const visibleRef = useRef(true);
  const lastY = useRef(0);
  const accumulated = useRef(0);
  const lockedUntil = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;
    accumulated.current = 0;
    lockedUntil.current = 0;
    visibleRef.current = true;
    setVisible(true);
  }, [pathname]);

  useEffect(() => {
    if (!enabled) {
      visibleRef.current = true;
      setVisible(true);
      return;
    }

    const mq = window.matchMedia("(max-width: 1023px)");
    lastY.current = window.scrollY;
    accumulated.current = 0;
    lockedUntil.current = 0;

    const setChromeVisible = (next: boolean) => {
      if (visibleRef.current === next) return;
      visibleRef.current = next;
      setVisible(next);
      lockedUntil.current = Date.now() + cooldownMs;
      accumulated.current = 0;
    };

    return subscribeWindowScroll(({ y }) => {
      if (!allBreakpoints && !mq.matches) {
        setChromeVisible(true);
        return;
      }

      if (y <= topReveal) {
        setChromeVisible(true);
        lastY.current = y;
        accumulated.current = 0;
        return;
      }

      if (Date.now() < lockedUntil.current) {
        lastY.current = y;
        return;
      }

      const frameDelta = y - lastY.current;
      lastY.current = y;

      if (Math.abs(frameDelta) < 1) return;

      if (
        (frameDelta > 0 && accumulated.current < 0) ||
        (frameDelta < 0 && accumulated.current > 0)
      ) {
        accumulated.current = 0;
      }
      accumulated.current += frameDelta;

      if (accumulated.current >= hideThreshold && visibleRef.current) {
        setChromeVisible(false);
      } else if (accumulated.current <= -revealThreshold && !visibleRef.current) {
        setChromeVisible(true);
      }
    });
  }, [enabled, allBreakpoints, topReveal, hideThreshold, revealThreshold, cooldownMs, pathname]);

  return visible;
}
