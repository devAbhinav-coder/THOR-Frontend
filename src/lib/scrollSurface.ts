/** Shared horizontal carousel / chip row — vertical page scroll must pass through. */
export const horizontalScrollSurfaceProps = {
  "data-lenis-prevent-horizontal": true,
} as const;

export const horizontalScrollSurfaceClassName =
  "touch-pan-x overflow-x-auto overflow-y-hidden overscroll-x-contain [-webkit-overflow-scrolling:touch]";

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Phones & tablets — native momentum scroll (no Lenis virtual scroll). */
export function prefersNativeTouchScroll(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(hover: none), (pointer: coarse)").matches;
}

/** Desktop mouse / trackpad — Lenis smooth wheel only. */
export function prefersSmoothWheelScroll(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export function shouldEnableLenisSmoothScroll(): boolean {
  return !prefersReducedMotion() && prefersSmoothWheelScroll();
}
