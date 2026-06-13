"use client";

import { forwardRef, useRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  horizontalScrollSurfaceClassName,
  horizontalScrollSurfaceProps,
} from "@/lib/scrollSurface";
import { useHorizontalScrollTouchUnlock } from "@/hooks/useHorizontalScrollTouchUnlock";

type HorizontalScrollSurfaceProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

function mergeRefs<T>(
  ...refs: (React.Ref<T> | undefined)[]
): (value: T | null) => void {
  return (value) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === "function") ref(value);
      else ref.current = value;
    }
  };
}

/** Native horizontal scroll row that still allows vertical page scroll on touch. */
export const HorizontalScrollSurface = forwardRef<
  HTMLDivElement,
  HorizontalScrollSurfaceProps
>(function HorizontalScrollSurface(
  { children, className, ...props },
  forwardedRef,
) {
  const innerRef = useRef<HTMLDivElement>(null);
  useHorizontalScrollTouchUnlock(innerRef);

  return (
    <div
      ref={mergeRefs(innerRef, forwardedRef)}
      {...horizontalScrollSurfaceProps}
      className={cn(horizontalScrollSurfaceClassName, className)}
      {...props}
    >
      {children}
    </div>
  );
});
