"use client";

import { memo, useCallback, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ShoppingBag, Star } from "lucide-react";
import toast from "react-hot-toast";
import { Product } from "@/types";
import { cn, formatPrice } from "@/lib/utils";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useAuthStore } from "@/store/useAuthStore";
import { loginUrlWithRedirect } from "@/lib/safeRedirect";
import { normalizeCloudinaryDeliveryUrl } from "@/lib/cloudinaryUrl";
import cloudinaryLoader from "@/lib/cloudinaryLoader";
import { hasInStockVariant } from "@/lib/productStock";
import { resolveShopCardImage } from "@/lib/pdpImages";
import { isInStockForColor, shopProductHref } from "@/lib/shopProductListing";
import { buildProductMetaLine } from "@/lib/productCardMeta";

interface ShopCollectionCardProps {
  product: Product;
  /** When set (multi-color listing), card shows this shade's photos. */
  displayColor?: string | null;
  /** PDP rows: fall back to first image when shade has no tagged photo yet. */
  allowImageFallback?: boolean;
  className?: string;
}

function toMerchantPrice(n: number): string {
  return n.toFixed(2);
}

function ShopCollectionCardInner({
  product,
  displayColor = null,
  allowImageFallback = false,
  className,
}: ShopCollectionCardProps) {
  const [primaryImageError, setPrimaryImageError] = useState(false);
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const inWishlist = isInWishlist(product._id);
  const isOutOfStock =
    displayColor ?
      !isInStockForColor(product, displayColor)
    : !hasInStockVariant(product);
  const hasReviews = product.ratings.count > 0;
  const productHref = shopProductHref(product.slug, displayColor);

  const primaryUrl = useMemo(() => {
    if (displayColor) {
      const strict = resolveShopCardImage(product, displayColor);
      if (strict) {
        return normalizeCloudinaryDeliveryUrl(strict) || strict;
      }
      if (allowImageFallback) {
        const url = product.images[0]?.url;
        return normalizeCloudinaryDeliveryUrl(url) || String(url || "").trim();
      }
      return "";
    }
    const url = product.images[0]?.url;
    return normalizeCloudinaryDeliveryUrl(url) || String(url || "").trim();
  }, [product, displayColor, allowImageFallback]);

  const showPrimaryImage = Boolean(primaryUrl) && !primaryImageError;

  const metaLine = useMemo(
    () => buildProductMetaLine(product),
    [product.category, product.fabric, product.subcategory],
  );

  const hasDiscount =
    Boolean(product.comparePrice && product.comparePrice > product.price) ||
    Boolean(product.discountPercent && product.discountPercent > 0);

  const discountPercent = useMemo(() => {
    if (product.discountPercent && product.discountPercent > 0)
      return Math.round(product.discountPercent);
    if (product.comparePrice && product.comparePrice > product.price) {
      return Math.round(
        ((product.comparePrice - product.price) / product.comparePrice) * 100,
      );
    }
    return 0;
  }, [product.comparePrice, product.discountPercent, product.price]);

  const schemaAvailability =
    isOutOfStock ?
      "https://schema.org/OutOfStock"
    : "https://schema.org/InStock";

  const handleWishlist = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isAuthenticated) {
        toast.error("Sign in to save to wishlist");
        router.push(
          loginUrlWithRedirect(
            window.location.pathname + window.location.search,
          ),
        );
        return;
      }
      await toggleWishlist(product._id, product);
    },
    [isAuthenticated, product, router, toggleWishlist],
  );

  return (
    <article
      itemScope
      itemType='https://schema.org/Product'
      className={cn(
        "group flex h-full cursor-pointer flex-col p-1 transition-[background-color,box-shadow,transform] duration-300 ease-out sm:p-1.5",
        "hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_8px_22px_-12px_rgba(15,23,42,0.1)] motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        className,
      )}
      aria-label={product.name}
    >
      <meta itemProp='name' content={product.name} />
      <meta
        itemProp='description'
        content={
          product.shortDescription ||
          String(product.description || "").slice(0, 200)
        }
      />
      {primaryUrl && <link itemProp='image' href={primaryUrl} />}
      <meta itemProp='brand' content='The House of Rani' />
      <meta itemProp='category' content={product.category} />
      <div
        itemProp='offers'
        itemScope
        itemType='https://schema.org/Offer'
        className='hidden'
        aria-hidden='true'
      >
        <meta itemProp='priceCurrency' content='INR' />
        <meta itemProp='price' content={toMerchantPrice(product.price)} />
        <link itemProp='availability' href={schemaAvailability} />
      </div>
      {hasReviews && (
        <div
          itemProp='aggregateRating'
          itemScope
          itemType='https://schema.org/AggregateRating'
          className='hidden'
          aria-hidden='true'
        >
          <meta
            itemProp='ratingValue'
            content={String(product.ratings.average)}
          />
          <meta
            itemProp='reviewCount'
            content={String(product.ratings.count)}
          />
          <meta itemProp='bestRating' content='5' />
          <meta itemProp='worstRating' content='1' />
        </div>
      )}

      <Link
        href={productHref}
        className='flex h-full min-h-0 flex-col outline-none focus-visible:ring-2 focus-visible:ring-[#c5a059]/40 focus-visible:ring-offset-2'
        aria-label={`View ${product.name}${isOutOfStock ? " (Sold Out)" : ""}`}
      >
        <div className='relative mb-3 aspect-[3/4] shrink-0 overflow-hidden bg-gray-100 sm:mb-4'>
          {showPrimaryImage ?
            <Image
              src={primaryUrl}
              alt={product.name}
              fill
              loader={cloudinaryLoader}
              sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
              loading='lazy'
              quality={72}
              className='object-cover transition-transform duration-500 group-hover:scale-[1.02]'
              onError={() => setPrimaryImageError(true)}
            />
          : <div className='absolute inset-0 flex flex-col items-center justify-center gap-2 px-3 text-center'>
              <ShoppingBag className='h-8 w-8 text-gray-300' aria-hidden />
              <span className='text-[10px] font-medium text-gray-400'>
                Photo updating soon
              </span>
            </div>
          }

          {discountPercent >= 5 && !isOutOfStock && (
            <span className='absolute left-0 top-0 z-10 bg-[#c5a059] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white sm:px-2.5 sm:py-1 sm:text-[10px]'>
              {product.saleBadge ? `${product.saleBadge} · ${discountPercent}% off` : `${discountPercent}% off`}
            </span>
          )}

          {isOutOfStock && (
            <span className='absolute bottom-3 left-3 z-10 text-[9px] font-semibold uppercase tracking-widest text-navy-900/50 sm:text-[10px]'>
              Sold Out
            </span>
          )}

          <button
            type='button'
            onClick={handleWishlist}
            className={cn(
              "absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm transition-colors sm:right-2.5 sm:top-2.5 sm:h-8 sm:w-8",
              inWishlist ? "text-brand-600" : (
                "text-gray-500 hover:text-brand-600"
              ),
            )}
            aria-label={
              inWishlist ?
                `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
            }
            aria-pressed={inWishlist}
          >
            <Heart
              className={cn(
                "h-3.5 w-3.5 sm:h-4 sm:w-4",
                inWishlist && "fill-current",
              )}
            />
          </button>
        </div>

        <div className='flex flex-1 flex-col'>
          <h3
            className='line-clamp-1 min-h-[1.25rem] font-serif text-sm font-medium leading-snug text-navy-900 sm:min-h-[1.5625rem] sm:text-lg'
            itemProp='name'
          >
            {product.name}
          </h3>

          {metaLine ?
            <p className='mt-0.5 line-clamp-1 text-[10px] font-medium uppercase tracking-[0.12em] text-gray-500 sm:text-[11px]'>
              {metaLine}
            </p>
          : null}

          <div
            className='mt-1 flex shrink-0 items-center gap-0.5 sm:mt-1.5'
            aria-label={
              hasReviews ?
                `Rated ${product.ratings.average.toFixed(1)} out of 5 from ${product.ratings.count} reviews`
              : "No reviews yet"
            }
          >
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3",
                  hasReviews && i < Math.round(product.ratings.average) ?
                    "fill-[#c5a059] text-[#c5a059]"
                  : "fill-gray-200 text-gray-200",
                )}
                aria-hidden
              />
            ))}
            {hasReviews ?
              <span className='ml-0.5 text-[10px] leading-none tabular-nums text-gray-500'>
                {product.ratings.average.toFixed(1)} ({product.ratings.count})
              </span>
            : <span
                className='ml-0.5 text-[10px] leading-none tabular-nums text-transparent'
                aria-hidden
              >
                0.0 (0)
              </span>
            }
          </div>

          <div className='mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-0.5 pt-1 sm:pt-1.5'>
            <span className='text-sm font-semibold text-[#c5a059] sm:text-[15px]'>
              {formatPrice(product.price)}
            </span>
            {hasDiscount &&
              product.comparePrice &&
              product.comparePrice > product.price && (
                <span className='text-xs text-gray-400 line-through'>
                  {formatPrice(product.comparePrice)}
                </span>
              )}
          </div>
        </div>
      </Link>
    </article>
  );
}

const ShopCollectionCard = memo(ShopCollectionCardInner);
export default ShopCollectionCard;
