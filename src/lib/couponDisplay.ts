import { formatPrice } from "@/lib/utils";
import type { Coupon } from "@/types";

/** Short savings label, e.g. "5% off", "₹200 off", or "At ₹1150" for Direct Price. */
export function couponDiscountShort(coupon: Coupon): string {
  if (coupon.discountType === "percentage") {
    return `${coupon.discountValue}% off`;
  }
  if (coupon.discountType === "fixed") {
    return `At ${formatPrice(coupon.discountValue)}`;
  }
  return `${formatPrice(coupon.discountValue)} off`;
}

/** Main line shoppers should read first — admin description when set. */
export function couponPrimaryLine(coupon: Coupon): string {
  const desc = coupon.description?.trim();
  if (desc) return desc;
  return couponDiscountShort(coupon);
}

/** Extra savings line when description is set (so %/flat is still visible). */
export function couponSavingsLine(coupon: Coupon): string | null {
  if (!coupon.description?.trim()) return null;
  return couponDiscountShort(coupon);
}

/** User-facing conditions (not usage counts or admin order-range fields). */
export function couponShopperTerms(coupon: Coupon): string[] {
  const terms: string[] = [];

  const minOrder = coupon.minOrderAmount ?? 0;
  if (minOrder > 0) {
    terms.push(`Min. order ${formatPrice(minOrder)}`);
  }

  if (coupon.discountType === "percentage" && (coupon.maxDiscountAmount ?? 0) > 0) {
    terms.push(`Up to ${formatPrice(coupon.maxDiscountAmount!)} off`);
  }

  if (coupon.expiryDate) {
    const exp = new Date(coupon.expiryDate);
    if (!Number.isNaN(exp.getTime())) {
      terms.push(
        `Valid till ${exp.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}`,
      );
    }
  }

  if (coupon.eligibilityType === "first_order") {
    terms.push("First order only");
  } else if (coupon.eligibilityType === "returning") {
    terms.push("Returning customers");
    const min = coupon.minCompletedOrders ?? 0;
    if (min > 0) {
      terms.push(`After ${min} completed ${min === 1 ? "order" : "orders"}`);
    }
  }

  return terms;
}

/** Badge for special eligibility only (skip generic "All users"). */
export function couponEligibilityBadge(coupon: Coupon): string | null {
  if (coupon.eligibilityType === "first_order") return "New customers";
  if (coupon.eligibilityType === "returning") return "Returning";
  return null;
}

export function findCouponByCode(
  coupons: Coupon[],
  code: string | null | undefined,
): Coupon | undefined {
  if (!code?.trim()) return undefined;
  const normalized = code.trim().toUpperCase();
  return coupons.find((c) => c.code.trim().toUpperCase() === normalized);
}
