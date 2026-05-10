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

/** Sync Lenis with GSAP Ticker for frame-perfect pinning and animations */
function LenisGsapSync() {
  const lenis = useLenis();

  useEffect(() => {
    const l = lenis;
    if (l) {
      // Import GSAP only on client
      const gsapModule = require("gsap").default;
      const ScrollTrigger = require("gsap/ScrollTrigger").ScrollTrigger;

      const update = (time: number) => {
        l.raf(time * 1000);
      };

      gsapModule.ticker.add(update);
      l.on("scroll", ScrollTrigger.update);

      return () => {
        gsapModule.ticker.remove(update);
        l.off("scroll", ScrollTrigger.update);
      };
    }
  }, [lenis]);

  return null;
}


export default function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenisOn, setLenisOn] = useState(false);

  useEffect(() => {
    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setLenisOn(!mqReduce.matches);
    sync();
    mqReduce.addEventListener("change", sync);
    return () => mqReduce.removeEventListener("change", sync);
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
        autoRaf: false, // We'll use GSAP ticker instead
        lerp: 0.06,    // Silkier, more premium feel
        duration: 1.4, // Longer, more elegant scroll
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.4,
      }}
    >
      <LenisGsapSync />
      <LenisScrollToTopOnRoute />
      {children}
    </ReactLenis>
  );
}
