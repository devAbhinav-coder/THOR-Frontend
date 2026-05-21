"use client";

import type { Coupon } from "@/types";
import {
  couponDiscountShort,
  couponEligibilityBadge,
  couponPrimaryLine,
  couponSavingsLine,
  couponShopperTerms,
} from "@/lib/couponDisplay";

type Props = {
  coupon: Coupon;
};

/** Storefront coupon card copy — description, savings, and shopper-friendly terms. */
export function CouponOfferPreview({ coupon }: Props) {
  const badge = couponEligibilityBadge(coupon);
  const primary = couponPrimaryLine(coupon);
  const savings = couponSavingsLine(coupon);
  const terms = couponShopperTerms(coupon);
  const hasDescription = Boolean(coupon.description?.trim());

  return (
    <>
      <div className='flex items-center justify-between gap-2 min-w-0'>
        <span className='font-mono font-bold text-sm text-brand-700 truncate'>
          {coupon.code}
        </span>
        {badge ?
          <span className='text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 uppercase shrink-0'>
            {badge}
          </span>
        : hasDescription ?
          <span className='text-[10px] px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 shrink-0'>
            {couponDiscountShort(coupon)}
          </span>
        : null}
      </div>
      <p className='text-xs text-gray-800 mt-1 font-medium leading-snug line-clamp-2'>
        {primary}
      </p>
      {/* {savings ?
        <p className="text-xs text-brand-700 mt-0.5">{savings}</p>
      : null} */}
      {terms.length > 0 ?
        <p className='text-[11px] text-gray-500 mt-1 leading-snug'>
          {terms.join(" · ")}
        </p>
      : null}
    </>
  );
}
