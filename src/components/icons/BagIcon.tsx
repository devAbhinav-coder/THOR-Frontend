"use client";

import { forwardRef, type HTMLAttributes } from "react";
import type { LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

/** Brand cart/bag mark from `/public/icons/cart-bag.png` (tints via `currentColor`). */
const BagIcon = forwardRef<HTMLSpanElement, LucideProps>(function BagIcon(
  { className, strokeWidth: _strokeWidth, color, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      aria-hidden
      className={cn(
        "inline-block bg-current",
        "[mask-image:url(/icons/cart-bag.png)] [mask-size:contain] [mask-repeat:no-repeat] [mask-position:center]",
        "[-webkit-mask-image:url(/icons/cart-bag.png)] [-webkit-mask-size:contain] [-webkit-mask-repeat:no-repeat] [-webkit-mask-position:center]",
        className,
      )}
      style={color ? { color } : undefined}
      {...(props as HTMLAttributes<HTMLSpanElement>)}
    />
  );
});

export default BagIcon;
