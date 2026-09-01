"use client";

import { Banknote, Wallet } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import {
  formatDeliveryDateRange,
  formatPromisedDate,
  type DeliveryEstimate,
} from "@/lib/deliveryEstimate";
import { COD_HANDLING_FEE, type ReviewAddressDisplay } from "./checkoutForm";

export function CheckoutReviewRecap({
  address,
  paymentMethod,
  deliveryEstimate,
  onEditAddress,
  onEditPayment,
  className,
}: {
  address: ReviewAddressDisplay;
  paymentMethod: "cod" | "razorpay";
  deliveryEstimate?: DeliveryEstimate | null;
  onEditAddress: () => void;
  onEditPayment: () => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <h2 className="mb-5 font-serif text-2xl font-medium text-navy-900 sm:mb-6 sm:text-3xl">
        Review Your Order
      </h2>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4 border border-gray-200/70 bg-white p-5">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
              Shipping Address
            </p>
            <p className="mt-2 font-medium text-navy-900">{address.name || "—"}</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-600 sm:text-sm">
              {address.house && (
                <>
                  {address.house}
                  <br />
                </>
              )}
              {address.street || "—"}
              {address.landmark && (
                <>
                  <br />
                  Near {address.landmark}
                </>
              )}
              <br />
              {address.city}
              {address.city && address.state ? ", " : ""}
              {address.state} {address.pincode}
            </p>
            {address.phone && (
              <p className="mt-3 text-sm text-gray-600">{address.phone}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onEditAddress}
            className="shrink-0 border-b border-[#c5a059] pb-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#c5a059] hover:text-navy-900"
          >
            Edit
          </button>
        </div>
        {deliveryEstimate?.serviceable && (
          <div className="border border-emerald-200/70 bg-emerald-50/40 p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
              Estimated Delivery
            </p>
            <p className="mt-2 text-sm font-semibold text-navy-900">
              Get it by{" "}
              {formatPromisedDate(
                deliveryEstimate.promisedDate ||
                  deliveryEstimate.estimatedDelivery.to,
              )}
            </p>
            <p className="mt-1 text-xs text-gray-600">
              Window{" "}
              {formatDeliveryDateRange(
                deliveryEstimate.estimatedDelivery.from,
                deliveryEstimate.estimatedDelivery.to,
              )}
              {deliveryEstimate.zoneLabel ? ` · ${deliveryEstimate.zoneLabel}` : ""}{" "}
              · via {deliveryEstimate.carrier}
            </p>
          </div>
        )}
        <div className="flex items-start justify-between gap-4 border border-gray-200/70 bg-white p-5">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
              Payment Method
            </p>
            <p className="mt-2 flex items-center gap-2 font-medium text-navy-900">
              {paymentMethod === "razorpay" ?
                <Wallet className="h-4 w-4 shrink-0 text-[#c5a059]" />
              : <Banknote className="h-4 w-4 shrink-0 text-[#c5a059]" />}
              <span className="text-sm sm:text-base">
                {paymentMethod === "razorpay" ?
                  "Pay online (UPI, cards & net banking)"
                : `Cash on delivery (${formatPrice(COD_HANDLING_FEE)} handling fee)`}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onEditPayment}
            className="shrink-0 border-b border-[#c5a059] pb-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#c5a059] hover:text-navy-900"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
