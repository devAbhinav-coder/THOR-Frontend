"use client";

import { Tag } from "lucide-react";
import type { Coupon } from "@/types";
import {
  findCouponByCode,
  couponPrimaryLine,
  couponSavingsLine,
} from "@/lib/couponDisplay";
import { formatPrice } from "@/lib/utils";

type Props = {
  code: string | null | undefined;
  savedAmount: number;
  eligibleCoupons?: Coupon[];
  helperText?: string;
};

export function CouponAppliedBanner({
  code,
  savedAmount,
  eligibleCoupons = [],
  helperText = "The discount is included in your total below.",
}: Props) {
  const meta = findCouponByCode(eligibleCoupons, code);
  const detail = meta ? couponPrimaryLine(meta) : null;
  const savings = meta ? couponSavingsLine(meta) : null;

  return (
    <div className='flex items-start gap-2 min-w-0'>
      <Tag className='h-4 w-4 text-green-700 shrink-0 mt-0.5' aria-hidden />
      <div className='min-w-0'>
        <p className='text-sm font-medium text-green-900 break-words'>
          <span className='font-semibold tracking-wide'>
            {code || "Coupon"}
          </span>
          <span className='text-green-800'>
            {" "}
            · You save {formatPrice(savedAmount)}
          </span>
        </p>
        {detail ?
          <p className='text-xs text-green-800/90 mt-1 leading-snug line-clamp-2'>
            {detail}
          </p>
        : null}
        {/* {savings ?
          <p className="text-xs text-green-800/80 mt-0.5">{savings}</p>
        : null} */}
        <p className='text-xs text-green-800/75 mt-1'>{helperText}</p>
      </div>
    </div>
  );
}
