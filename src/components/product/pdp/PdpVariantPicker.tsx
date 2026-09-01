"use client";

import { useState } from "react";
import { Minus, Plus, Ruler } from "lucide-react";
import type { ProductVariant } from "@/types";
import { cn } from "@/lib/utils";
import { variantSwatchBackground } from "@/lib/variantSwatch";
import { colorsMatch } from "@/lib/productColorImages";
import { getVariantStockDisplay } from "@/lib/stockDisplay";
import { clampPurchaseQty } from "@/lib/variantLimits";
import { PdpSizeGuideModal } from "./PdpSizeGuideModal";
import type { PdpSizeGuideData } from "./pdpSizeGuideContent";
import { PdpDeliveryCheck } from "./PdpDeliveryCheck";

type PdpVariantPickerProps = {
  sizes: string[];
  colors: string[];
  variants: ProductVariant[];
  selectedVariant: ProductVariant | null;
  quantity: number;
  maxQty: number;
  category?: string;
  productName?: string;
  sizeGuide?: PdpSizeGuideData;
  onSelectVariant: (v: ProductVariant) => void;
  onSelectColor: (v: ProductVariant) => void;
  onQuantityChange: (q: number) => void;
  getVariant: (size?: string, color?: string) => ProductVariant | undefined;
};

