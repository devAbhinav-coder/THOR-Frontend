"use client";

import { useEffect, type RefObject } from "react";

const REVEAL_SELECTOR = "[data-about-reveal], [data-about-reveal-scale]";

/**
 * Lightweight scroll reveals for /about — avoids GSAP + Lenis fighting (jitter).
 */
export function useAboutReveal(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const nodes = Array.from(
      root.querySelectorAll<HTMLElement>(REVEAL_SELECTOR),
    );
    if (nodes.length === 0) return;

    const showAll = () => {
      nodes.forEach((el) => el.classList.add("about-visible"));
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      showAll();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("about-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );

    nodes.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [rootRef]);
}
