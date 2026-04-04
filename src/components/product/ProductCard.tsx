"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Star, Gift } from "lucide-react";
import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";
import { hasInStockVariant, sumVariantStock } from "@/lib/productStock";
import { variantSwatchBackground } from "@/lib/variantSwatch";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import GiftCustomizationModal from "@/components/gifting/GiftCustomizationModal";
import { isLowInventoryTotal } from "@/lib/inventoryConstants";
import { normalizeCloudinaryDeliveryUrl } from "@/lib/cloudinaryUrl";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export default function ProductCard({ product, className }: ProductCardProps) {
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [hoveredImage, setHoveredImage] = useState(false);
  /** Second gallery URL failed to load (404, blocked host, etc.) — stay on primary until next hover. */
  const [secondaryImageError, setSecondaryImageError] = useState(false);
  const { addToCart } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const router = useRouter();

  const inWishlist = isInWishlist(product._id);
  const sellableTotal = sumVariantStock(product);
  const isOutOfStock = !hasInStockVariant(product);

  const primaryUrl =
    normalizeCloudinaryDeliveryUrl(product.images[0]?.url) ||
    String(product.images[0]?.url || "").trim();
  const secondaryUrl =
    normalizeCloudinaryDeliveryUrl(product.images[1]?.url) ||
    String(product.images[1]?.url || "").trim();
  const showSecondaryOnHover =
    hoveredImage &&
    Boolean(secondaryUrl) &&
    secondaryUrl !== primaryUrl &&
    !secondaryImageError;
  const displayImage = showSecondaryOnHover ? secondaryUrl : primaryUrl;
  const canUseHoverEffects =
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const requireAuth = (msg: string) => {
    toast.error(msg);
    router.push("/auth/login");
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return requireAuth("Sign in to add items to cart");
    if (isOutOfStock) {
      toast.error("This product is out of stock");
      return;
    }

    // Gifting Logic: If it has custom fields OR is customizable, open modal
    if (
      product.isCustomizable ||
      (product.customFields && product.customFields.length > 0)
    ) {
      setIsGiftModalOpen(true);
      return;
    }

    // Standard products (non-gifting): Redirect to PDP as "View Details" action
    router.push(`/shop/${encodeURIComponent(product.slug)}`);
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return requireAuth("Sign in to buy");
    if (isOutOfStock) return;
    const defaultVariant = product.variants.find((v) => v.stock > 0);
    if (!defaultVariant) return;
    try {
      await addToCart(
        product._id,
        {
          sku: defaultVariant.sku,
          size: defaultVariant.size,
          color: defaultVariant.color,
          colorCode: defaultVariant.colorCode,
        },
        1,
        undefined,
        product,
      );
      router.push("/checkout");
    } catch {
      /* handled in store */
    }
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return requireAuth("Sign in to save to wishlist");
    await toggleWishlist(product._id, product);
  };

  return (
    <div
      className={cn(
        "group relative flex h-full flex-col justify-start",
        /* Mobile: natural height so “View Details” sits under price; sm+: min height for grid parity */
        "min-h-0 sm:min-h-[460px]",
        className,
      )}
    >
      <Link
        href={`/shop/${encodeURIComponent(product.slug)}`}
        className='flex min-h-0 flex-none flex-col outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2 rounded-2xl sm:flex-1'
      >
        {/* ── Image – 3:4 portrait (same on every card / breakpoint) ── */}
        <div
          className='relative aspect-[3/4] w-full shrink-0 overflow-hidden rounded-2xl bg-gray-100'
          onMouseEnter={() => {
            if (!canUseHoverEffects) return;
            setSecondaryImageError(false);
            setHoveredImage(true);
          }}
          onMouseLeave={() => {
            if (!canUseHoverEffects) return;
            setHoveredImage(false);
            setSecondaryImageError(false);
          }}
        >
          {displayImage ?
            <Image
              key={displayImage}
              src={displayImage}
              alt={product.name}
              fill
              sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
              className={cn(
                "object-cover transition-all duration-700",
                hoveredImage ? "scale-105" : "scale-100",
              )}
              onError={() => {
                if (hoveredImage && secondaryUrl && displayImage === secondaryUrl) {
                  setSecondaryImageError(true);
                }
              }}
            />
          : <div className='absolute inset-0 flex items-center justify-center bg-gray-100'>
              <ShoppingBag className='w-12 h-12 text-gray-300' />
            </div>
          }

          {/* Badges — top left */}
          <div className='absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10'>
            {product.isFeatured && (
              <span className='text-xs bg-gold-500 text-white font-bold px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1'>
                <Star className='h-3 w-3 fill-white' /> Featured
              </span>
            )}
            {isOutOfStock && (
              <span className='text-xs bg-gray-900/80 backdrop-blur-sm text-white font-semibold px-2.5 py-0.5 rounded-full'>
                Sold Out
              </span>
            )}
          </div>

          {/* Wishlist — top right, always visible when in wishlist */}
          <button
            onClick={handleWishlist}
            className={cn(
              "absolute top-2.5 right-2.5 z-10 h-8 w-8 rounded-full flex items-center justify-center shadow-md transition-all duration-200",
              inWishlist ?
                "bg-brand-600 text-white scale-110"
              : "bg-white/90 text-gray-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:text-brand-600 hover:bg-white",
            )}
            aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={cn("h-4 w-4", inWishlist && "fill-current")} />
          </button>

          {/* Image swap dots */}
          {product.images.length > 1 && secondaryUrl && secondaryUrl !== primaryUrl && (
            <div className='hidden sm:flex absolute bottom-14 left-1/2 -translate-x-1/2 gap-1.5 z-10 opacity-0 sm:group-hover:opacity-100 transition-opacity'>
              {product.images.slice(0, 4).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "block rounded-full transition-all duration-300",
                    (i === 0 && (!hoveredImage || secondaryImageError)) ||
                    (i === 1 && hoveredImage && !secondaryImageError) ?
                      "w-5 h-1.5 bg-white"
                    : "w-1.5 h-1.5 bg-white/50",
                  )}
                />
              ))}
            </div>
          )}

          {/* Action bar — slides up on hover */}
          {!isOutOfStock && (
            <div className='hidden sm:block absolute bottom-0 left-0 right-0 p-2.5 sm:translate-y-full sm:group-hover:translate-y-0 transition-transform duration-300 ease-out z-10'>
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                className={cn(
                  "w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg transition-colors disabled:opacity-70",
                  product.isCustomizable ?
                    "bg-gold-500 text-white hover:bg-gold-600"
                  : "bg-white hover:bg-gray-50 text-navy-900",
                )}
              >
                {isAddingToCart ?
                  <span className='h-3.5 w-3.5 rounded-full border-2 border-navy-300 border-t-navy-900 animate-spin' />
                : (
                  product.isCustomizable ||
                  (product.customFields && product.customFields.length > 0)
                ) ?
                  <Gift className='h-3.5 w-3.5' />
                : <ShoppingBag className='h-3.5 w-3.5' />}
                {isAddingToCart ?
                  "Adding…"
                : (
                  product.isCustomizable ||
                  (product.customFields && product.customFields.length > 0)
                ) ?
                  "Customize"
                : "View Product"}
              </button>
            </div>
          )}
        </div>

        {/* ── Info: sm+ flex-1 stretches so card rows align; mobile stays content-height ── */}
        <div className='flex min-h-0 flex-none flex-col gap-0.5 sm:gap-1 sm:flex-1'>
          {/* Meta — single line */}
          <div className='flex h-4 min-h-4 shrink-0 items-center gap-0.5 overflow-hidden'>
            <span className='truncate text-[10px] font-bold uppercase tracking-wider text-brand-600'>
              {product.category}
            </span>
            {product.fabric ?
              <>
                <span className='shrink-0 text-[8px] sm:text-[10px] text-gray-300'>·</span>
                <span className='truncate text-[8px] sm:text-[10px] font-semibold uppercase tracking-wide text-gray-500'>
                  {product.fabric}
                </span>
              </>
            : null}
          </div>

          {/* Title — exactly two lines tall everywhere */}
          <h3 className='line-clamp-2 min-h-8 text-xs sm:text-sm font-semibold leading-4 sm:leading-5 text-gray-900'>
            {product.name}
          </h3>
              
          {/* Colors — one row; scroll horizontally if many (no wrapping = same card height) */}
          <div className='h-3 sm:h-5 min-h-3 sm:min-h-5 shrink-0'>
            {(() => {
              const uniqueColors = (product.variants || [])
                .filter((v) => v.color)
                .reduce<{ color: string; colorCode?: string }[]>((acc, v) => {
                  if (!acc.find((c) => c.color === v.color)) {
                    acc.push({ color: v.color!, colorCode: v.colorCode });
                  }
                  return acc;
                }, []);
              if (uniqueColors.length === 0) {
                return <div className='h-3 sm:h-5' aria-hidden />;
              }
              const MAX = 5;
              const visible = uniqueColors.slice(0, MAX);
              const extra = uniqueColors.length - MAX;
              return (
                <div className='flex h-3 sm:h-5 max-w-full items-center gap-1.5 overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
                  {visible.map(({ color, colorCode }) => {
                    const bg = variantSwatchBackground(color, colorCode);
                    return bg ?
                        <span
                          key={color}
                          title={color}
                          className='h-2 sm:h-4 w-2 sm:w-4 shrink-0 rounded-full border border-gray-200 shadow-sm'
                          style={{ background: bg }}
                        />
                      : <span
                          key={color}
                          className='shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium leading-none text-gray-500'
                        >
                          {color}
                        </span>;
                  })}
                  {extra > 0 && (
                    <span className='shrink-0 text-[10px] font-semibold text-gray-400'>
                      +{extra}
                    </span>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Ratings — same row height whether 0 or many reviews */}
          <div className='flex h-2 sm:h-4 min-h-2 mt-0.2 sm:min-h-4 shrink-0 items-center gap-0.5'>
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-3 w-3 shrink-0",
                  (
                    product.ratings.count > 0 &&
                      i < Math.round(product.ratings.average)
                  ) ?
                    "fill-gold-400 text-gold-400"
                  : "fill-gray-200 text-gray-200",
                )}
              />
            ))}
            <span className='ml-0.5 text-[10px] text-gray-400'>
              ({product.ratings.count})
            </span>
          </div>

          {/* Price */}
          <div className='flex min-h-[26px] shrink-0 flex-wrap items-center gap-x-2 gap-y-0.5'>
            <span className='text-base font-bold text-gray-900'>
              {formatPrice(product.price)}
            </span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className='text-sm text-gray-400 line-through'>
                {formatPrice(product.comparePrice)}
              </span>
            )}
          </div>

          {/* Low stock — fixed band */}
          {/* <div className='flex h-[22px] min-h-[22px] shrink-0 items-center'>
            {!isOutOfStock && isLowInventoryTotal(sellableTotal) ?
              <span className='inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-amber-700'>
                <span aria-hidden>⚡</span> Only a few left!
              </span>
            : null}
          </div> */}

          {/* Fills extra row height from CSS grid so cards in a row align */}
          {/* <div className='min-h-0 flex-1' aria-hidden /> */}
        </div>
      </Link>

      {/* Mobile CTA — under price; extra row height (if grid stretches) stays below the button */}
      <div className='mt-2 shrink-0 sm:hidden'>
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock || isAddingToCart}
          className={cn(
            "w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors",
            isOutOfStock ?
              "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white border border-navy-200 text-navy-900 hover:bg-navy-50",
          )}
        >
          <ShoppingBag className='h-3.5 w-3.5' />
          {isAddingToCart ?
            "Adding…"
          : isOutOfStock ?
            "Sold Out"
          : (
            product.isCustomizable ||
            (product.customFields && product.customFields.length > 0)
          ) ?
            "Customize"
          : "View Details"}
        </button>
      </div>

      {isGiftModalOpen && (
        <GiftCustomizationModal
          product={product as any}
          onClose={() => setIsGiftModalOpen(false)}
        />
      )}
    </div>
  );
}
