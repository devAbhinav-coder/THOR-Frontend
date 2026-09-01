"use client";

import { useEffect, useState, type RefObject } from "react";

/** True when the purchase anchor has scrolled out of view (PDP sticky bar). */
export function usePdpPurchaseBarScroll(
  anchorRef: RefObject<HTMLElement | null>,
) {
  const [enriched, setEnriched] = useState(false);

  useEffect(() => {
    const el = anchorRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        setEnriched(!entry.isIntersecting);
      },
      {
        root: null,
        // px only — IntersectionObserver does not accept rem in rootMargin
        rootMargin: "-72px 0px 0px 0px",
        threshold: 0,
      },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [anchorRef]);

  return enriched;
}
