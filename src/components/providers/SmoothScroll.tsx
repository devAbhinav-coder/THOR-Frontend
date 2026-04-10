"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ReactLenis, useLenis } from "lenis/react";
import "lenis/dist/lenis.css";

/** Next/Lenis: window scroll reset when smooth scroll is off (reduced motion). */
function WindowScrollToTopOnRoute() {
  const pathname = usePathname();

  useEffect(() => {
    const run = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(run);
    });
    return () => {
      cancelAnimationFrame(outer);
      if (inner) cancelAnimationFrame(inner);
    };
  }, [pathname]);

  return null;
}

/** Lenis owns scroll; reset its position on every pathname change so new pages start at top. */
function LenisScrollToTopOnRoute() {
  const pathname = usePathname();
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        lenis.scrollTo(0, { immediate: true });
      });
    });
    return () => {
      cancelAnimationFrame(outer);
      if (inner) cancelAnimationFrame(inner);
    };
  }, [pathname, lenis]);

  return null;
}

export default function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenisOn, setLenisOn] = useState(false);

  useEffect(() => {
    /** Smooth scroll for all devices unless user prefers reduced motion. */
    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setLenisOn(!mqReduce.matches);
    sync();
    mqReduce.addEventListener("change", sync);
    return () => {
      mqReduce.removeEventListener("change", sync);
    };
  }, []);

  if (!lenisOn) {
    return (
      <>
        <WindowScrollToTopOnRoute />
        {children}
      </>
    );
  }

  return (
    <ReactLenis
      root
      options={{
        autoRaf: true,
        lerp: 0.09,
        smoothWheel: true,
        wheelMultiplier: 0.85,
        touchMultiplier: 1.1,
      }}
    >
      <LenisScrollToTopOnRoute />
      {children}
    </ReactLenis>
  );
}
