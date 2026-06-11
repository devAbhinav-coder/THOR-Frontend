"use client";

import { memo, useCallback, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, X } from "lucide-react";
import toast from "react-hot-toast";
import { Product } from "@/types";
import { cn, formatPrice } from "@/lib/utils";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useCartStore } from "@/store/useCartStore";
import { productApi } from "@/lib/api";
import { normalizeCloudinaryDeliveryUrl } from "@/lib/cloudinaryUrl";
import cloudinaryLoader from "@/lib/cloudinaryLoader";
import { hasInStockVariant } from "@/lib/productStock";
import { productNeedsCustomization } from "@/lib/productCustomization";

interface WishlistCardProps {
  product: Product;
  className?: string;
  onRemoved?: () => void;
}

function priceLabel(price: number): string {
  return formatPrice(price).replace("₹", "₹ ");
}

function WishlistCardInner({ product, className, onRemoved }: WishlistCardProps) {
  const [primaryImageError, setPrimaryImageError] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { toggleWishlist } = useWishlistStore();
  const { addToCart } = useCartStore();
  const router = useRouter();

  const isOutOfStock = !hasInStockVariant(product);
  const needsCustomization = productNeedsCustomization(product);

  const primaryUrl = useMemo(() => {
    return (
      normalizeCloudinaryDeliveryUrl(product.images[0]?.url) ||
      String(product.images[0]?.url || "").trim()
    );
  }, [product.images]);

  const showPrimaryImage = Boolean(primaryUrl) && !primaryImageError;

  const eyebrow = useMemo(() => {
    if (product.isFeatured) return "Handpicked Masterpiece";
    const fabric = product.fabric?.trim();
    if (fabric) return `${fabric} Collection`.toUpperCase();
    const cat = product.category?.trim();
    return cat ? `${cat} Collection`.toUpperCase() : "HERITAGE COLLECTION";
  }, [product.category, product.fabric, product.isFeatured]);

  const blurb = useMemo(() => {
    const short = product.shortDescription?.trim();
    if (short) return short;
    const desc = String(product.description || "").trim();
    return desc ? desc.slice(0, 120) : "";
  }, [product.description, product.shortDescription]);

  const productHref = `/shop/${encodeURIComponent(product.slug)}`;

  const handleRemove = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsRemoving(true);
      try {
        await toggleWishlist(product._id, product);
        onRemoved?.();
      } finally {
        setIsRemoving(false);
      }
    },
    [onRemoved, product, toggleWishlist],
  );

  const resolveProductForBag = useCallback(async (): Promise<{
    product: Product;
    variant: NonNullable<Product["variants"]>[number];
  } | null> => {
    let source = product;
    let variant =
      source.variants?.find((v) => (Number(v.stock) || 0) > 0 && v.sku) ||
      source.variants?.find((v) => v.sku) ||
      source.variants?.[0];

    if (!variant?.sku) {
      try {
        const res = await productApi.getBySlug(product.slug);
        source = res.data.product;
        variant =
          source.variants?.find((v) => (Number(v.stock) || 0) > 0 && v.sku) ||
          source.variants?.find((v) => v.sku) ||
          source.variants?.[0];
      } catch {
        return null;
      }
    }

    if (!variant?.sku) return null;
    return { product: source, variant };
  }, [product]);

  const handleMoveToBag = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isOutOfStock) {
        toast.error("This piece is currently unavailable");
        return;
      }
      if (needsCustomization) {
        router.push(productHref);
        return;
      }

      setIsAdding(true);
      try {
        const resolved = await resolveProductForBag();
        if (!resolved) {
          toast.error("Could not add to bag — open the product to choose options");
          router.push(productHref);
          return;
        }
        const { product: bagProduct, variant } = resolved;
        await addToCart(
          bagProduct._id,
          {
            sku: variant.sku,
            size: variant.size,
            color: variant.color,
            colorCode: variant.colorCode,
          },
          1,
          undefined,
          bagProduct,
          { successToast: false },
        );
        setIsRemoving(true);
        await toggleWishlist(product._id, bagProduct, { silent: true });
        if (useWishlistStore.getState().isInWishlist(product._id)) {
          setIsRemoving(false);
        } else {
          onRemoved?.();
        }
        toast.success("Moved to bag");
      } catch {
        setIsRemoving(false);
        toast.error("Could not move to bag");
      } finally {
        setIsAdding(false);
      }
    },
    [
      addToCart,
      isOutOfStock,
      needsCustomization,
      onRemoved,
      product._id,
      productHref,
      resolveProductForBag,
      router,
      toggleWishlist,
    ],
  );

  const handleQuickView = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      router.push(productHref);
    },
    [productHref, router],
  );

  return (
    <article
      className={cn(
        "group relative flex flex-col transition-all duration-[400ms]",
        isRemoving && "pointer-events-none translate-y-5 opacity-0",
        className,
      )}
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-gray-100">
        <Link
          href={productHref}
          className="absolute inset-0 z-0 block"
          aria-label={`View ${product.name}`}
        >
          {showPrimaryImage ? (
            <Image
              src={primaryUrl}
              alt={product.name}
              fill
              loader={cloudinaryLoader}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
              loading="lazy"
              quality={75}
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              onError={() => setPrimaryImageError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <ShoppingBag className="h-10 w-10 text-gray-300" aria-hidden />
            </div>
          )}
        </Link>

        {product.isFeatured && !isOutOfStock && (
          <span className="pointer-events-none absolute left-2 top-2 z-[1] bg-[#c5a059] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-white sm:left-4 sm:top-4 sm:px-3 sm:py-1 sm:text-[10px]">
            Limited Edition
          </span>
        )}

        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-end bg-navy-900/20 p-4 opacity-0 backdrop-blur-[2px] transition-opacity duration-[400ms] group-hover:pointer-events-auto group-hover:opacity-100 sm:p-6">
          <button
            type="button"
            onClick={handleMoveToBag}
            disabled={isAdding || isOutOfStock}
            className="pointer-events-auto w-full bg-navy-900 py-3.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-60 sm:py-4"
          >
            {isAdding
              ? "Adding…"
              : isOutOfStock
                ? "Unavailable"
                : needsCustomization
                  ? "Customize"
                  : "Move to Bag"}
          </button>
          <button
            type="button"
            onClick={handleQuickView}
            className="pointer-events-auto mt-2 w-full bg-white/90 py-3.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-900 transition-colors hover:bg-white sm:mt-3 sm:py-4"
          >
            Quick View
          </button>
        </div>

        <button
          type="button"
          onClick={handleRemove}
          disabled={isRemoving}
          className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 transition-colors hover:bg-white sm:right-4 sm:top-4 sm:h-10 sm:w-10"
          aria-label={`Remove ${product.name} from wishlist`}
        >
          <X className="h-4 w-4 text-navy-900 sm:h-[18px] sm:w-[18px]" />
        </button>
      </div>

      <div className="flex flex-col gap-0.5 pt-2 sm:gap-1 sm:pt-6">
        <span className="line-clamp-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#c5a059] sm:text-[11px] sm:tracking-[0.16em]">
          {eyebrow}
        </span>
        <Link href={productHref}>
          <h3 className="line-clamp-2 font-serif text-sm font-medium leading-snug text-navy-900 transition-colors hover:text-[#c5a059] sm:line-clamp-none sm:text-xl">
            {product.name}
          </h3>
        </Link>
        {blurb ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-gray-600 sm:text-sm">
            {blurb}
          </p>
        ) : null}
        <p className="mt-0.5 text-sm font-semibold text-navy-900 sm:mt-2 sm:text-lg">
          {priceLabel(product.price)}
        </p>
      </div>
    </article>
  );
}

const WishlistCard = memo(WishlistCardInner);
export default WishlistCard;
