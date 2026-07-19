"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  horizontalScrollSurfaceClassName,
  horizontalScrollSurfaceProps,
} from "@/lib/scrollSurface";

interface ScrollRowWithArrowsProps {
  /** Extra classes for the scrollable container (flex/gap/snap etc.). */
  className?: string;
  children: React.ReactNode;
}

const arrowButtonClassName =
  "absolute top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#c5a059]/35 bg-white/95 text-[#c5a059] shadow-md transition-colors hover:bg-white sm:h-10 sm:w-10";

/**
 * Horizontal scroll row that shows left/right arrow buttons only when there
 * is overflowing content in that direction.
 */
export default function ScrollRowWithArrows({
  className,
  children,
}: ScrollRowWithArrowsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < maxScroll - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    const resizeObserver = new ResizeObserver(updateArrows);
    resizeObserver.observe(el);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      resizeObserver.disconnect();
    };
  }, [updateArrows]);

  // Content (number of items) can change without the container resizing.
  useEffect(() => {
    updateArrows();
  });

  const scrollByPage = useCallback((direction: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction * el.clientWidth * 0.8,
      behavior: "smooth",
    });
  }, []);

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        {...horizontalScrollSurfaceProps}
        className={cn(
          horizontalScrollSurfaceClassName,
          "scrollbar-hide",
          className,
        )}
      >
        {children}
      </div>
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollByPage(-1)}
          className={cn(arrowButtonClassName, "left-0 sm:left-1")}
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollByPage(1)}
          className={cn(arrowButtonClassName, "right-0 sm:right-1")}
          aria-label="Scroll right"
        >
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      )}
    </div>
  );
}
