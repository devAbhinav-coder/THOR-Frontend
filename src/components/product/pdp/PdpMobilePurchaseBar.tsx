"use client";

import Image from "next/image";
import { Minus, Plus, ShoppingBag, Zap } from "lucide-react";
import type { ProductVariant } from "@/types";
import { cn } from "@/lib/utils";
import { clampPurchaseQty } from "@/lib/variantLimits";

type PdpMobilePurchaseBarProps = {
  productName: string;
  productImage?: string;
  quantity: number;
  maxQty: number;
  selectedVariant: ProductVariant | null;
  isOutOfStock: boolean;
  isAddingToCart: boolean;
  isBuyingNow: boolean;
  enriched: boolean;
  onAddToCart: () => void;
  onBuyNow: () => void;
  onQuantityChange: (q: number) => void;
  buyNowRef?: React.RefObject<HTMLButtonElement | null>;
};

const barShellClass =
  "fixed inset-x-0 bottom-0 z-[88] border-t border-gray-200/90 bg-white/95 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-8px_32px_rgba(0,13,33,0.12)] backdrop-blur-md";

export function PdpMobilePurchaseBar({
  productName,
  productImage,
  quantity,
  maxQty,
  selectedVariant,
  isOutOfStock,
  isAddingToCart,
  isBuyingNow,
  enriched,
  onAddToCart,
  onBuyNow,
  onQuantityChange,
  buyNowRef,
}: PdpMobilePurchaseBarProps) {
  return (
    <>
      {/* Mobile — always Add to Bag + Buy Now (no scroll transform) */}
      <div
        className={cn(barShellClass, "lg:hidden")}
        role="toolbar"
        aria-label="Purchase actions"
      >
        <div className="mx-auto max-w-7xl px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onAddToCart}
              disabled={isOutOfStock || isAddingToCart}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 border py-3.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors",
                isOutOfStock ?
                  "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                : "border-navy-900 bg-white text-navy-900 active:bg-navy-50",
              )}
            >
              {isAddingToCart ?
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-navy-900/30 border-t-navy-900" />
              : <>
                  <ShoppingBag className="h-4 w-4 shrink-0" aria-hidden />
                  Add to Bag
                </>
              }
            </button>
            <button
              ref={buyNowRef}
              type="button"
              onClick={onBuyNow}
              disabled={isOutOfStock || isBuyingNow}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 py-3.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors",
                isOutOfStock ?
                  "cursor-not-allowed bg-gray-200 text-gray-400"
                : "bg-[#c5a059] text-white active:bg-[#b8924f]",
              )}
            >
              {isBuyingNow ?
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              : <>
                  <Zap className="h-4 w-4 shrink-0" aria-hidden />
                  Buy Now
                </>
              }
            </button>
          </div>
        </div>
      </div>

      {/* Laptop — sticky shortcut bar only after scroll */}
      {enriched ?
        <div
          className={cn(
            barShellClass,
            "hidden shadow-[0_-10px_40px_rgba(0,13,33,0.16)] lg:block",
            "transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none",
          )}
          role="toolbar"
          aria-label="Purchase actions"
        >
          <div className="mx-auto max-w-7xl px-8 py-3">
            <div className="flex min-h-[4rem] items-center gap-4">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-sm border border-[#c5a059]/20 bg-[#faf8f4]">
                {productImage ?
                  <Image
                    src={productImage}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-100">
                    <ShoppingBag className="h-4 w-4 text-gray-400" aria-hidden />
                  </div>
                )}
              </div>

              <p className="min-w-0 flex-1 truncate text-sm font-medium leading-tight text-navy-900">
                {productName}
              </p>

              <div className="inline-flex shrink-0 items-center overflow-hidden rounded-full border border-gray-200 bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                  className="px-2.5 py-2 text-gray-600 transition-colors hover:bg-gray-50"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-[2rem] border-x border-gray-200 px-2.5 py-2 text-center text-sm font-bold text-navy-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onQuantityChange(
                      clampPurchaseQty(quantity + 1, selectedVariant),
                    )
                  }
                  disabled={quantity >= maxQty || maxQty < 1}
                  className="px-2.5 py-2 text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={onAddToCart}
                  disabled={isOutOfStock || isAddingToCart}
                  className={cn(
                    "inline-flex items-center gap-1.5 border border-navy-900 bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-navy-900 transition-colors hover:bg-navy-50",
                    isOutOfStock &&
                      "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400",
                  )}
                >
                  {isAddingToCart ?
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-navy-900/30 border-t-navy-900" />
                  : <>
                      <ShoppingBag className="h-4 w-4" aria-hidden />
                      Add to Bag
                    </>
                  }
                </button>
                <button
                  type="button"
                  onClick={onBuyNow}
                  disabled={isOutOfStock || isBuyingNow}
                  className={cn(
                    "inline-flex items-center gap-1.5 bg-[#c5a059] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#b8924f]",
                    isOutOfStock && "cursor-not-allowed bg-gray-200 text-gray-400",
                  )}
                >
                  {isBuyingNow ?
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  : <>
                      <Zap className="h-4 w-4" aria-hidden />
                      Buy Now
                    </>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      : null}
    </>
  );
}
