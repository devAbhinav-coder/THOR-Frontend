import type Lenis from "lenis";

type LenisScrollTrigger = {
  scrollerProxy(
    scroller: Element,
    vars: {
      scrollTop?: (value?: number) => number;
      getBoundingClientRect?: () => {
        top: number;
        left: number;
        width: number;
        height: number;
      };
    },
  ): void;
  addEventListener(event: "refresh", callback: () => void): void;
  removeEventListener(event: "refresh", callback: () => void): void;
};

/**
 * Wire GSAP ScrollTrigger to Lenis virtual scroll (required for scrub/pin on /about).
 * Call the returned cleanup when leaving the page or tearing down animations.
 */
export function bindLenisScrollTrigger(
  lenis: Lenis,
  ScrollTrigger: LenisScrollTrigger,
): () => void {
  ScrollTrigger.scrollerProxy(document.documentElement, {
    scrollTop(value?: number) {
      if (typeof value === "number") {
        lenis.scrollTo(value, { immediate: true });
      }
      return lenis.scroll;
    },
    getBoundingClientRect() {
      return {
        top: 0,
        left: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      };
    },
  });

  const onRefresh = () => lenis.resize();
  ScrollTrigger.addEventListener("refresh", onRefresh);

  return () => {
    ScrollTrigger.removeEventListener("refresh", onRefresh);
    ScrollTrigger.scrollerProxy(document.documentElement, {});
  };
}
