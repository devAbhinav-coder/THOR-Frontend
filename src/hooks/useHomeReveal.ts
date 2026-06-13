"use client";

import { useEffect, type RefObject } from "react";
import {
  prefersNativeTouchScroll,
  prefersReducedMotion,
} from "@/lib/scrollSurface";

const REVEAL_SELECTOR = "[data-home-reveal]";

/** Lightweight scroll reveals for home sections — no GSAP, reduced-motion safe. */
export function useHomeReveal(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const nodes = Array.from(
      root.querySelectorAll<HTMLElement>(REVEAL_SELECTOR),
    );
    if (nodes.length === 0) return;

    const showAll = () => {
      nodes.forEach((el) => el.classList.add("home-visible"));
    };

    if (prefersReducedMotion() || prefersNativeTouchScroll()) {
      showAll();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("home-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: "12% 0px -4% 0px", threshold: 0.05 },
    );

    nodes.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [rootRef]);
}
