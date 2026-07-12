"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ReactLenis, useLenis } from "lenis/react";
import "lenis/dist/lenis.css";
import { shouldEnableLenisSmoothScroll } from "@/lib/scrollSurface";

/** Scroll reset when Lenis is off (mobile / reduced motion). */
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

/** Keep Lenis scroll limits in sync when infinite grids / images change page height. */
function LenisResizeSync() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;

    let raf = 0;
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => lenis.resize());
    };

    const ro = new ResizeObserver(schedule);
    ro.observe(document.documentElement);
    ro.observe(document.body);

    window.addEventListener("load", schedule, { passive: true });
    document.fonts?.ready?.then(schedule).catch(() => {});

    schedule();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("load", schedule);
    };
  }, [lenis]);

  return null;
}

export default function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenisOn, setLenisOn] = useState(false);

  useEffect(() => {
    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mqPointer = window.matchMedia("(hover: hover) and (pointer: fine)");

    const sync = () => setLenisOn(shouldEnableLenisSmoothScroll());

    sync();
    mqReduce.addEventListener("change", sync);
    mqPointer.addEventListener("change", sync);

    return () => {
      mqReduce.removeEventListener("change", sync);
      mqPointer.removeEventListener("change", sync);
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
        lerp: 0.14,
        duration: 1,
        smoothWheel: true,
        wheelMultiplier: 1.05,
        syncTouch: false,
      }}
    >
      <LenisScrollToTopOnRoute />
      <LenisResizeSync />
      {children}
    </ReactLenis>
  );
}
