"use client";

import { memo, useCallback, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Star } from "lucide-react";
import { Product } from "@/types";
import { cn } from "@/lib/utils";
import ProductPriceBlock from "@/components/product/ProductPriceBlock";
import { getStorefrontPriceDisplay, storefrontPriceMeta } from "@/lib/productPricing";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useAuthStore } from "@/store/useAuthStore";
import { normalizeCloudinaryDeliveryUrl } from "@/lib/cloudinaryUrl";
import cloudinaryLoader from "@/lib/cloudinaryLoader";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { loginUrlWithRedirect } from "@/lib/safeRedirect";
import { trackAddToWishlist } from "@/lib/metaPixel";
import WishlistHeartButton from "@/components/wishlist/WishlistHeartButton";
import { resolveShopCardImage } from "@/lib/pdpImages";
import { shopProductHref } from "@/lib/shopProductListing";

interface FeaturedProductCardProps {
  product: Product;
  displayColor?: string | null;
  className?: string;
}

function FeaturedProductCardInner({
  product,
  displayColor = null,
  className,
}: FeaturedProductCardProps) {
  const [primaryImageError, setPrimaryImageError] = useState(false);
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  const hasReviews = product.ratings.count > 0;

  const primaryUrl = useMemo(() => {
    if (displayColor) {
      const strict = resolveShopCardImage(product, displayColor);
      if (strict) {
        return normalizeCloudinaryDeliveryUrl(strict) || strict;
      }
    }
    return (
      normalizeCloudinaryDeliveryUrl(product.images[0]?.url) ||
      String(product.images[0]?.url || "").trim()
    );
  }, [product, displayColor]);

  const productHref = shopProductHref(product.slug, displayColor);

  const showPrimaryImage = Boolean(primaryUrl) && !primaryImageError;

  const primaryAlt = useMemo(() => {
    const parts: string[] = [product.name];
    if (product.category) parts.push(product.category);
    if (product.fabric) parts.push(product.fabric);
    return parts.join(" — ");
  }, [product.category, product.fabric, product.name]);

  const priceMeta = useMemo(
    () => storefrontPriceMeta(product, displayColor),
    [product, displayColor],
  );
  const priceDisplay = useMemo(
    () => getStorefrontPriceDisplay(product, displayColor),
    [product, displayColor],
  );

  const fabricLine = useMemo(() => {
    const line =
      product.fabric?.trim() ||
      product.subcategory?.trim() ||
      product.category?.trim();
    return line ? line.toUpperCase() : "";
  }, [product.category, product.fabric, product.subcategory]);

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
      const alreadySaved = isInWishlist(product._id);
      await toggleWishlist(product._id, product);
      if (!alreadySaved) trackAddToWishlist(product);
    },
    [isAuthenticated, isInWishlist, product, router, toggleWishlist],
  );

  return (
    <article
      itemScope
      itemType='https://schema.org/Product'
      className={cn(
        "group flex h-full flex-col border-[3px] border-white bg-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition-[box-shadow,transform] duration-300 ease-out",
        "hover:-translate-y-0.5 hover:shadow-[0_8px_22px_-12px_rgba(15,23,42,0.1)] motion-reduce:transition-none motion-reduce:hover:translate-y-0",
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
      <meta
        itemProp='sku'
        content={product.variants?.[0]?.sku || product._id}
      />
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
        <meta itemProp='price' content={priceMeta.priceContent} />
        <link
          itemProp='availability'
          href={
            product.totalStock > 0 ?
              "https://schema.org/InStock"
            : "https://schema.org/OutOfStock"
          }
        />
        <link itemProp='itemCondition' href='https://schema.org/NewCondition' />
        <link
          itemProp='url'
          href={productHref}
        />
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
        className='flex h-full min-h-0 flex-1 flex-col outline-none focus-visible:ring-2 focus-visible:ring-[#c5a059]/50 focus-visible:ring-offset-2'
        aria-label={`View ${product.name}`}
      >
        <div className='relative aspect-[3/4] w-full shrink-0 overflow-hidden bg-gray-50'>
          {showPrimaryImage ?
            <Image
              src={primaryUrl}
              alt={primaryAlt}
              fill
              loader={cloudinaryLoader}
              sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
              loading='lazy'
              quality={75}
              className='object-cover transition-transform duration-500 group-hover:scale-[1.02]'
              onError={() => setPrimaryImageError(true)}
            />
          : <div className='absolute inset-0 flex flex-col items-center justify-center gap-2 px-3 text-center'>
              <ShoppingBag className='h-10 w-10 text-gray-300' aria-hidden />
              <span className='text-[11px] font-medium leading-snug text-gray-400'>
                Photo updating soon
              </span>
            </div>
          }

          <WishlistHeartButton
            productId={product._id}
            productName={product.name}
            onToggle={handleWishlist}
          />
        </div>

        <div className='flex min-h-[3rem] flex-1 flex-col px-3 py-2 text-left sm:min-h-[3.25rem] sm:px-4 sm:py-3'>
          <h3
            className='line-clamp-1 min-h-[1.20rem] font-serif text-sm font-medium leading-snug text-navy-900 sm:min-h-[1.175rem] sm:text-base'
            itemProp='name'
          >
            {product.name}
          </h3>

          <p
            className={cn(
              "mt-1 line-clamp-1 min-h-[1rem] text-[10px] font-medium uppercase tracking-[0.12em] text-gray-500 sm:min-h-[1.125rem] sm:text-[11px]",
              !fabricLine && "invisible",
            )}
            aria-hidden={!fabricLine}
          >
            {fabricLine || "\u00A0"}
          </p>

          <div
            className=' flex min-h-[1rem] shrink-0 items-center gap-0.5  sm:min-h-[1.125rem]'
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
              <span className='ml-0.5 text-[10px] tabular-nums text-gray-500'>
                {product.ratings.average.toFixed(1)} ({product.ratings.count})
              </span>
            : <span className='ml-0.5 text-[10px] tabular-nums text-transparent' aria-hidden>
                0.0 (0)
              </span>
            }
          </div>

          <div className='pt-1 sm:pt-1'>
            <ProductPriceBlock
              product={product}
              displayColor={displayColor}
              size='md'
              sellClassName='text-[#c5a059]'
              showBadge={priceDisplay.showDiscount}
            />
            <meta itemProp='price' content={priceMeta.priceContent} />
            <meta itemProp='priceCurrency' content='INR' />
          </div>
        </div>
      </Link>
    </article>
  );
}

const FeaturedProductCard = memo(FeaturedProductCardInner);
export default FeaturedProductCard;
