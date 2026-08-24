"use client";

import { AlertCircle, CheckCircle2, Loader2, MapPin, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeliveryEstimate } from "@/lib/deliveryEstimate";
import {
  formatDeliveryDateRange,
  formatPromisedDate,
} from "@/lib/deliveryEstimate";

type DeliveryEstimateCardProps = {
  pincode: string | null;
  estimate: DeliveryEstimate | null;
  isLoading: boolean;
  error: string | null;
  displayCity?: string;
  className?: string;
};

export default function DeliveryEstimateCard({
  pincode,
  estimate,
  isLoading,
  error,
  displayCity,
  className,
}: DeliveryEstimateCardProps) {
  if (!pincode || pincode.length !== 6) {
    return (
      <div
        className={cn(
          "border border-dashed border-gray-300 bg-[#f8f9fa]/60 px-3 py-3 text-xs leading-relaxed text-gray-500 sm:px-4 sm:py-4 sm:text-sm",
          className,
        )}
      >
        Enter your 6-digit pincode to see when this order will arrive.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 border border-gray-200/70 bg-white px-3 py-3 sm:px-4 sm:py-4",
          className,
        )}
        aria-live="polite"
        aria-busy="true"
      >
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#c5a059] sm:h-5 sm:w-5" />
        <p className="min-w-0 truncate text-xs text-gray-600 sm:text-sm">
          Checking delivery to {pincode}…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          "flex items-start gap-2.5 border border-amber-200 bg-amber-50/80 px-3 py-3 sm:gap-3 sm:px-4 sm:py-4",
          className,
        )}
        role="alert"
      >
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 sm:h-5 sm:w-5" />
        <div className="min-w-0">
          <p className="text-xs font-medium text-amber-900 sm:text-sm">
            Could not verify delivery
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-amber-800/90 sm:text-xs">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!estimate) return null;

  const cityLabel = displayCity || estimate.city;
  const locationShort = [cityLabel, pincode].filter(Boolean).join(" · ");
  const locationFull = [cityLabel, estimate.state, pincode]
    .filter(Boolean)
    .join(", ");

  if (!estimate.serviceable) {
    return (
      <div
        className={cn(
          "flex items-start gap-2.5 border border-red-200 bg-red-50/80 px-3 py-3 sm:gap-3 sm:px-4 sm:py-4",
          className,
        )}
        role="alert"
      >
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 sm:h-5 sm:w-5" />
        <div className="min-w-0">
          <p className="text-xs font-semibold leading-snug text-red-900 sm:text-sm">
            Delivery unavailable to {locationShort || `PIN ${pincode}`}
          </p>
          {estimate.message && (
            <p className="mt-1 text-[11px] leading-snug text-red-800/90 sm:text-xs">
              {estimate.message}
            </p>
          )}
        </div>
      </div>
    );
  }

  const promised = estimate.promisedDate || estimate.estimatedDelivery.to;
  const windowLabel = formatDeliveryDateRange(
    estimate.estimatedDelivery.from,
    estimate.estimatedDelivery.to,
  );

  return (
    <div
      className={cn(
        "overflow-hidden border border-emerald-200/80 bg-emerald-50/50 px-3 py-3 sm:px-5 sm:py-5",
        className,
      )}
    >
      <div className="flex items-start gap-2.5 sm:gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-emerald-100 text-emerald-800 sm:h-9 sm:w-9">
          <Truck className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-navy-900 sm:text-sm">
            <MapPin className="h-3 w-3 shrink-0 text-[#c5a059] sm:h-3.5 sm:w-3.5" aria-hidden />
            <span className="min-w-0 truncate">
              <span className="sm:hidden">{locationShort || `PIN ${pincode}`}</span>
              <span className="hidden sm:inline">
                Delivering to {locationFull || `PIN ${pincode}`}
              </span>
            </span>
            <CheckCircle2
              className="h-3.5 w-3.5 shrink-0 text-emerald-600 sm:h-4 sm:w-4"
              aria-label="Serviceable"
            />
          </p>
          <p className="mt-1 font-serif text-lg font-medium leading-tight text-navy-900 sm:mt-2 sm:text-xl">
            Get it by {formatPromisedDate(promised)}
          </p>
          <p className="mt-1 truncate text-[11px] leading-snug text-gray-600 sm:text-xs">
            {windowLabel}
            {estimate.zoneLabel ? ` · ${estimate.zoneLabel}` : ""}
          </p>
          <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-gray-400">
            via {estimate.carrier}
          </p>
        </div>
      </div>
    </div>
  );
}
