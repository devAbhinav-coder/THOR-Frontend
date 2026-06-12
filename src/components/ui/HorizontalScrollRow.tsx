"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ScrollRowVariant = "default" | "dark" | "light";

type HorizontalScrollRowProps = {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  variant?: ScrollRowVariant;
};

const navButtonVariants: Record<ScrollRowVariant, string> = {
  default:
    "border border-[#c5a059]/35 bg-white/95 text-[#c5a059] shadow-md hover:bg-white",
  dark: "border border-white/25 bg-white/10 text-[#c5a059] shadow-md backdrop-blur-sm hover:bg-white/20",
  light:
    "border border-[#c5a059]/35 bg-white/95 text-[#c5a059] shadow-md hover:bg-white",
};

export default function HorizontalScrollRow({
  children,
  className,
  innerClassName,
  variant = "default",
}: HorizontalScrollRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft < maxScroll - 2);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateScrollState();

    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);

    el.addEventListener("scroll", updateScrollState, { passive: true });
    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", updateScrollState);
    };
  }, [updateScrollState, children]);

  const scrollByPage = useCallback((direction: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction * el.clientWidth * 0.82,
      behavior: "smooth",
    });
  }, []);

  const showNav = canScrollLeft || canScrollRight;
  const navBtnClass = cn(
    "absolute top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full transition-all duration-200 disabled:pointer-events-none disabled:opacity-0 sm:h-10 sm:w-10",
    navButtonVariants[variant],
  );

  return (
    <div className={cn("relative", className)}>
      {showNav && (
        <>
          <button
            type="button"
            onClick={() => scrollByPage(-1)}
            disabled={!canScrollLeft}
            className={cn(navBtnClass, "left-0 sm:left-1")}
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollByPage(1)}
            disabled={!canScrollRight}
            className={cn(navBtnClass, "right-0 sm:right-1")}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </>
      )}

      <div
        ref={scrollRef}
        className={cn(
          "flex w-full min-w-0 gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-1 scrollbar-hide snap-x snap-mandatory sm:gap-4 lg:gap-5 [-webkit-overflow-scrolling:touch]",
          innerClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
