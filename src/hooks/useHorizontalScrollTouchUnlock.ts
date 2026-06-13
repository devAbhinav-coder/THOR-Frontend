"use client";

import { useEffect, type RefObject } from "react";
import { prefersNativeTouchScroll } from "@/lib/scrollSurface";

const AXIS_LOCK_THRESHOLD_PX = 8;

/**
 * On touch devices, picks horizontal vs vertical axis from the first move so
 * vertical swipes scroll the page while horizontal swipes scroll the row.
 */
export function useHorizontalScrollTouchUnlock(
  ref: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !prefersNativeTouchScroll()) return;

    let startX = 0;
    let startY = 0;
    let axis: "x" | "y" | null = null;

    const resetAxis = () => {
      axis = null;
      el.style.touchAction = "";
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        resetAxis();
        return;
      }
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
      axis = null;
      el.style.touchAction = "";
    };

    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;

      const dx = event.touches[0].clientX - startX;
      const dy = event.touches[0].clientY - startY;

      if (axis === null) {
        if (
          Math.abs(dx) < AXIS_LOCK_THRESHOLD_PX &&
          Math.abs(dy) < AXIS_LOCK_THRESHOLD_PX
        ) {
          return;
        }
        axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      }

      el.style.touchAction = axis === "y" ? "pan-y" : "pan-x";
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", resetAxis, { passive: true });
    el.addEventListener("touchcancel", resetAxis, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", resetAxis);
      el.removeEventListener("touchcancel", resetAxis);
      el.style.touchAction = "";
    };
  }, [ref]);
}
