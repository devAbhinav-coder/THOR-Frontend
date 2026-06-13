"use client";

import { useEffect, useRef, useState } from "react";

type Options = {
  enabled?: boolean;
  /** Always show nav when scrollY is below this (px). */
  topReveal?: number;
  /** Min scroll delta before toggling hide/show. */
  delta?: number;
};

/**
 * Hide top chrome on scroll-down, reveal on scroll-up (mobile/tablet only).
 */
export function useMobileNavAutoHide({
  enabled = true,
  topReveal = 48,
  delta = 6,
}: Options = {}) {
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setVisible(true);
      return;
    }

    const mq = window.matchMedia("(max-width: 1023px)");
    let raf = 0;

    const sync = () => {
      if (!mq.matches) {
        setVisible(true);
        return;
      }
      const y = window.scrollY;
      if (y <= topReveal) {
        setVisible(true);
      } else if (y - lastY.current > delta) {
        setVisible(false);
      } else if (lastY.current - y > delta) {
        setVisible(true);
      }
      lastY.current = y;
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(sync);
    };

    lastY.current = window.scrollY;
    sync();

    window.addEventListener("scroll", onScroll, { passive: true });
    mq.addEventListener("change", onScroll);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      mq.removeEventListener("change", onScroll);
    };
  }, [enabled, topReveal, delta]);

  return visible;
}
