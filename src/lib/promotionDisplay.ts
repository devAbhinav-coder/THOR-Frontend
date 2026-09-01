import type {
  ProductNearEligiblePromotion,
  ProductPromotion,
} from "@/types";

type PromoLike = ProductPromotion & { hintMessage?: string; progressHint?: string };

/** Main ticker line — same treatment for BOGO, flat & percentage. */
export function promotionTickerHeadline(promo: PromoLike): string {
  const label = promo.label?.trim();
  const title = promo.displayTitle?.trim();
  if (promo.badgeText?.trim() && label) {
    return `${promo.badgeText.trim()} · ${label}`;
  }
  if (title && label && title.toLowerCase() !== label.toLowerCase()) {
    return label;
  }
  return label || title || "Special offer";
}

/** Secondary line — progress hint when qty/min not met, else description. */
export function promotionTickerSubline(promo: PromoLike): string | undefined {
  const hint = (promo.hintMessage || promo.progressHint)?.trim();
  const desc = promo.description?.trim();
  const title = promo.displayTitle?.trim();
  const label = promo.label?.trim();

  if (hint) return hint;
  if (desc && desc !== label) return desc;
  if (title && title !== label) return title;
  return undefined;
}

export function mergeProductPromotionsForTicker(
  active: ProductPromotion[] = [],
  nearEligible: ProductNearEligiblePromotion[] = [],
): PromoLike[] {
  return [...active, ...nearEligible];
}
