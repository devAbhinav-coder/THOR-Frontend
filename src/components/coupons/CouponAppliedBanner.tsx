"use client";

import { Tag } from "lucide-react";
import type { Coupon } from "@/types";
import {
  findCouponByCode,
  couponPrimaryLine,
} from "@/lib/couponDisplay";
import { formatPrice, cn } from "@/lib/utils";

type Props = {
  code: string | null | undefined;
  savedAmount: number;
  eligibleCoupons?: Coupon[];
  helperText?: string;
  variant?: "default" | "heritage";
};

export function CouponAppliedBanner({
  code,
  savedAmount,
  eligibleCoupons = [],
  helperText = "The discount is included in your total below.",
  variant = "default",
}: Props) {
  const meta = findCouponByCode(eligibleCoupons, code);
  const detail = meta ? couponPrimaryLine(meta) : null;
  const isHeritage = variant === "heritage";

  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <Tag
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0",
          isHeritage ? "text-[#c5a059]" : "text-green-700",
        )}
        aria-hidden
      />
      <div className="min-w-0">
        <p
          className={cn(
            "break-words text-sm font-medium",
            isHeritage ? "text-navy-900" : "text-green-900",
          )}
        >
          <span className="font-semibold tracking-wide">
            {code || "Coupon"}
          </span>
          <span className={isHeritage ? "text-[#b8924d]" : "text-green-800"}>
            {" "}
            · You save {formatPrice(savedAmount)}
          </span>
        </p>
        {detail ? (
          <p
            className={cn(
              "mt-1 line-clamp-2 text-xs leading-snug",
              isHeritage ? "text-gray-600" : "text-green-800/90",
            )}
          >
            {detail}
          </p>
        ) : null}
        <p
          className={cn(
            "mt-1 text-xs",
            isHeritage ? "text-gray-500" : "text-green-800/75",
          )}
        >
          {helperText}
        </p>
      </div>
    </div>
  );
}
