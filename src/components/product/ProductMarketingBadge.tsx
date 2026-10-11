"use client";

import { cn } from "@/lib/utils";
import { MARKETING_EDITION_ACCENT_CLASS } from "@/lib/marketingEditions";
import {
  useMarketingEditions,
  resolveProductMarketingEdition,
} from "@/lib/marketingEditionsContext";
import type { Product } from "@/types";

type ProductMarketingBadgeProps = {
  product: Pick<Product, "tags" | "marketingBadge">;
  className?: string;
  /** Bottom-right on image — flush corner tab (shop cards). */
  variant?: "pill" | "corner";
};

export default function ProductMarketingBadge({
  product,
  className,
  variant = "pill",
}: ProductMarketingBadgeProps) {
  const editions = useMarketingEditions();
  const fromApi = product.marketingBadge;
  const edition =
    fromApi?.label ?
      {
        slug: fromApi.slug,
        label: fromApi.label,
        accent: fromApi.accent ?? ("gold" as const),
      }
    : resolveProductMarketingEdition(product, editions);
  if (!edition) return null;

  const isCorner = variant === "corner";

  return (
    <div
      className={cn(
        "pointer-events-none absolute z-20 max-w-[min(100%,11rem)]",
        isCorner ?
          "bottom-0 right-0"
        : "bottom-2.5 right-2.5 max-w-[calc(100%-3.5rem)]",
        className,
      )}
    >
      <span
        className={cn(
          "inline-block max-w-full truncate font-bold uppercase shadow-md backdrop-blur-[2px]",
          isCorner ?
            "rounded-tl-lg px-2.5 py-1.5 text-[9px] tracking-[0.12em] sm:px-3 sm:py-1.5 sm:text-[10px] sm:tracking-[0.14em]"
          : "rounded-md px-2 py-1 text-[9px] tracking-[0.14em] sm:text-[10px]",
          MARKETING_EDITION_ACCENT_CLASS[edition.accent ?? "gold"],
        )}
      >
        {edition.label}
      </span>
    </div>
  );
}
