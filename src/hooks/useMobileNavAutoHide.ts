"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { subscribeWindowScroll } from "@/lib/windowScrollBus";

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
  topReveal = 80,
  delta = 8,
}: Options = {}) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;
    setVisible(true);
  }, [pathname]);

  useEffect(() => {
    if (!enabled) {
      setVisible(true);
      return;
    }

    const mq = window.matchMedia("(max-width: 1023px)");
    lastY.current = window.scrollY;

    return subscribeWindowScroll(({ y }) => {
      if (!mq.matches) {
        setVisible(true);
        return;
      }
      if (y <= topReveal) {
        setVisible(true);
        lastY.current = y;
        return;
      }
      if (y - lastY.current > delta) {
        setVisible(false);
      } else if (lastY.current - y > delta) {
        setVisible(true);
      }
      lastY.current = y;
    });
  }, [enabled, topReveal, delta, pathname]);

  return visible;
}