export function PdpVariantPicker({
  sizes,
  colors,
  variants,
  selectedVariant,
  quantity,
  maxQty,
  category,
  productName,
  sizeGuide,
  onSelectVariant,
  onSelectColor,
  onQuantityChange,
  getVariant,
}: PdpVariantPickerProps) {
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const showSizeGuide = sizeGuide?.enabled === true;
  const showSizeSection = sizes.length > 0;
  const showColorSection = colors.length > 0;
  const stock =
    selectedVariant ? getVariantStockDisplay(selectedVariant.stock) : null;

  return (
    <>
      <div className='space-y-3 rounded-xl border border-[#c5a059]/15 bg-[#faf8f4]/40 p-3 sm:space-y-4 sm:rounded-2xl sm:p-5'>
        {showSizeSection ?
          <div className='space-y-2'>
            <div className='flex items-center justify-between gap-2'>
              <p className='text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-900 sm:text-[11px] sm:tracking-[0.18em]'>
                Size
                <span className='ml-1.5 font-medium normal-case tracking-normal text-[#8a6d3b] sm:ml-2'>
                  {selectedVariant?.size || "Select"}
                </span>
              </p>
              {showSizeGuide ?
                <button
                  type='button'
                  onClick={() => setSizeGuideOpen(true)}
                  className='inline-flex shrink-0 items-center gap-1 rounded-full border border-[#c5a059]/30 bg-white px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#8a6d3b] transition-colors hover:border-[#c5a059]/55 hover:bg-[#fff8eb] sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-[10px]'
                >
                  <Ruler
                    className='h-3 w-3 sm:h-3.5 sm:w-3.5'
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  Size guide
                </button>
              : null}
            </div>
            <div className='flex flex-wrap gap-1.5 sm:gap-2'>
              {sizes.map((size) => {
                const v = getVariant(size, selectedVariant?.color);
                const ok = v && v.stock > 0;
                const selected = selectedVariant?.size === size;
                return (
                  <button
                    key={size}
                    type='button'
                    onClick={() => v && onSelectVariant(v)}
                    disabled={!ok}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition-all sm:min-w-[4.5rem] sm:px-4 sm:py-2 sm:text-xs",
                      selected ?
                        "border-navy-900 bg-navy-900 text-white shadow-sm"
                      : ok ?
                        "border-gray-200 bg-white text-gray-700 hover:border-[#c5a059]/50 hover:bg-white"
                      : "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300 line-through",
                    )}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        : null}

        {showColorSection ?
          <div
            className={cn(
              "space-y-2",
              showSizeSection && "border-t border-[#c5a059]/10 pt-3 sm:pt-4",
            )}
          >
            <p className='text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-900 sm:text-[11px] sm:tracking-[0.18em]'>
              {colors.length > 1 ? "Select shade" : "Shade"}
              {selectedVariant?.color ?
                <span className='ml-1.5 font-medium normal-case tracking-normal text-gray-500 sm:ml-2'>
                  · {selectedVariant.color}
                </span>
              : null}
            </p>
            <div className='flex flex-wrap gap-2'>
              {colors.map((color) => {
                const v =
                  getVariant(selectedVariant?.size, color) ||
                  variants.find(
                    (x) => colorsMatch(x.color, color) && x.stock > 0,
                  ) ||
                  variants.find((x) => colorsMatch(x.color, color));
                const ok = v && v.stock > 0;
                const swatch = variantSwatchBackground(
                  color,
                  (v as ProductVariant & { colorCode?: string })?.colorCode,
                );
                const selected = colorsMatch(selectedVariant?.color, color);
                return (
                  <button
                    key={color}
                    type='button'
                    aria-label={`${color}${ok ? "" : " — out of stock"}`}
                    aria-pressed={selected}
                    onClick={() => v && onSelectColor(v)}
                    disabled={!ok}
                    title={color}
                    style={swatch ? { background: swatch } : undefined}
                    className={cn(
                      "h-8 w-8 shrink-0 rounded-full transition-transform sm:h-10 sm:w-10",
                      selected && "scale-110 shadow-md",
                      ok && !selected && "hover:scale-105",
                      !ok && "cursor-not-allowed opacity-40",
                      !swatch &&
                        "flex items-center justify-center bg-gray-100 text-[9px] font-semibold uppercase text-gray-600",
                    )}
                  >
                    {!swatch ? color.slice(0, 2) : null}
                  </button>
                );
              })}
            </div>
          </div>
        : null}

        <div
          className={cn(
            "space-y-2 sm:space-y-2.5",
            (showSizeSection || showColorSection) &&
              "border-t border-[#c5a059]/10 pt-3 sm:pt-4",
          )}
        >
          <div className='flex items-start justify-between gap-2 sm:gap-4'>
            <div className='shrink-0'>
              <div className='flex flex-row'>
                <p className='mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-900 sm:mb-2 sm:text-[11px] sm:tracking-[0.18em]'>
                  Quantity
                </p>
                {stock ?
                  <div className='flex justify-start sm:justify-end'>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[9px] font-semibold sm:px-3 sm:py-1 sm:text-[10px]",
                        stock.tone === "out" && "bg-red-50 text-red-600",
                        stock.tone === "in" && "bg-emerald-50 text-emerald-700",
                      )}
                    >
                      {stock.label}
                    </span>
                  </div>
                : null}
              </div>
              <div className='inline-flex items-center overflow-hidden rounded-full border border-gray-200 bg-white shadow-sm'>
                <button
                  type='button'
                  onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                  className='px-2.5 py-1.5 text-gray-600 transition-colors hover:bg-gray-50 sm:px-3 sm:py-2'
                  aria-label='Decrease quantity'
                >
                  <Minus className='h-3.5 w-3.5 sm:h-4 sm:w-4' />
                </button>
                <span className='min-w-[2.25rem] border-x border-gray-200 px-2.5 py-1.5 text-center text-xs font-bold text-navy-900 sm:min-w-[2.75rem] sm:px-3 sm:py-2 sm:text-sm'>
                  {quantity}
                </span>
                <button
                  type='button'
                  onClick={() =>
                    onQuantityChange(
                      clampPurchaseQty(quantity + 1, selectedVariant),
                    )
                  }
                  disabled={quantity >= maxQty || maxQty < 1}
                  className='px-2.5 py-1.5 text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40 sm:px-3 sm:py-2'
                  aria-label='Increase quantity'
                >
                  <Plus className='h-3.5 w-3.5 sm:h-4 sm:w-4' />
                </button>
              </div>
            </div>

            <PdpDeliveryCheck />
          </div>
        </div>
      </div>

      {showSizeGuide ?
        <PdpSizeGuideModal
          open={sizeGuideOpen}
          onClose={() => setSizeGuideOpen(false)}
          category={category}
          productName={productName}
          sizes={sizes}
          sizeGuide={sizeGuide}
        />
      : null}
    </>
  );
}
