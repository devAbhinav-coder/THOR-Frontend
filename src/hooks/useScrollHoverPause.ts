"use client";

import { useEffect, useState } from "react";

const PAUSE_MS = 140;

/**
 * Briefly pauses hover-driven UI (image swaps, scale) right after wheel / touch scroll
 * so cards under the cursor don't trigger expensive transforms mid-scroll.
 */
export function useScrollHoverPause(): boolean {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let timer = 0;

    const arm = () => {
      setPaused(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setPaused(false), PAUSE_MS);
    };

    window.addEventListener("wheel", arm, { passive: true });
    window.addEventListener("touchmove", arm, { passive: true });

    return () => {
      window.removeEventListener("wheel", arm);
      window.removeEventListener("touchmove", arm);
      window.clearTimeout(timer);
    };
  }, []);

  return paused;
}

export function isLenisScrolling(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("lenis-scrolling");
}
