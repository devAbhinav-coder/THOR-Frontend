"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MapPin,
  Truck,
} from "lucide-react";
import { useDeliveryEstimate } from "@/hooks/useDeliveryEstimate";
import { formatPromisedDate } from "@/lib/deliveryEstimate";
import { cn } from "@/lib/utils";

type PdpDeliveryCheckProps = {
  className?: string;
};

export function PdpDeliveryCheck({ className }: PdpDeliveryCheckProps) {
  const [pinInput, setPinInput] = useState("");

  const activePincode = useMemo(() => {
    const pin = pinInput.replace(/\D/g, "").slice(0, 6);
    return pin.length === 6 ? pin : null;
  }, [pinInput]);

  const {
    estimate: estimateRaw,
    isLoading,
    error,
  } = useDeliveryEstimate(activePincode);

  const estimate = estimateRaw?.pincode === activePincode ? estimateRaw : null;
  const isChecking =
    Boolean(activePincode) && (isLoading || (!estimate && !error));

  const hasResult =
    Boolean(error) ||
    (estimate && !isChecking) ||
    (activePincode && isChecking);

  return (
    <div className={cn("min-w-0 flex-1 sm:max-w-[15rem]", className)}>
      <div className='flex items-center justify-end gap-1.5 sm:mb-2'>
        <Truck
          className='h-3 w-3 shrink-0 text-[#c5a059] sm:h-3.5 sm:w-3.5'
          strokeWidth={1.5}
          aria-hidden
        />
        <p className='text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-900 sm:text-[11px] sm:tracking-[0.18em]'>
          Delivery
        </p>
      </div>

      <div className='relative mt-1 sm:mt-0'>
        <MapPin
          className='pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[#c5a059]/75 sm:left-3 sm:h-3.5 sm:w-3.5'
          strokeWidth={1.5}
          aria-hidden
        />
        <input
          id='pdp-delivery-pincode'
          type='text'
          inputMode='numeric'
          pattern='[0-9]*'
          maxLength={6}
          placeholder='Enter Your PIN Code'
          value={pinInput}
          onChange={(e) =>
            setPinInput(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          autoComplete='postal-code'
          aria-label='Enter 6-digit PIN code to check delivery'
          className='h-8 w-full rounded-full border border-[#c5a059]/25 bg-white py-1 pl-7 pr-3 text-[11px] tracking-[0.14em] text-navy-900 shadow-sm placeholder:tracking-normal placeholder:text-gray-400 focus:border-[#c5a059]/55 focus:outline-none focus:ring-2 focus:ring-[#c5a059]/15 sm:h-9 sm:pl-8 sm:text-xs'
        />
      </div>

      {hasResult ?
        <div
          className='mt-1.5 text-right'
          aria-live='polite'
          aria-busy={isChecking}
        >
          {activePincode && isChecking ?
            <p className='flex items-center justify-end gap-1 text-[9px] text-gray-500 sm:text-[10px]'>
              <Loader2
                className='h-2.5 w-2.5 shrink-0 animate-spin text-[#c5a059] sm:h-3 sm:w-3'
                aria-hidden
              />
              Checking…
            </p>
          : null}

          {error && !isChecking ?
            <p
              className='flex items-start justify-end gap-1 text-[9px] leading-snug text-amber-800 sm:text-[10px]'
              role='alert'
            >
              <AlertCircle
                className='mt-px h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3'
                aria-hidden
              />
              <span className='text-left'>{error}</span>
            </p>
          : null}

          {estimate && !estimate.serviceable && !isChecking ?
            <p
              className='flex items-start justify-end gap-1 text-[9px] leading-snug text-red-700 sm:text-[10px]'
              role='alert'
            >
              <AlertCircle
                className='mt-px h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3'
                aria-hidden
              />
              <span className='text-left'>
                Not available
                {estimate.city ? ` · ${estimate.city}` : ""}
              </span>
            </p>
          : null}

          {estimate?.serviceable && !isChecking ?
            <p className='text-[9px] leading-snug sm:text-[10px]'>
              <span className='inline-flex items-center justify-end gap-1 font-semibold text-emerald-800'>
                <CheckCircle2
                  className='h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3'
                  aria-hidden
                />
                By{" "}
                {formatPromisedDate(
                  estimate.promisedDate || estimate.estimatedDelivery.to,
                )}
              </span>
              {estimate.city ?
                <span className='mt-0.5 block truncate text-gray-500'>
                  {estimate.city}
                </span>
              : null}
            </p>
          : null}
        </div>
      : <p className='mt-1 hidden text-[9px] text-gray-400 sm:block sm:text-[10px]'>
          Check delivery availability
        </p>
      }
    </div>
  );
}
