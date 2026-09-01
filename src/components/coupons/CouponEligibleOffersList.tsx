"use client";

import { cn } from "@/lib/utils";
import type { Coupon, NearEligibleCoupon } from "@/types";
import { CouponOfferPreview } from "@/components/coupons/CouponOfferPreview";

type Variant = "heritage" | "light";

type Props = {
  eligibleCoupons: Coupon[];
  nearEligibleCoupons?: NearEligibleCoupon[];
  isLoading?: boolean;
  hasCouponApplied?: boolean;
  couponLoading?: boolean;
  onApply: (code: string) => void | Promise<void>;
  variant?: Variant;
  emptyText?: string;
  loadingText?: string;
};

const variantStyles: Record<
  Variant,
  {
    empty: string;
    loading: string;
    sectionLabel: string;
    card: string;
    cardDisabled: string;
    cardHover: string;
    nearCard: string;
  }
> = {
  heritage: {
    empty: "text-xs text-white/50",
    loading: "text-xs text-white/50",
    sectionLabel:
      "text-[10px] font-semibold uppercase tracking-widest text-[#ffdea5]/80",
    card: "w-full min-w-0 border border-[#c5a059]/25 bg-white p-3 text-left transition-all",
    cardDisabled: "cursor-not-allowed opacity-50",
    cardHover: "hover:border-[#c5a059]/60 hover:bg-[#fff8eb]/80 hover:shadow-sm",
    nearCard:
      "w-full min-w-0 border border-[#c5a059]/20 bg-[#fff8eb]/60 p-3 text-left",
  },
  light: {
    empty: "text-xs text-gray-500",
    loading: "text-xs text-gray-500",
    sectionLabel:
      "text-[10px] font-semibold uppercase tracking-widest text-[#8a6d3b]",
    card: "w-full min-w-0 border border-[#c5a059]/25 bg-white p-3 text-left transition-all",
    cardDisabled: "cursor-not-allowed opacity-50",
    cardHover: "hover:border-[#c5a059]/60 hover:bg-[#fff8eb]/80 hover:shadow-sm",
    nearCard:
      "w-full min-w-0 border border-[#c5a059]/20 bg-[#fff8eb]/50 p-3 text-left",
  },
};

export function CouponEligibleOffersList({
  eligibleCoupons,
  nearEligibleCoupons = [],
  isLoading = false,
  hasCouponApplied = false,
  couponLoading = false,
  onApply,
  variant = "light",
  emptyText = "No coupons are available for this cart.",
  loadingText = "Loading available offers…",
}: Props) {
  const styles = variantStyles[variant];
  const totalOffers = eligibleCoupons.length + nearEligibleCoupons.length;
  const disabled = hasCouponApplied || couponLoading;

  if (isLoading) {
    return <p className={styles.loading}>{loadingText}</p>;
  }

  if (totalOffers === 0) {
    return <p className={styles.empty}>{emptyText}</p>;
  }

  return (
    <div className="space-y-3">
      {eligibleCoupons.length > 0 && (
        <div className="space-y-2">
          {eligibleCoupons.length > 0 && nearEligibleCoupons.length > 0 && (
            <p className={styles.sectionLabel}>Ready to apply</p>
          )}
          {eligibleCoupons.map((c) => (
            <button
              key={c._id}
              type="button"
              title={
                hasCouponApplied
                  ? "Remove your current coupon to use another"
                  : undefined
              }
              onClick={() => void onApply(c.code)}
              className={cn(
                styles.card,
                disabled ? styles.cardDisabled : styles.cardHover,
              )}
              disabled={disabled}
            >
              <CouponOfferPreview coupon={c} />
            </button>
          ))}
        </div>
      )}

      {nearEligibleCoupons.length > 0 && (
        <div className="space-y-2">
          <p className={styles.sectionLabel}>
            {eligibleCoupons.length > 0 ? "Unlock next" : "Offers you can unlock"}
          </p>
          {nearEligibleCoupons.map(({ coupon, hintMessage }) => (
            <div key={coupon._id} className={styles.nearCard} aria-disabled="true">
              <CouponOfferPreview coupon={coupon} hintMessage={hintMessage} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
