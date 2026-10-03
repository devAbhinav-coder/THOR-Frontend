import type { Promotion, PromotionType } from "@/types";

type PromoLike = Pick<
  Promotion,
  | "promotionType"
  | "buyQuantity"
  | "getQuantity"
  | "getDiscountPercent"
  | "getItemFixedPrice"
  | "discountValue"
  | "maxDiscountAmount"
>;

function formatRupee(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

function bogoUsesFixedGetPrice(p: PromoLike): boolean {
  const fixed = p.getItemFixedPrice;
  return fixed != null && Number.isFinite(Number(fixed)) && Number(fixed) >= 0;
}

/** Mirrors backend promotionDisplayLabel for admin preview & list. */
export function formatPromotionOfferLabel(p: PromoLike): string {
  const buy = Math.max(1, Math.floor(Number(p.buyQuantity) || 1));
  const get = Math.max(1, Math.floor(Number(p.getQuantity) || 1));
  const pct = Number(p.getDiscountPercent ?? 100);
  const maxCap = Number(p.maxDiscountAmount) || 0;

  if (p.promotionType === "bogo") {
    if (bogoUsesFixedGetPrice(p)) {
      return `Buy ${buy} Get ${get} at ${formatRupee(Number(p.getItemFixedPrice))}`;
    }
    if (pct >= 100) return `Buy ${buy} Get ${get} Free`;
    return `Buy ${buy} Get ${get} at ${pct}% off`;
  }
  if (p.promotionType === "percentage") {
    const pctVal = p.discountValue ?? 0;
    const capSuffix = maxCap > 0 ? ` up to ${formatRupee(maxCap)}` : "";
    if (buy > 1) return `Buy ${buy}+ · ${pctVal}% off${capSuffix}`;
    return `${pctVal}% off${capSuffix}`;
  }
  const amt = p.discountValue ?? 0;
  const flatAmt = formatRupee(amt);
  if (buy > 1) return `Buy ${buy}+ · ${flatAmt} off`;
  return `${flatAmt} off`;
}

export type BogoRewardMode = "free" | "percent" | "fixed";

export function inferBogoRewardMode(p: {
  getItemFixedPrice?: number | null;
  getDiscountPercent?: number;
}): BogoRewardMode {
  if (
    p.getItemFixedPrice != null &&
    Number.isFinite(Number(p.getItemFixedPrice))
  ) {
    return "fixed";
  }
  if ((p.getDiscountPercent ?? 100) < 100) return "percent";
  return "free";
}

export function promotionTypeLabel(type: PromotionType): string {
  if (type === "bogo") return "Buy X Get Y";
  if (type === "percentage") return "Percentage off";
  return "Flat ₹ off";
}
