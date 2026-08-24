"use client";

import { Truck } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import type { DeliveryEstimate } from "@/lib/deliveryEstimate";
import { formatEtaShort } from "@/lib/deliveryEstimate";

type CheckoutMiniSummaryBarProps = {
  itemCount: number;
  total: number;
  estimate: DeliveryEstimate | null;
  isLoadingEstimate: boolean;
  className?: string;
};

export default function CheckoutMiniSummaryBar({
  itemCount,
  total,
  estimate,
  isLoadingEstimate,
  className,
}: CheckoutMiniSummaryBarProps) {
  const etaChip =
    estimate?.serviceable &&
    (estimate.promisedDate || estimate.estimatedDelivery.to) ?
      formatEtaShort(estimate.promisedDate || estimate.estimatedDelivery.to)
    : isLoadingEstimate ?
      "Checking…"
    : null;

  return (
    <div
      className={cn(
        "mb-2 flex min-w-0 items-center justify-between gap-3",
        className,
      )}
    >
      <p className="min-w-0 truncate text-sm font-semibold tabular-nums text-navy-900">
        {formatPrice(total)}
        <span className="ml-1.5 text-xs font-normal text-gray-500">
          · {itemCount} {itemCount === 1 ? "item" : "items"}
        </span>
      </p>
      {etaChip && (
        <p className="flex max-w-[48%] shrink-0 items-center gap-1 truncate text-[11px] text-emerald-700">
          <Truck className="h-3 w-3 shrink-0" aria-hidden />
          <span className="truncate">{etaChip}</span>
        </p>
      )}
    </div>
  );
}
