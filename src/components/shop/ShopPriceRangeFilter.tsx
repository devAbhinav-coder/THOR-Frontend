"use client";

import { useMemo } from "react";
import { formatPrice } from "@/lib/utils";
import {
  SHOP_PRICE_FILTER_MAX,
  SHOP_PRICE_FILTER_MIN,
  resolveShopPriceDraft,
} from "@/lib/shopFilters";

type Props = {
  minPrice: string;
  maxPrice: string;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
};

function parseInputPrice(raw: string): number | null {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return null;
  const value = Number.parseInt(digits, 10);
  return Number.isFinite(value) ? value : null;
}

export default function ShopPriceRangeFilter({
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
}: Props) {
  const { min, max } = useMemo(
    () => resolveShopPriceDraft(minPrice, maxPrice),
    [minPrice, maxPrice],
  );

  const rangeSpan = SHOP_PRICE_FILTER_MAX - SHOP_PRICE_FILTER_MIN;
  const minPercent = ((min - SHOP_PRICE_FILTER_MIN) / rangeSpan) * 100;
  const maxPercent = ((max - SHOP_PRICE_FILTER_MIN) / rangeSpan) * 100;

  const setMin = (value: number) => {
    const nextMin = Math.min(value, max);
    onMinPriceChange(String(nextMin));
    if (value > max) onMaxPriceChange(String(value));
  };

  const setMax = (value: number) => {
    const nextMax = Math.max(value, min);
    onMaxPriceChange(String(nextMax));
    if (value < min) onMinPriceChange(String(value));
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-gray-500">Selected Price Range</p>
        <p className="mt-1 text-base font-semibold text-gray-800">
          {formatPrice(min)} – {formatPrice(max)}
        </p>
      </div>

      <div
        className="shop-price-range"
        style={
          {
            "--range-min": minPercent,
            "--range-max": maxPercent,
          } as React.CSSProperties
        }
      >
        <div className="shop-price-range__track" aria-hidden />
        <div className="shop-price-range__fill" aria-hidden />
        <input
          type="range"
          min={SHOP_PRICE_FILTER_MIN}
          max={SHOP_PRICE_FILTER_MAX}
          step={1}
          value={min}
          onChange={(e) => setMin(Number(e.target.value))}
          aria-label="Minimum price"
          aria-valuemin={SHOP_PRICE_FILTER_MIN}
          aria-valuemax={SHOP_PRICE_FILTER_MAX}
          aria-valuenow={min}
          className="shop-price-range__input shop-price-range__input--min"
        />
        <input
          type="range"
          min={SHOP_PRICE_FILTER_MIN}
          max={SHOP_PRICE_FILTER_MAX}
          step={1}
          value={max}
          onChange={(e) => setMax(Number(e.target.value))}
          aria-label="Maximum price"
          aria-valuemin={SHOP_PRICE_FILTER_MIN}
          aria-valuemax={SHOP_PRICE_FILTER_MAX}
          aria-valuenow={max}
          className="shop-price-range__input shop-price-range__input--max"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <label className="block">
          <span className="sr-only">Minimum price</span>
          <input
            type="text"
            inputMode="numeric"
            value={`₹${min}`}
            onChange={(e) => {
              const parsed = parseInputPrice(e.target.value);
              if (parsed === null) return;
              setMin(
                Math.min(
                  SHOP_PRICE_FILTER_MAX,
                  Math.max(SHOP_PRICE_FILTER_MIN, parsed),
                ),
              );
            }}
            className="w-full border-0 border-b border-gray-200 bg-transparent py-1 text-center text-sm text-gray-500 focus:border-[#c5a059] focus:outline-none focus:ring-0"
          />
        </label>
        <label className="block">
          <span className="sr-only">Maximum price</span>
          <input
            type="text"
            inputMode="numeric"
            value={`₹${max}`}
            onChange={(e) => {
              const parsed = parseInputPrice(e.target.value);
              if (parsed === null) return;
              setMax(
                Math.min(
                  SHOP_PRICE_FILTER_MAX,
                  Math.max(SHOP_PRICE_FILTER_MIN, parsed),
                ),
              );
            }}
            className="w-full border-0 border-b border-gray-200 bg-transparent py-1 text-center text-sm text-gray-500 focus:border-[#c5a059] focus:outline-none focus:ring-0"
          />
        </label>
      </div>
    </div>
  );
}
