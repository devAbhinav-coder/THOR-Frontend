"use client";

import { formatPrice } from "@/lib/utils";
import type { CartPromotion } from "@/types";

type Props = {
  promotion: CartPromotion;
  variant?: "heritage" | "light";
  className?: string;
};

export function CartPromotionBanner({
  promotion,
  variant = "heritage",
  className = "",
}: Props) {
  const title =
    promotion.displayTitle?.trim() &&
    promotion.displayTitle.trim().toLowerCase() !== promotion.label.toLowerCase() ?
      promotion.displayTitle.trim()
    : promotion.label;
  const showLabelSubline =
    promotion.displayTitle?.trim() &&
    promotion.displayTitle.trim().toLowerCase() !== promotion.label.toLowerCase();

  const isHeritage = variant === "heritage";

  return (
    <div className={className}>
      <p
        className={
          isHeritage ?
            "text-[10px] font-semibold uppercase tracking-[0.14em] text-[#ffdea5]/90"
          : "text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-800/80"
        }
      >
        Auto offer applied
      </p>
      <p
        className={
          isHeritage ?
            "mt-1 text-sm font-medium text-white"
          : "mt-1 text-sm font-medium text-gray-900"
        }
      >
        {title}
      </p>
      {showLabelSubline ?
        <p
          className={
            isHeritage ?
              "mt-0.5 text-xs text-[#e8d5a3]/90"
            : "mt-0.5 text-xs text-gray-600"
          }
        >
          {promotion.label}
        </p>
      : null}
      <p
        className={
          isHeritage ?
            "mt-0.5 text-xs text-[#e8d5a3]/90"
          : "mt-0.5 text-xs text-emerald-800"
        }
      >
        You save {formatPrice(promotion.appliedDiscount)}
      </p>
      {promotion.terms?.length ?
        <ul
          className={
            isHeritage ?
              "mt-2 list-disc pl-4 text-[11px] text-white/55 space-y-0.5"
            : "mt-2 list-disc pl-4 text-[11px] text-gray-500 space-y-0.5"
          }
        >
          {promotion.terms.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      : null}
    </div>
  );
}
