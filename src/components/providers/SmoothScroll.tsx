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

function LenisGsapSync() {
  const lenis = useLenis();

  useEffect(() => {
    const l = lenis;
    if (l) {
      // Import GSAP only on client
      const ScrollTrigger = require("gsap/ScrollTrigger").ScrollTrigger;
      l.on("scroll", ScrollTrigger.update);
      return () => {
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
    lenis.options.lerp = isAbout ? 0.08 : isHome ? 0.05 : 0.06;
    lenis.options.duration = isAbout ? 1.2 : isHome ? 1.5 : 1.4;
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
        autoRaf: true, 
        lerp: 0.05,    
        duration: 1.5, 
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.2,
        syncTouch: true,
      }}
    >
      <LenisGsapSync />
      <LenisScrollToTopOnRoute />
      <LenisEditorialRouteTune />
      {children}
    </ReactLenis>
  );
}
