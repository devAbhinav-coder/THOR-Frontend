import {
  promotionTickerHeadline,
  promotionTickerSubline,
} from "@/lib/promotionDisplay";
import type {
  PublicCoupon,
  PublicPromotion,
  PublicSale,
} from "@/types";

export type StorefrontPublicOffersBundle = {
  coupons: PublicCoupon[];
  campaigns: PublicSale[];
  promotions: PublicPromotion[];
};

function saleDiscountLabel(
  type: PublicSale["discountType"],
  value: number,
): string {
  if (type === "percentage") return `${value}% OFF`;
  if (type === "fixed") return `At ₹${value}`;
  return `₹${value} OFF`;
}

function saleMarqueeLine(sale: PublicSale): string {
  const name = sale.name?.trim() || "Sale";
  const badge = sale.badgeText?.trim();
  const discount = saleDiscountLabel(sale.discountType, sale.discountValue);
  const desc = sale.description?.trim();
  const core =
    badge && badge.toLowerCase() !== name.toLowerCase() ?
      `${name} · ${badge} · ${discount}`
    : `${name} · ${discount}`;
  if (desc && !core.toLowerCase().includes(desc.toLowerCase())) {
    return `${core} — ${desc}`;
  }
  return core;
}

function promotionMarqueeLine(promo: PublicPromotion): string {
  const headline = promotionTickerHeadline(promo);
  const sub = promotionTickerSubline(promo);
  return sub ? `${headline} — ${sub}` : headline;
}

function couponDiscountShort(coupon: PublicCoupon): string {
  if (coupon.discountType === "percentage") {
    let line = `${coupon.discountValue}% off`;
    if ((coupon.maxDiscountAmount ?? 0) > 0) {
      line += ` up to ₹${coupon.maxDiscountAmount}`;
    }
    return line;
  }
  if (coupon.discountType === "fixed") {
    return `At ₹${coupon.discountValue}`;
  }
  return `₹${coupon.discountValue} off`;
}

function couponMarqueeLine(coupon: PublicCoupon): string {
  const code = coupon.code?.trim();
  const desc = coupon.description?.trim();
  const primary = desc || couponDiscountShort(coupon);
  if (code) {
    return primary.toLowerCase().includes(code.toLowerCase()) ?
        primary
      : `Code ${code} · ${primary}`;
  }
  return primary;
}

function pushUnique(lines: string[], seen: Set<string>, raw: string) {
  const text = raw.replace(/\s+/g, " ").trim();
  if (!text) return;
  const key = text.toLowerCase();
  if (seen.has(key)) return;
  seen.add(key);
  lines.push(text);
}

/** One scrolling line per announcement, sale, auto-offer, or public coupon. */
export function buildHomePromoMarqueeLines(
  announcementMessages: readonly string[] = [],
  offers?: StorefrontPublicOffersBundle | null,
): string[] {
  const lines: string[] = [];
  const seen = new Set<string>();

  for (const msg of announcementMessages) {
    pushUnique(lines, seen, String(msg || ""));
  }

  if (!offers) return lines;

  for (const sale of offers.campaigns ?? []) {
    pushUnique(lines, seen, saleMarqueeLine(sale));
  }
  for (const promo of offers.promotions ?? []) {
    pushUnique(lines, seen, promotionMarqueeLine(promo));
  }
  for (const coupon of offers.coupons ?? []) {
    pushUnique(lines, seen, couponMarqueeLine(coupon));
  }

  return lines;
}
