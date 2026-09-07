"use client";

import {
  memo,
  useState,
  useMemo,
  useCallback,
  useRef,
  MouseEvent,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, Star, Heart, Gift } from "lucide-react";
import toast from "react-hot-toast";
import { Product } from "@/types";
import { cn } from "@/lib/utils";
import ProductPriceBlock from "@/components/product/ProductPriceBlock";
import { storefrontPriceMeta } from "@/lib/productPricing";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useWishlistUiState } from "@/hooks/useWishlistUiState";
import { loginUrlWithRedirect } from "@/lib/safeRedirect";
import { normalizeCloudinaryDeliveryUrl } from "@/lib/cloudinaryUrl";
import cloudinaryLoader from "@/lib/cloudinaryLoader";
import { resolveShopCardImage } from "@/lib/pdpImages";
import { hasInStockVariant } from "@/lib/productStock";
import { productNeedsCustomization } from "@/lib/productCustomization";
import { buildProductMetaLine } from "@/lib/productCardMeta";
import { shopProductHref } from "@/lib/shopProductListing";
import { trackAddToCart, trackAddToWishlist } from "@/lib/metaPixel";

interface ProductCardProps {
  product: Product;
  /** Pass when rendering a specific color shade in multi-color search/catalog rows. */
  displayColor?: string | null;
}

function pricePercentOff(mrp?: number, sellPrice?: number): number {
  if (!mrp || !sellPrice || mrp <= sellPrice) return 0;
  return Math.round(((mrp - sellPrice) / mrp) * 100);
}

