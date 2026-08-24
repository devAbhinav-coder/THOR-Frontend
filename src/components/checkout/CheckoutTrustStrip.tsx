"use client";

import { Lock, RotateCcw, Shield, Truck } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";

const SHIPPING_THRESHOLD = 1099;

type CheckoutTrustStripProps = {
  className?: string;
  variant?: "payment" | "compact";
  subtotal?: number;
};

export default function CheckoutTrustStrip({
  className,
  variant = "payment",
  subtotal = 0,
}: CheckoutTrustStripProps) {
  const freeShippingEligible = subtotal >= SHIPPING_THRESHOLD;

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500",
          className,
        )}
      >
        <span className="inline-flex items-center gap-1">
          <Lock className="h-3 w-3 text-[#c5a059]" aria-hidden />
          SSL Secured
        </span>
        <span className="inline-flex items-center gap-1">
          <Shield className="h-3 w-3 text-[#c5a059]" aria-hidden />
          Razorpay
        </span>
        <span className="inline-flex items-center gap-1">
          <RotateCcw className="h-3 w-3 text-[#c5a059]" aria-hidden />
          Easy Returns
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-2.5 border border-gray-200/70 bg-[#f8f9fa]/80 p-3 sm:grid-cols-4 sm:gap-3 sm:p-4",
        className,
      )}
    >
      {(
        [
          {
            Icon: Lock,
            title: "256-bit SSL",
            desc: "Your data is encrypted",
          },
          {
            Icon: Shield,
            title: "Razorpay Secure",
            desc: "UPI · Cards · Net banking",
          },
          {
            Icon: Truck,
            title: freeShippingEligible ? "Free Delivery" : "Pan-India Shipping",
            desc:
              freeShippingEligible ?
                "Complimentary on this order"
              : `Free above ${formatPrice(SHIPPING_THRESHOLD)}`,
          },
          {
            Icon: RotateCcw,
            title: "Easy Returns",
            desc: "Hassle-free return policy",
          },
        ] as const
      ).map(({ Icon, title, desc }) => (
        <div key={title} className="flex items-start gap-2.5">
          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#c5a059]" aria-hidden />
          <div>
            <p className="text-[11px] font-semibold text-navy-900">{title}</p>
            <p className="mt-0.5 text-[10px] leading-snug text-gray-500">
              {desc}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
