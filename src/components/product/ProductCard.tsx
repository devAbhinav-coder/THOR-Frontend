"use client";

import { memo, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Star, Gift, Tag } from "lucide-react";
import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";
import { hasInStockVariant } from "@/lib/productStock";
import { variantSwatchBackground } from "@/lib/variantSwatch";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import GiftCustomizationModal from "@/components/gifting/GiftCustomizationModal";
import { normalizeCloudinaryDeliveryUrl } from "@/lib/cloudinaryUrl";
import { productNeedsCustomization } from "@/lib/productCustomization";

interface ProductCardProps {
  product: Product;
  className?: string;
}

const COLOR_SWATCH_MAX = 5;

/** Round to 2 decimal places — required by Google Merchant Center price format. */
function toMerchantPrice(n: number): string {
  return n.toFixed(2);
}

function ProductCardInner({ product, className }: ProductCardProps) {
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  /**
   * Tracks whether the user has hovered at least once.
   * We only mount the secondary <Image> after the first hover so that
   * the initial page load only fetches primary images (no bandwidth competition).
   * After the first hover the secondary is browser-cached — all later hovers
   * produce an instant crossfade.
   */
  const [hasHoveredOnce, setHasHoveredOnce] = useState(false);
  const [secondaryLoaded, setSecondaryLoaded] = useState(false);
  const [secondaryImageError, setSecondaryImageError] = useState(false);

  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const router = useRouter();

  const inWishlist = isInWishlist(product._id);
  const isOutOfStock = !hasInStockVariant(product);
  const needsCustomization = useMemo(
    () => productNeedsCustomization(product),
    [product.isCustomizable, product.customFields],
  );

  const { primaryUrl, secondaryUrl } = useMemo(() => {
    const primary =
      normalizeCloudinaryDeliveryUrl(product.images[0]?.url) ||
      String(product.images[0]?.url || "").trim();
    const secondary =
      normalizeCloudinaryDeliveryUrl(product.images[1]?.url) ||
      String(product.images[1]?.url || "").trim();
    return { primaryUrl: primary, secondaryUrl: secondary };
  }, [product.images]);

  // True when we have a valid, distinct secondary image
  const hasSecondary = Boolean(
    secondaryUrl && secondaryUrl !== primaryUrl && !secondaryImageError,
  );

  // Whether the secondary image should currently be visible (only after it has loaded)
  const showSecondary = isHovered && hasSecondary && secondaryLoaded;

  const canUseHoverEffects = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  }, []);

  const uniqueColors = useMemo(() => {
    return (product.variants || [])
      .filter((v) => v.color)
      .reduce<{ color: string; colorCode?: string }[]>((acc, v) => {
        if (!acc.find((c) => c.color === v.color)) {
          acc.push({ color: v.color!, colorCode: v.colorCode });
        }
        return acc;
      }, []);
  }, [product.variants]);

  const colorSwatches = useMemo(() => {
    if (uniqueColors.length === 0) return null;
    return {
      visible: uniqueColors.slice(0, COLOR_SWATCH_MAX),
      extra: uniqueColors.length - COLOR_SWATCH_MAX,
    };
  }, [uniqueColors]);

  /**
   * Discount percentage — computed from comparePrice when available.
   * Google Merchant Center uses this to show "X% off" in Shopping ads.
   */
  const discountPercent = useMemo(() => {
    if (product.discountPercent && product.discountPercent > 0)
      return Math.round(product.discountPercent);
    if (product.comparePrice && product.comparePrice > product.price) {
      return Math.round(
        ((product.comparePrice - product.price) / product.comparePrice) * 100,
      );
    }
    return 0;
  }, [product.price, product.comparePrice, product.discountPercent]);

  /**
   * Rich alt text satisfies Google image guidelines:
   * "<Product Name> — <Category> <Fabric> <Color variants>"
   */
  const primaryAlt = useMemo(() => {
    const parts: string[] = [product.name];
    if (product.category) parts.push(product.category);
    if (product.fabric) parts.push(product.fabric);
    if (uniqueColors.length > 0)
      parts.push(uniqueColors.map((c) => c.color).join(", "));
    return parts.join(" — ");
  }, [product.name, product.category, product.fabric, uniqueColors]);

  /** Schema.org availability URL — read by Googlebot from microdata. */
  const schemaAvailability = isOutOfStock
    ? "https://schema.org/OutOfStock"
    : "https://schema.org/InStock";

  const requireAuth = useCallback(
    (msg: string) => {
      toast.error(msg);
      router.push("/auth/login");
    },
    [router],
  );

  const handleAddToCart = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isAuthenticated) return requireAuth("Sign in to add items to cart");
      if (isOutOfStock) {
        toast.error("This product is out of stock");
        return;
      }
      if (needsCustomization) {
        setIsGiftModalOpen(true);
        return;
      }
      router.push(`/shop/${encodeURIComponent(product.slug)}`);
    },
    [
      isAuthenticated,
      isOutOfStock,
      needsCustomization,
      product.slug,
      requireAuth,
      router,
    ],
  );

  const handleWishlist = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isAuthenticated) return requireAuth("Sign in to save to wishlist");
      await toggleWishlist(product._id, product);
    },
    [isAuthenticated, product, requireAuth, toggleWishlist],
  );

  const handleMouseEnter = useCallback(() => {
    if (!canUseHoverEffects) return;
    setIsHovered(true);
    setHasHoveredOnce(true);
  }, [canUseHoverEffects]);

  const handleMouseLeave = useCallback(() => {
    if (!canUseHoverEffects) return;
    setIsHovered(false);
  }, [canUseHoverEffects]);

  const handleSecondaryError = useCallback(() => {
    setSecondaryImageError(true);
    setSecondaryLoaded(false);
  }, []);

  const handleSecondaryLoad = useCallback(() => {
    setSecondaryLoaded(true);
  }, []);

  return (
    /*
     * ── Schema.org Product microdata ────────────────────────────────────────
     * Using <article> + itemscope/itemtype lets Googlebot extract structured
     * product data directly from HTML on listing pages (Shop, Home, Search)
     * without waiting for JSON-LD on a PDP.  This satisfies Google Merchant
     * Center's requirement that product data is visible and machine-readable.
     * ────────────────────────────────────────────────────────────────────────
     */
    <article
      itemScope
      itemType="https://schema.org/Product"
      className={cn(
        "group relative flex h-full min-w-0 flex-col justify-start",
        "min-h-0 sm:min-h-[460px]",
        className,
      )}
      aria-label={product.name}
    >
      {/* ── Hidden microdata fields (not visible, read by crawlers) ── */}
      <meta itemProp="name" content={product.name} />
      <meta itemProp="description" content={
        product.shortDescription ||
        String(product.description || "").slice(0, 200)
      } />
      {primaryUrl && <link itemProp="image" href={primaryUrl} />}
      <meta itemProp="sku" content={product.variants?.[0]?.sku || product._id} />
      <meta itemProp="brand" content="The House of Rani" />
      <meta itemProp="category" content={product.category} />

      {/* Offer microdata — price, currency, availability */}
      <div
        itemProp="offers"
        itemScope
        itemType="https://schema.org/Offer"
        className="hidden"
        aria-hidden="true"
      >
        <meta itemProp="priceCurrency" content="INR" />
        <meta itemProp="price" content={toMerchantPrice(product.price)} />
        <link itemProp="availability" href={schemaAvailability} />
        <link
          itemProp="itemCondition"
          href="https://schema.org/NewCondition"
        />
        <link
          itemProp="url"
          href={`/shop/${encodeURIComponent(product.slug)}`}
        />
        {product.comparePrice && product.comparePrice > product.price && (
          <meta
            itemProp="highPrice"
            content={toMerchantPrice(product.comparePrice)}
          />
        )}
      </div>

      {/* AggregateRating microdata */}
      {product.ratings.count > 0 && (
        <div
          itemProp="aggregateRating"
          itemScope
          itemType="https://schema.org/AggregateRating"
          className="hidden"
          aria-hidden="true"
        >
          <meta
            itemProp="ratingValue"
            content={String(product.ratings.average)}
          />
          <meta
            itemProp="reviewCount"
            content={String(product.ratings.count)}
          />
          <meta itemProp="bestRating" content="5" />
          <meta itemProp="worstRating" content="1" />
        </div>
      )}

      <Link
        href={`/shop/${encodeURIComponent(product.slug)}`}
        className='flex min-h-0 flex-none flex-col outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2 rounded-2xl sm:flex-1'
        aria-label={`View ${product.name}${isOutOfStock ? " (Sold Out)" : ""}`}
      >
        {/* ── Image – 3:4 portrait ── */}
        <div
          className='relative aspect-[3/4] w-full shrink-0 overflow-hidden rounded-2xl bg-gray-100'
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* ─── PRIMARY image — always rendered, fades out on hover ─── */}
          {primaryUrl ? (
            <Image
              src={primaryUrl}
              alt={primaryAlt}
              fill
              sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
              className={cn(
                "object-cover transition-all duration-500",
                isHovered ? "scale-105" : "scale-100",
                showSecondary ? "opacity-0" : "opacity-100",
              )}
            />
          ) : (
            <div className='absolute inset-0 flex items-center justify-center bg-gray-100'>
              <ShoppingBag className='w-12 h-12 text-gray-300' />
            </div>
          )}

          {/* ─── SECONDARY image ─────────────────────────────────────────
               Only mounted after the first hover (hasHoveredOnce) so the
               initial page load never fetches it and the primary image gets
               full bandwidth.  Once mounted the browser caches it, so every
               subsequent hover crossfades instantly.
          ──────────────────────────────────────────────────────────────── */}
          {hasSecondary && hasHoveredOnce && (
            <Image
              src={secondaryUrl}
              alt={`${product.name} — alternate view`}
              fill
              sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
              className={cn(
                "object-cover transition-all duration-500",
                isHovered ? "scale-105" : "scale-100",
                showSecondary ? "opacity-100" : "opacity-0",
              )}
              onLoad={handleSecondaryLoad}
              onError={handleSecondaryError}
            />
          )}

          {/* Badges — top left */}
          <div className='absolute top-2.5 left-2.5 z-10 flex max-w-[calc(100%-4.5rem)] flex-col items-start gap-1.5'>
            {product.isFeatured && (
              <span
                className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-800 text-white shadow-md ring-1 ring-amber-900/20'
                title='Featured'
                aria-label='Featured product'
              >
                <Star className='h-3.5 w-3.5 fill-white text-white' aria-hidden />
              </span>
            )}
            {/* ── Discount badge ──
                Visible to users AND crawlers — satisfies Google's requirement
                that promotional pricing be clearly displayed on the page. */}
            {discountPercent >= 5 && !isOutOfStock && (
              <span
                className='flex items-center gap-0.5 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-md'
                aria-label={`${discountPercent}% off`}
              >
                <Tag className='h-2.5 w-2.5' aria-hidden />
                {discountPercent}% OFF
              </span>
            )}
            {isOutOfStock && (
              <span
                className='max-w-full truncate rounded-full bg-gray-900/80 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm'
                aria-label='Sold out'
              >
                Sold Out
              </span>
            )}
          </div>

          {/* Wishlist — top right */}
          <button
            onClick={handleWishlist}
            className={cn(
              "absolute top-2.5 right-2.5 z-10 h-8 w-8 rounded-full flex items-center justify-center shadow-md transition-all duration-200",
              inWishlist ?
                "bg-brand-600 text-white scale-110"
              : "bg-white/90 text-gray-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:text-brand-600 hover:bg-white",
            )}
            aria-label={inWishlist ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
            aria-pressed={inWishlist}
          >
            <Heart className={cn("h-4 w-4", inWishlist && "fill-current")} />
          </button>

          {/* Image swap dots */}
          {hasSecondary && (
            <div
              className='hidden sm:flex absolute bottom-14 left-1/2 -translate-x-1/2 gap-1.5 z-10 opacity-0 sm:group-hover:opacity-100 transition-opacity'
              aria-hidden='true'
            >
              {product.images.slice(0, 4).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "block rounded-full transition-all duration-300",
                    (i === 0 && !showSecondary) || (i === 1 && showSecondary) ?
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
                type='button'
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                className={cn(
                  "w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg transition-colors disabled:opacity-70",
                  needsCustomization ?
                    "bg-amber-800 text-white hover:bg-amber-900"
                  : "bg-white hover:bg-gray-50 text-navy-900",
                )}
              >
                {isAddingToCart ?
                  <span className='h-3.5 w-3.5 rounded-full border-2 border-navy-300 border-t-navy-900 animate-spin' aria-hidden />
                : needsCustomization ?
                  <Gift className='h-3.5 w-3.5' aria-hidden />
                : <ShoppingBag className='h-3.5 w-3.5' aria-hidden />}
                {isAddingToCart ?
                  "Adding…"
                : needsCustomization ?
                  "Customize"
                : "View Product"}
              </button>
            </div>
          )}
        </div>

        {/* ── Info ── */}
        <div className='flex min-h-0 flex-none flex-col gap-0.5 sm:gap-1 sm:flex-1'>
          {/* Meta — single line */}
          <div className='flex h-4 min-h-4 shrink-0 items-center gap-0.5 overflow-hidden'>
            <span
              className='truncate text-[10px] font-bold uppercase tracking-wider text-brand-600'
              aria-label={`Category: ${product.category}`}
            >
              {product.category}
            </span>
            {product.fabric ?
              <>
                <span className='shrink-0 text-[8px] sm:text-[10px] text-gray-500' aria-hidden>
                  ·
                </span>
                <span
                  className='truncate text-[8px] sm:text-[10px] font-semibold uppercase tracking-wide text-gray-600'
                  aria-label={`Fabric: ${product.fabric}`}
                >
                  {product.fabric}
                </span>
              </>
            : null}
          </div>

          {/* Title */}
          <h3
            className='line-clamp-2 min-h-8 text-xs sm:text-sm font-semibold leading-4 sm:leading-5 text-gray-900'
            itemProp="name"
          >
            {product.name}
          </h3>

          {/* Colors */}
          <div className='h-3 sm:h-5 min-h-3 sm:min-h-5 shrink-0'>
            {!colorSwatches ?
              <div className='h-3 sm:h-5' aria-hidden />
            : <div
                className='flex h-3 sm:h-5 max-w-full items-center gap-1.5 overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
                aria-label={`Available colors: ${uniqueColors.map((c) => c.color).join(", ")}`}
              >
                {colorSwatches.visible.map(({ color, colorCode }) => {
                  const bg = variantSwatchBackground(color, colorCode);
                  return bg ?
                      <span
                        key={color}
                        title={color}
                        className='h-2 sm:h-4 w-2 sm:w-4 shrink-0 rounded-full border border-gray-200 shadow-sm'
                        style={{ background: bg }}
                        aria-label={color}
                      />
                    : <span
                        key={color}
                        className='shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium leading-none text-gray-700'
                      >
                        {color}
                      </span>;
                })}
                {colorSwatches.extra > 0 && (
                  <span className='shrink-0 text-[10px] font-semibold text-gray-600'>
                    +{colorSwatches.extra}
                  </span>
                )}
              </div>
            }
          </div>

          {/* Ratings */}
          <div className='mt-0.2 flex h-2 min-h-2 shrink-0 items-center sm:h-4 sm:min-h-4'>
            <div
              className='flex min-w-0 max-w-full items-center gap-0.5'
              aria-label={
                product.ratings.count > 0
                  ? `Rated ${product.ratings.average.toFixed(1)} out of 5 from ${product.ratings.count} reviews`
                  : "No reviews yet"
              }
            >
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
                  aria-hidden
                />
              ))}
              <span className='ml-0.5 shrink-0 text-[10px] tabular-nums text-gray-600'>
                ({product.ratings.count})
              </span>
            </div>
          </div>

          {/* ── Price ───────────────────────────────────────────────────────
               The <span data-price> + <meta content> pattern is the correct
               way to make prices machine-readable while keeping them human-
               visible.  Google Merchant Center auto-detects both.
          ─────────────────────────────────────────────────────────────── */}
          <div className='flex min-h-[26px] shrink-0 flex-wrap items-center gap-x-2 gap-y-0.5'>
            <span
              className='text-base font-bold text-gray-900'
              aria-label={`Price: ${formatPrice(product.price)}`}
            >
              {formatPrice(product.price)}
              {/* Machine-readable price for crawlers */}
              <meta itemProp="price" content={toMerchantPrice(product.price)} />
              <meta itemProp="priceCurrency" content="INR" />
            </span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span
                className='text-sm text-gray-600 line-through'
                aria-label={`Original price: ${formatPrice(product.comparePrice)}`}
              >
                {formatPrice(product.comparePrice)}
              </span>
            )}
            {/* Availability label — visible to users */}
            {isOutOfStock ? (
              <span className='text-[10px] font-semibold text-red-500 ml-auto'>
                Out of Stock
              </span>
            ) : (
              <span className='sr-only'>In Stock</span>
            )}
          </div>
        </div>
      </Link>

      {/* Mobile CTA */}
      <div className='mt-2 shrink-0 sm:hidden'>
        <button
          type='button'
          onClick={handleAddToCart}
          disabled={isOutOfStock || isAddingToCart}
          className={cn(
            "w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors",
            isOutOfStock ?
              "bg-gray-100 text-gray-600 cursor-not-allowed"
            : "bg-white border border-navy-200 text-navy-900 hover:bg-navy-50",
          )}
          aria-label={
            isOutOfStock ? `${product.name} — Sold Out`
            : isAddingToCart ? "Adding to cart…"
            : `View ${product.name}`
          }
        >
          <ShoppingBag className='h-3.5 w-3.5' aria-hidden />
          {isAddingToCart ?
            "Adding…"
          : isOutOfStock ?
            "Sold Out"
          : needsCustomization ?
            "Customize"
          : "View Details"}
        </button>
      </div>

      {isGiftModalOpen && (
        <GiftCustomizationModal
          product={product}
          onClose={() => setIsGiftModalOpen(false)}
        />
      )}
    </article>
  );
}

const ProductCard = memo(ProductCardInner);
export default ProductCard;
