"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export default function ProductCard({ product, className }: ProductCardProps) {
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [hoveredImage, setHoveredImage] = useState(false);
  const { addToCart } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  const inWishlist = isInWishlist(product._id);
  const isOutOfStock = product.totalStock === 0;
  const discountPercent =
    product.comparePrice ?
      Math.round(
        ((product.comparePrice - product.price) / product.comparePrice) * 100,
      )
    : 0;

  const displayImage =
    (hoveredImage && product.images[1]?.url) || product.images[0]?.url || "";
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
    const defaultVariant = product.variants.find((v) => v.stock > 0);
    if (!defaultVariant) {
      toast.error("No variants available");
      return;
    }
    setIsAddingToCart(true);
    try {
      await addToCart(
        product._id,
        {
          sku: defaultVariant.sku,
          size: defaultVariant.size,
          color: defaultVariant.color,
        },
        1,
      );
      toast.success("Added to cart!");
    } catch {
      /* handled in store */
    } finally {
      setIsAddingToCart(false);
    }
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
        },
        1,
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
    await toggleWishlist(product._id);
  };

  return (
    <div className={cn("group relative flex flex-col h-full", className)}>
      <Link href={`/shop/${product.slug}`} className='block'>
        {/* ── Image – 3:4 portrait, no cropping ── */}
        <div
          className='relative overflow-hidden rounded-2xl bg-gray-100'
          style={{ aspectRatio: "3/4" }}
          onMouseEnter={() => canUseHoverEffects && setHoveredImage(true)}
          onMouseLeave={() => canUseHoverEffects && setHoveredImage(false)}
        >
          {displayImage ?
            <Image
              src={displayImage}
              alt={product.name}
              fill
              sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
              className={cn(
                "object-cover transition-all duration-700",
                hoveredImage ? "scale-105" : "scale-100",
              )}
            />
          : <div className='absolute inset-0 flex items-center justify-center bg-gray-100'>
              <ShoppingBag className='w-12 h-12 text-gray-300' />
            </div>
          }

          {/* Gradient overlay — helps text/buttons over image */}
          <div className='absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300' />

          {/* Badges — top left */}
          <div className='absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10'>
            {discountPercent > 0 && (
              <span className='text-xs bg-brand-600 text-white font-bold px-2.5 py-0.5 rounded-full shadow-md'>
                -{discountPercent}%
              </span>
            )}
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
          {product.images.length > 1 && (
            <div className='hidden sm:flex absolute bottom-14 left-1/2 -translate-x-1/2 gap-1.5 z-10 opacity-0 sm:group-hover:opacity-100 transition-opacity'>
              {product.images.slice(0, 4).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "block rounded-full transition-all duration-300",
                    (i === 0 && !hoveredImage) || (i === 1 && hoveredImage) ?
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
                className='w-full py-2.5 rounded-xl bg-white hover:bg-gray-50 text-navy-900 text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg transition-colors disabled:opacity-70'
              >
                {isAddingToCart ?
                  <span className='h-3.5 w-3.5 rounded-full border-2 border-navy-300 border-t-navy-900 animate-spin' />
                : <ShoppingBag className='h-3.5 w-3.5' />}
                {isAddingToCart ? "Adding…" : "Add to Cart"}
              </button>
            </div>
          )}
        </div>

        {/* ── Info below image ── */}
        <div className='mt-3 space-y-1.5 flex flex-col min-h-[152px]'>
          {/* Category · Fabric · Subcategory */}
          <div className='flex items-center gap-1.5 flex-wrap'>
            <span className='text-[10px] font-bold text-brand-600 uppercase tracking-wider'>
              {product.category}
            </span>
            {product.fabric && (
              <>
                <span className='text-[10px] text-gray-300'>·</span>
                <span className='text-[10px] font-semibold text-gray-500 uppercase tracking-wide'>
                  {product.fabric}
                </span>
              </>
            )}
          </div>

          {/* Product name */}
          <h3 className='text-sm font-semibold text-gray-900 line-clamp-2 leading-snug min-h-[40px]'>
            {product.name}
          </h3>

          {/* Color swatches */}
          {(() => {
            const uniqueColors = product.variants
              .filter((v) => v.color)
              .reduce<{ color: string; colorCode?: string }[]>((acc, v) => {
                if (!acc.find((c) => c.color === v.color)) {
                  acc.push({ color: v.color!, colorCode: v.colorCode });
                }
                return acc;
              }, []);
            if (uniqueColors.length === 0) return null;
            const MAX = 5;
            const visible = uniqueColors.slice(0, MAX);
            const extra = uniqueColors.length - MAX;
            return (
              <div className='flex items-center gap-1.5 flex-wrap'>
                {visible.map(({ color, colorCode }) =>
                  colorCode ? (
                    <span
                      key={color}
                      title={color}
                      className='h-4 w-4 rounded-full border border-gray-200 shadow-sm flex-shrink-0'
                      style={{ background: colorCode }}
                    />
                  ) : (
                    <span
                      key={color}
                      className='text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full leading-none'
                    >
                      {color}
                    </span>
                  )
                )}
                {extra > 0 && (
                  <span className='text-[10px] font-semibold text-gray-400'>
                    +{extra}
                  </span>
                )}
              </div>
            );
          })()}

          {/* Stars */}
          {product.ratings.count > 0 && (
            <div className='flex items-center gap-1'>
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-3 w-3",
                    i < Math.round(product.ratings.average) ?
                      "fill-gold-400 text-gold-400"
                    : "fill-gray-200 text-gray-200",
                  )}
                />
              ))}
              <span className='text-[10px] text-gray-400 ml-0.5'>
                ({product.ratings.count})
              </span>
            </div>
          )}
          {product.ratings.count === 0 && <div className='h-[14px]' />}

          {/* Price row */}
          <div className='flex items-center flex-wrap gap-x-2 gap-y-0.5'>
            <span className='text-base font-bold text-gray-900'>
              {formatPrice(product.price)}
            </span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className='text-sm text-gray-400 line-through'>
                {formatPrice(product.comparePrice)}
              </span>
            )}
            {discountPercent > 0 && (
              <span className='text-xs text-green-600 font-semibold'>
                {discountPercent}% off
              </span>
            )}
          </div>

          {/* Status row (fixed height so cards don't jump) */}
          <div className='min-h-[22px]'>
            {!isOutOfStock && product.totalStock > 0 && product.totalStock <= 5 ? (
              <p className='text-xs font-semibold text-amber-700'>
                <span className='inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 whitespace-nowrap'>
                  <span aria-hidden>⚡</span> Only a few left!
                </span>
              </p>
            ) : (
              <div className='h-[22px]' />
            )}
          </div>

          {/* Spacer to keep card heights consistent */}
          <div className='mt-auto' />
        </div>
      </Link>

      {/* Mobile CTA — always visible on small screens */}
      <div className='sm:hidden mt-3'>
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
          : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