function ProductCardInner({ product, displayColor }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [hoverScrollPaused, setHoverScrollPaused] = useState(false);
  const [hasHoveredOnce, setHasHoveredOnce] = useState(false);
  const [secondaryLoaded, setSecondaryLoaded] = useState(false);
  const [secondaryFailed, setSecondaryFailed] = useState(false);
  const [primaryImageError, setPrimaryImageError] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { isAuthenticated } = useAuthStore();
  const { addToCart } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const router = useRouter();

  const inWishlist = useWishlistUiState(product._id);

  const isOutOfStock = !hasInStockVariant(product);
  const needsCustomization = productNeedsCustomization(product);

  const primaryUrl = useMemo(() => {
    if (displayColor) {
      const strict = resolveShopCardImage(product, displayColor);
      if (strict) return normalizeCloudinaryDeliveryUrl(strict) || strict;
    }
    return (
      normalizeCloudinaryDeliveryUrl(product.images?.[0]?.url) ||
      String(product.images?.[0]?.url || "").trim()
    );
  }, [product, displayColor]);

  const secondaryUrl = useMemo(() => {
    return (
      normalizeCloudinaryDeliveryUrl(product.images?.[1]?.url) ||
      String(product.images?.[1]?.url || "").trim()
    );
  }, [product]);

  const showPrimaryImage = Boolean(primaryUrl) && !primaryImageError;

  const hasSecondary =
    Boolean(secondaryUrl) &&
    secondaryUrl !== primaryUrl &&
    !secondaryFailed;
  const showSecondary = isHovered && secondaryLoaded && hasSecondary;

  const primaryAlt = useMemo(() => {
    const parts: string[] = [product.name];
    if (product.category) parts.push(product.category);
    if (product.fabric) parts.push(product.fabric);
    return parts.join(" — ");
  }, [product.name, product.category, product.fabric]);

  const discountPercent = useMemo(() => {
    if (typeof product.discountPercent === "number" && product.discountPercent > 0) {
      return Math.round(product.discountPercent);
    }
    const mrp = (product as unknown as { mrp?: number }).mrp;
    return pricePercentOff(mrp, product.price);
  }, [product.discountPercent, product.price, product]);

  const priceMeta = useMemo(
    () => storefrontPriceMeta(product, displayColor),
    [product, displayColor],
  );

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    setHasHoveredOnce(true);
    setHoverScrollPaused(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setHoverScrollPaused(false);
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);

  const handleSecondaryLoad = useCallback(() => {
    setSecondaryLoaded(true);
  }, []);

  const handleSecondaryError = useCallback(() => {
    setSecondaryFailed(true);
  }, []);

  const handleWishlist = useCallback(
    async (e: MouseEvent) => {
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
      const alreadySaved = isInWishlist(product._id);
      await toggleWishlist(product._id, product);
      if (!alreadySaved) trackAddToWishlist(product);
    },
    [isAuthenticated, isInWishlist, product, router, toggleWishlist],
  );

  const handleAddToCart = useCallback(
    async (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const productHref = shopProductHref(product.slug, displayColor);

      if (isOutOfStock) {
        toast.error("This piece is currently unavailable");
        return;
      }

      if (needsCustomization) {
        router.push(productHref);
        return;
      }

      const colorKey = displayColor?.trim().toLowerCase();
      const availableVariant =
        (colorKey
          ? product.variants?.find(
              (v) =>
                String(v.color || "").toLowerCase().trim() === colorKey &&
                (Number(v.stock) || 0) > 0 &&
                v.sku,
            )
          : undefined) ||
        product.variants?.find((v) => (Number(v.stock) || 0) > 0 && v.sku) ||
        product.variants?.find((v) => v.sku) ||
        product.variants?.[0];

      if (!availableVariant?.sku) {
        router.push(productHref);
        return;
      }

      setIsAddingToCart(true);
      try {
        await addToCart(
          product._id,
          {
            sku: availableVariant.sku,
            size: availableVariant.size,
            color: availableVariant.color,
            colorCode: availableVariant.colorCode,
          },
          1,
          undefined,
          product,
        );
        trackAddToCart(
          product,
          1,
          availableVariant.price ?? product.price,
          availableVariant,
        );
      } catch {
        toast.error("Could not add to bag");
      } finally {
        setIsAddingToCart(false);
      }
    },
    [addToCart, displayColor, isOutOfStock, needsCustomization, product, router],
  );

  const schemaAvailability =
    isOutOfStock ?
      "https://schema.org/OutOfStock"
    : "https://schema.org/InStock";

  const productHref = shopProductHref(product.slug, displayColor);

  return (
    <article
      itemScope
      itemType='https://schema.org/Product'
      className={cn(
        "group relative flex h-full cursor-pointer flex-col p-1.5 transition-all duration-300 ease-out hover:-translate-y-1 sm:p-2 sm:hover:-translate-y-1.5",
        "rounded-2xl border border-transparent bg-white/70 hover:border-gray-200/60 hover:bg-white hover:shadow-xl",
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
      <meta itemProp='sku' content={product.variants?.[0]?.sku || product._id} />
      <meta itemProp='brand' content='The House of Rani' />

      <div
        itemProp='offers'
        itemScope
        itemType='https://schema.org/Offer'
        className='hidden'
        aria-hidden='true'
      >
        <meta itemProp='priceCurrency' content='INR' />
        <meta itemProp='price' content={priceMeta.priceContent} />
        <link itemProp='availability' href={schemaAvailability} />
        <link itemProp='itemCondition' href='https://schema.org/NewCondition' />
        <link itemProp='url' href={productHref} />
      </div>

      {product.ratings.count > 0 && (
        <div
          itemProp='aggregateRating'
          itemScope
          itemType='https://schema.org/AggregateRating'
          className='hidden'
          aria-hidden='true'
        >
          <meta itemProp='ratingValue' content={String(product.ratings.average)} />
          <meta itemProp='reviewCount' content={String(product.ratings.count)} />
          <meta itemProp='bestRating' content='5' />
          <meta itemProp='worstRating' content='1' />
        </div>
      )}

      <div className='flex min-h-0 flex-none flex-col rounded-2xl sm:flex-1'>
        <div
          className='relative aspect-[3/4] w-full shrink-0 overflow-hidden rounded-2xl bg-gray-100'
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <Link
            href={productHref}
            className='absolute inset-0 z-0 block outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2'
            aria-label={`View ${product.name}${isOutOfStock ? " (Sold Out)" : ""}`}
          >
            {showPrimaryImage ?
              <Image
                src={primaryUrl}
                alt={primaryAlt}
                fill
                loader={cloudinaryLoader}
                sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
                loading='lazy'
                quality={70}
                className={cn(
                  "card-hover-zoom object-cover transition-all duration-500",
                  isHovered && !hoverScrollPaused ? "scale-105" : "scale-100",
                  showSecondary ? "opacity-0" : "opacity-100",
                )}
                onError={() => setPrimaryImageError(true)}
              />
            : <div className='absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#f5f0ee] to-[#ebe3e0] px-3 text-center'>
                <ShoppingBag className='w-10 h-10 text-brand-300' aria-hidden />
                <span className='text-[11px] font-medium text-gray-500 leading-snug'>
                  Photo updating soon
                </span>
              </div>
            }

            {hasSecondary && hasHoveredOnce && (
              <Image
                src={secondaryUrl}
                alt=''
                aria-hidden='true'
                fill
                loader={cloudinaryLoader}
                sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
                loading='lazy'
                quality={70}
                className={cn(
                  "card-hover-zoom object-cover transition-all duration-500",
                  isHovered && !hoverScrollPaused ? "scale-105" : "scale-100",
                  showSecondary ? "opacity-100" : "opacity-0",
                )}
                onLoad={handleSecondaryLoad}
                onError={handleSecondaryError}
              />
            )}
          </Link>

          {product.saleCampaignId && discountPercent >= 1 && !isOutOfStock && (
            <div className='absolute top-0 left-0 z-10 pointer-events-none'>
              <div className='relative w-[50px] h-[50px]'>
                <div className='absolute top-0 left-0 w-full h-full bg-red-600 [clip-path:polygon(0_0,100%_0,0_100%)]' />
                <span className='absolute top-[10px] left-[4px] -rotate-45 text-white text-[10px] font-bold'>
                  {discountPercent}% OFF
                </span>
              </div>
            </div>
          )}

          <button
            type='button'
            onClick={handleWishlist}
            className={cn(
              "absolute top-2.5 right-2.5 z-10 h-8 w-8 rounded-full flex items-center justify-center shadow-md transition-all duration-200",
              inWishlist ?
                "bg-brand-600 text-white scale-110"
              : "bg-white/90 text-gray-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:text-brand-600 hover:bg-white",
            )}
            aria-label={
              inWishlist ?
                `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
            }
            aria-pressed={inWishlist}
          >
            <Heart className={cn("h-4 w-4", inWishlist && "fill-current")} />
          </button>

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
                  <span
                    className='h-3.5 w-3.5 rounded-full border-2 border-navy-300 border-t-navy-900 animate-spin'
                    aria-hidden
                  />
                : needsCustomization ?
                  <Gift className='h-3.5 w-3.5' aria-hidden />
                : <ShoppingBag className='h-3.5 w-3.5' aria-hidden />}
                {isAddingToCart ?
                  "Adding…"
                : needsCustomization ?
                  "Customize"
                : "Add to Bag"}
              </button>
            </div>
          )}
        </div>

        <div className='flex min-h-0 flex-none flex-col gap-0.5 sm:gap-1 sm:flex-1 pt-2'>
          {(() => {
            const metaLine = buildProductMetaLine(product);
            if (!metaLine) return null;
            return (
              <div className='flex h-4 min-h-4 shrink-0 items-center gap-0.5 overflow-hidden'>
                <span
                  className='truncate text-[10px] font-bold uppercase tracking-wider text-brand-600'
                  aria-label={`Details: ${metaLine}`}
                >
                  {metaLine}
                </span>
              </div>
            );
          })()}

          <Link href={productHref} className='block group-hover:text-brand-600 transition-colors'>
            <h3
              className='line-clamp-2 min-h-8 text-xs sm:text-sm font-semibold leading-4 sm:leading-5 text-gray-900'
              itemProp='name'
            >
              {product.name}
            </h3>
          </Link>

          <div className='mt-0.2 flex h-2 min-h-2 shrink-0 items-center sm:h-4 sm:min-h-4'>
            <div
              className='flex min-w-0 max-w-full items-center gap-0.5'
              aria-label={
                product.ratings.count > 0 ?
                  `Rated ${product.ratings.average.toFixed(1)} out of 5 from ${product.ratings.count} reviews`
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

          <div className='flex min-h-[26px] shrink-0 flex-wrap items-center gap-x-2 gap-y-0.5'>
            <ProductPriceBlock
              product={product}
              displayColor={displayColor}
              showBadge={false}
            />
            <meta itemProp='price' content={priceMeta.priceContent} />
            <meta itemProp='priceCurrency' content={priceMeta.priceCurrency} />
            {isOutOfStock ?
              <span className='text-[10px] font-semibold text-red-500 ml-auto'>
                Out of Stock
              </span>
            : <span className='sr-only'>In Stock</span>}
          </div>
        </div>
      </div>
    </article>
  );
}

const ProductCard = memo(ProductCardInner);
export default ProductCard;
