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

      // Essential: disable GSAP lag smoothing to prevent Lenis physics jitter
      gsapModule.ticker.lagSmoothing(0);

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

/** Silkier Lenis feel on editorial pages (About, home). */
function LenisEditorialRouteTune() {
  const pathname = usePathname();
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;
    const isAbout = pathname === "/about";
    const isHome = pathname === "/";
    lenis.options.lerp = isAbout ? 0.1 : isHome ? 0.08 : 0.1;
    lenis.options.duration = isAbout ? 1.15 : isHome ? 1.3 : 1.2;
    lenis.options.wheelMultiplier = isAbout ? 1 : isHome ? 0.95 : 1;
    lenis.resize();
  }, [pathname, lenis]);

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
        lerp: 0.1,      // Snappier, less laggy feel
        duration: 1.2,  // Standard elegant scroll
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1,
      }}
    >
      <LenisGsapSync />
      <LenisScrollToTopOnRoute />
      <LenisEditorialRouteTune />
      {children}
    </ReactLenis>
  );
}
