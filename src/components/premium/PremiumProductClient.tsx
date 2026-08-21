"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  Minus,
  Plus,
  ShoppingBag,
  Zap,
} from "lucide-react";
import PremiumFadeIn from "@/components/premium/PremiumFadeIn";
import PremiumWishlistButton from "@/components/premium/PremiumWishlistButton";
import type {
  PremiumEditorialPanel,
  PremiumProduct,
} from "@/lib/premiumCollectionData";
import {
  PREMIUM_CRAFT_IMAGE,
  PREMIUM_EDITORIAL_IMAGE,
} from "@/lib/premiumCollectionData";
import type { PremiumProductView } from "@/lib/premiumProductMapper";
import { writeBuyNowToSession } from "@/lib/buyNowCheckoutSession";
import { loginUrlWithRedirect } from "@/lib/safeRedirect";
import { hasInStockVariant } from "@/lib/productStock";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import type { Product } from "@/types";
import { cn, formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";

type Props = {
  product: PremiumProductView;
  related: PremiumProductView[];
};

const DETAILS: Array<
  | { label: string; key: keyof Pick<PremiumProduct, "fabric"> }
  | { label: string; value: string }
> = [
  { label: "Fabric", key: "fabric" },
  { label: "Origin", value: "India" },
  { label: "Care", value: "Dry clean only" },
];

function EditorialImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative aspect-[3/4] overflow-hidden bg-account-surface-variant",
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className='object-cover'
        sizes='(max-width: 768px) 100vw, 45vw'
      />
    </div>
  );
}

function EditorialTextPanel({
  panel,
  align = "start",
}: {
  panel: PremiumEditorialPanel;
  align?: "start" | "end";
}) {
  return (
    <div
      className={cn(
        "flex flex-col justify-center px-2 py-8 md:px-6 md:py-0",
        align === "end" ?
          "md:items-end md:text-right"
        : "md:items-start md:text-left",
      )}
    >
      <div className='max-w-xs space-y-6'>
        {panel.title ?
          <h3 className='font-serif text-lg font-semibold leading-tight text-neutral-900 md:text-xl'>
            {panel.title}
          </h3>
        : null}

        {panel.fields.map((field) =>
          field.label.trim() || field.value.trim() ?
            <div key={field.label || field.value}>
              <p className='text-[11px] font-semibold uppercase tracking-[0.12em] text-account-on-surface-variant'>
                {field.label}
              </p>
              <p className='mt-1 text-[15px] font-light lowercase text-neutral-800 first-letter:uppercase'>
                {field.value}
              </p>
            </div>
          : null,
        )}

        {panel.note ?
          <p className='text-[14px] font-light leading-relaxed text-account-on-surface-variant'>
            {panel.note}
          </p>
        : null}
      </div>
    </div>
  );
}

type EditorialRow =
  | { type: "feature"; image: string; align: "start" | "end" }
  | { type: "pair"; left: string; right: string }
  | { type: "single"; image: string };

/** First + last rows are always image+text; middle rows are dynamic 2-image pairs. */
function buildEditorialRows(
  gallery: string[],
  fallbacks: { editorial: string; craft: string },
): EditorialRow[] {
  const editorial =
    gallery.length > 1 ? gallery.slice(1) : [fallbacks.editorial, fallbacks.craft];

  const first = editorial[0] ?? fallbacks.editorial;
  const last =
    editorial.length > 1 ? editorial[editorial.length - 1]! : fallbacks.craft;
  const middle = editorial.length > 2 ? editorial.slice(1, -1) : [];

  const rows: EditorialRow[] = [
    { type: "feature", image: first, align: "start" },
  ];

  for (let i = 0; i < middle.length; i += 2) {
    if (i + 1 < middle.length) {
      rows.push({ type: "pair", left: middle[i]!, right: middle[i + 1]! });
    } else {
      rows.push({ type: "single", image: middle[i]! });
    }
  }

  rows.push({ type: "feature", image: last, align: "end" });
  return rows;
}

/** Hero carousel: main hero image + first product gallery image only. */
function buildHeroSlides(product: PremiumProductView): string[] {
  const hero = product.heroImage;
  const firstProductImage = product.images[0];

  if (!firstProductImage) return [hero];
  if (firstProductImage !== hero) return [hero, firstProductImage];

  const secondProductImage = product.images[1];
  if (secondProductImage && secondProductImage !== hero) {
    return [hero, secondProductImage];
  }

  return [hero];
}

export default function PremiumProductClient({ product, related }: Props) {
  const router = useRouter();
  const { addToCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [activeImage, setActiveImage] = useState(0);
  const [isHeroAutoPlaying, setIsHeroAutoPlaying] = useState(true);
  const [qty, setQty] = useState(1);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);

  const isLiveProduct = product._id !== product.slug;
  const selectedVariant = product.variants[0];
  const isOutOfStock =
    isLiveProduct ? !hasInStockVariant(product as unknown as Product) : false;

  const cartProduct = useMemo((): Product | undefined => {
    if (!isLiveProduct) return undefined;
    return {
      _id: product._id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      category: "Premium",
      fabric: product.fabric,
      images: product.images.map((url, i) => ({
        url,
        publicId: `premium/${product.slug}/${i}`,
      })),
      variants: product.variants,
      totalStock: product.totalStock,
      tags: ["premium"],
      isFeatured: false,
      isActive: product.isActive,
      isPremium: true,
      ratings: { average: 0, count: 0 },
      createdAt: new Date().toISOString(),
    };
  }, [isLiveProduct, product]);

  const productGallery = useMemo(
    () => (product.images.length > 0 ? product.images : [product.heroImage]),
    [product.heroImage, product.images],
  );

  const heroSlides = useMemo(() => buildHeroSlides(product), [product]);

  const editorialRows = useMemo(
    () =>
      buildEditorialRows(productGallery, {
        editorial: PREMIUM_EDITORIAL_IMAGE,
        craft: PREMIUM_CRAFT_IMAGE,
      }),
    [productGallery],
  );

  useEffect(() => {
    if (heroSlides.length <= 1 || !isHeroAutoPlaying) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reducedMotion) return;

    const interval = window.setInterval(() => {
      setActiveImage((prev) => (prev + 1) % heroSlides.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [heroSlides.length, isHeroAutoPlaying]);

  useEffect(() => {
    if (activeImage >= heroSlides.length) setActiveImage(0);
  }, [activeImage, heroSlides.length]);

  const goToHeroImage = useCallback((index: number) => {
    setActiveImage(index);
    setIsHeroAutoPlaying(false);
    window.setTimeout(() => setIsHeroAutoPlaying(true), 10000);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const requireAuth = (msg: string) => {
    toast.error(msg);
    router.push(loginUrlWithRedirect(window.location.pathname + window.location.search));
  };

  const handleAddToBag = async () => {
    if (!isLiveProduct || !selectedVariant || !cartProduct) {
      toast.success("Premium pieces launch soon — we will notify you.", {
        icon: "✦",
      });
      return;
    }
    if (!isAuthenticated) return requireAuth("Sign in to add items to cart");
    if (isOutOfStock) {
      toast.error("This piece is currently out of stock");
      return;
    }
    setIsAddingToCart(true);
    try {
      await addToCart(
        product._id,
        {
          size: selectedVariant.size,
          color: selectedVariant.color,
          colorCode: selectedVariant.colorCode,
          sku: selectedVariant.sku,
          stock: selectedVariant.stock,
          price: selectedVariant.price,
        },
        qty,
        undefined,
        cartProduct,
      );
      toast.success("Added to bag");
    } catch {
      /* handled in store */
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isLiveProduct || !selectedVariant || !cartProduct) {
      toast.success("Premium checkout opens soon — we will notify you.", {
        icon: "✦",
      });
      return;
    }
    if (!isAuthenticated) return requireAuth("Sign in to buy now");
    if (isOutOfStock) return;

    setIsBuyingNow(true);
    try {
      writeBuyNowToSession({
        productId: product._id,
        name: product.name,
        image: product.heroImage || product.images[0] || "",
        quantity: qty,
        price: selectedVariant.price ?? product.price,
        variant: {
          size: selectedVariant.size,
          color: selectedVariant.color,
          colorCode: selectedVariant.colorCode,
          sku: selectedVariant.sku,
        },
      });
      router.push("/checkout?buyNow=1");
    } finally {
      setIsBuyingNow(false);
    }
  };

  const mobileBottomReserve =
    "pb-[calc(4.75rem+env(safe-area-inset-bottom,0px))] lg:pb-6";

  return (
    <div className={cn("bg-[#fcf9f8] text-[#1a1a1a]", mobileBottomReserve)}>
      {/* Premium back bar — moves up with auto-hide navbar */}
      <div
        className={cn(
          "fixed inset-x-0 top-[var(--store-sticky-nav-offset,4.25rem)] z-40 border-b transition-[top,background-color,box-shadow,border-color] duration-300 ease-out motion-reduce:transition-none",
          scrolled ?
            "border-black/10 bg-[#fcf9f8]/95 backdrop-blur-md shadow-sm"
          : "border-transparent bg-[#fcf9f8]/80 backdrop-blur-sm",
        )}
      >
        <div className='mx-auto flex h-12 max-w-[1280px] items-center justify-between px-5 md:px-16'>
          <Link
            href='/premium'
            className='inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-account-primary transition-colors hover:text-brand-600'
          >
            <ArrowLeft className='h-4 w-4' aria-hidden />
            Premium
          </Link>
          <p className='hidden max-w-[50vw] truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-account-on-surface-variant sm:block'>
            {product.name}
          </p>
          <div className='flex items-center gap-2.5'>
            <PremiumWishlistButton
              slug={product.slug}
              productId={isLiveProduct ? product._id : undefined}
              product={cartProduct}
              productName={product.name}
              size='sm'
            />
            <span className='text-sm tabular-nums text-account-primary'>
              {formatPrice(product.price)}
            </span>
          </div>
        </div>
      </div>

      {/* Full-bleed hero — auto-fade carousel */}
      <section className='relative h-[100svh] w-full overflow-hidden'>
        {heroSlides.map((src, i) => (
          <div
            key={`${src}-${i}`}
            className={cn(
              "absolute inset-0 transition-opacity duration-[1200ms] ease-out motion-reduce:transition-none",
              i === activeImage ? "opacity-100" : "opacity-0",
            )}
            aria-hidden={i !== activeImage}
          >
            <Image
              src={src}
              alt={`${product.name} — view ${i + 1}`}
              fill
              priority={i === 0}
              className='object-cover object-center'
              sizes='100vw'
            />
          </div>
        ))}
        <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent' />

        <div className='absolute inset-x-0 bottom-0 z-10 px-5 pb-10 md:px-16 md:pb-16'>
          <PremiumFadeIn className='mx-auto max-w-[1280px] text-white'>
            <p className='text-[11px] font-semibold uppercase tracking-[0.2em] text-white/75'>
              {product.subtitle}
            </p>
            <h1 className='mt-3 font-serif text-[clamp(1.75rem,6vw,3.5rem)] font-semibold leading-tight tracking-tight'>
              {product.name}
            </h1>
            <p className='mt-4 max-w-xl text-base font-light leading-relaxed text-white/90'>
              {product.description}
            </p>
            <p className='mt-6 text-xl tabular-nums'>
              {formatPrice(product.price)}
            </p>
          </PremiumFadeIn>
        </div>

        {heroSlides.length > 1 && (
          <div
            className='absolute bottom-6 right-5 z-10 flex flex-col gap-2 md:right-16'
            aria-label='Hero image navigation'
          >
            {heroSlides.map((src, i) => (
              <button
                key={`${src}-dot-${i}`}
                type='button'
                aria-label={
                  i === 0 ? "View hero image" : "View first product image"
                }
                aria-current={i === activeImage ? "true" : undefined}
                onClick={() => goToHeroImage(i)}
                className={cn(
                  "h-1.5 w-8 rounded-full transition-colors",
                  i === activeImage ?
                    "bg-white"
                  : "bg-white/35 hover:bg-white/60",
                )}
              />
            ))}
          </div>
        )}
      </section>

      {/* Editorial gallery — dynamic: feature row, pair rows, feature row */}
      <section className='mx-auto max-w-[1280px] px-5 py-6 md:px-16 md:py-10'>
        {editorialRows.map((row, index) => (
          <PremiumFadeIn
            key={`${row.type}-${index}`}
            className={index > 0 ? "mt-6 md:mt-10" : undefined}
          >
            {row.type === "feature" && row.align === "start" && (
              <div className='grid items-center gap-8 md:grid-cols-2 md:gap-16 lg:gap-24'>
                <EditorialImage
                  src={row.image}
                  alt={`${product.name} — editorial`}
                />
                <EditorialTextPanel panel={product.editorialOpen} />
              </div>
            )}

            {row.type === "feature" && row.align === "end" && (
              <div className='grid items-center gap-8 md:grid-cols-2 md:gap-16 lg:gap-24'>
                <EditorialTextPanel
                  panel={product.editorialClose}
                  align='end'
                />
                <EditorialImage
                  src={row.image}
                  alt={`${product.name} — detail`}
                />
              </div>
            )}

            {row.type === "pair" && (
              <div className='grid grid-cols-2 gap-1 md:gap-2'>
                <EditorialImage
                  src={row.left}
                  alt={`${product.name} — look ${index}`}
                />
                <EditorialImage
                  src={row.right}
                  alt={`${product.name} — look ${index + 1}`}
                />
              </div>
            )}

            {row.type === "single" && (
              <EditorialImage
                src={row.image}
                alt={`${product.name} — editorial`}
              />
            )}
          </PremiumFadeIn>
        ))}
      </section>

      {/* Atelier note + product details */}
      <section className='border-y border-black/8 bg-white px-5 py-16 md:px-16 md:py-24'>
        <div className='mx-auto grid max-w-[1280px] gap-10 md:grid-cols-[1fr_1.2fr] md:gap-20'>
          <PremiumFadeIn>
            <p className='text-[11px] font-semibold uppercase tracking-[0.18em] text-account-on-surface-variant'>
              Atelier note
            </p>
            {product.weaveHours > 0 ?
              <h2 className='mt-4 font-serif text-3xl font-semibold leading-tight md:text-4xl'>
                {product.weaveHours}+ hours of handloom work
              </h2>
            : null}
          </PremiumFadeIn>
          <PremiumFadeIn>
            {product.craftNote ?
              <p className='text-lg font-light leading-relaxed text-account-on-surface-variant'>
                {product.craftNote}
              </p>
            : null}
            <button
              type='button'
              onClick={() => setDetailsOpen((o) => !o)}
              className={cn(
                "flex w-full items-center justify-between border-b border-account-primary/20 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em]",
                product.craftNote && "mt-8",
              )}
            >
              Product details
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  detailsOpen && "rotate-180",
                )}
                aria-hidden
              />
            </button>
            {detailsOpen && (
              <dl className='mt-4 space-y-3 border-b border-account-primary/10 pb-6'>
                {DETAILS.map((row) => (
                  <div
                    key={row.label}
                    className='flex justify-between gap-4 text-sm'
                  >
                    <dt className='text-account-on-surface-variant'>
                      {row.label}
                    </dt>
                    <dd className='font-medium text-account-primary'>
                      {"key" in row ? product[row.key] : row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </PremiumFadeIn>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className='mx-auto max-w-[1280px] px-5 py-16 md:px-16 md:py-24'>
          <h2 className='font-serif text-2xl font-semibold tracking-wide md:text-3xl'>
            More from the Premium Edit
          </h2>
          <div className='mt-10 grid grid-cols-1 gap-12 sm:grid-cols-3 sm:gap-8'>
            {related.map((item) => (
              <PremiumFadeIn key={item.slug}>
                <Link href={`/premium/${item.slug}`} className='group block'>
                  <div className='relative mb-4 aspect-[3/4] overflow-hidden bg-account-surface-variant'>
                    <Image
                      src={item.heroImage}
                      alt={item.name}
                      fill
                      className='object-cover transition-transform duration-700 group-hover:scale-105'
                      sizes='(max-width: 640px) 100vw, 33vw'
                    />
                    <PremiumWishlistButton
                      slug={item.slug}
                      productId={item._id !== item.slug ? item._id : undefined}
                      productName={item.name}
                      className='absolute top-2.5 right-2.5 z-10'
                    />
                  </div>
                  <p className='text-[11px] font-semibold uppercase tracking-[0.12em] text-account-on-surface-variant'>
                    {item.fabric}
                  </p>
                  <h3 className='mt-1 font-serif text-lg'>{item.name}</h3>
                  <p className='mt-2 text-sm text-account-primary/80'>
                    {formatPrice(item.price)}
                  </p>
                </Link>
              </PremiumFadeIn>
            ))}
          </div>
        </section>
      )}

      {/* Mobile purchase bar — Add to Bag + Buy Now */}
      <div
        className='fixed inset-x-0 bottom-0 z-[88] border-t border-black/10 bg-[#fcf9f8]/95 backdrop-blur-md pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-6px_28px_rgba(0,13,33,0.08)] lg:hidden'
        role='toolbar'
        aria-label='Purchase actions'
      >
        <div className='mx-auto flex max-w-[1280px] items-center gap-2 px-4 py-3'>
          <div className='flex shrink-0 items-center border border-black/15'>
            <button
              type='button'
              aria-label='Decrease quantity'
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className='flex h-11 w-9 items-center justify-center transition-colors active:bg-black/5'
            >
              <Minus className='h-3.5 w-3.5' aria-hidden />
            </button>
            <span className='flex h-11 min-w-[1.75rem] items-center justify-center text-sm tabular-nums'>
              {qty}
            </span>
            <button
              type='button'
              aria-label='Increase quantity'
              onClick={() => setQty((q) => q + 1)}
              className='flex h-11 w-9 items-center justify-center transition-colors active:bg-black/5'
            >
              <Plus className='h-3.5 w-3.5' aria-hidden />
            </button>
          </div>

          <button
            type='button'
            onClick={handleAddToBag}
            disabled={isLiveProduct && (isOutOfStock || isAddingToCart)}
            className='flex min-w-0 flex-1 items-center justify-center gap-1.5 border border-account-primary bg-white py-3.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-account-primary transition-colors active:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50 sm:text-[11px] sm:tracking-[0.18em]'
          >
            {isAddingToCart ?
              <span className='h-4 w-4 animate-spin rounded-full border-2 border-account-primary/30 border-t-account-primary' />
            : <>
                <ShoppingBag className='h-4 w-4 shrink-0' aria-hidden />
                Add to Bag
              </>
            }
          </button>
          <button
            type='button'
            onClick={handleBuyNow}
            disabled={isLiveProduct && (isOutOfStock || isBuyingNow)}
            className='flex min-w-0 flex-1 items-center justify-center gap-1.5 bg-account-primary py-3.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white transition-colors active:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 sm:text-[11px] sm:tracking-[0.18em]'
          >
            {isBuyingNow ?
              <span className='h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white' />
            : <>
                <Zap className='h-4 w-4 shrink-0' aria-hidden />
                Buy Now
              </>
            }
          </button>
        </div>
      </div>

      {/* Desktop purchase bar */}
      <div className='fixed inset-x-0 bottom-0 z-[88] hidden border-t border-black/10 bg-[#fcf9f8]/95 backdrop-blur-md lg:block'>
        <div className='mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-5 py-4 md:px-16'>
          <div className='min-w-0'>
            <p className='truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-account-on-surface-variant'>
              {product.name}
            </p>
            <p className='text-lg tabular-nums text-account-primary'>
              {formatPrice(product.price)}
            </p>
          </div>

          <div className='flex items-center gap-3 sm:gap-4'>
            <div className='flex items-center border border-black/15'>
              <button
                type='button'
                aria-label='Decrease quantity'
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className='flex h-11 w-11 items-center justify-center transition-colors hover:bg-black/5'
              >
                <Minus className='h-4 w-4' aria-hidden />
              </button>
              <span className='flex h-11 min-w-[2.5rem] items-center justify-center text-sm tabular-nums'>
                {qty}
              </span>
              <button
                type='button'
                aria-label='Increase quantity'
                onClick={() => setQty((q) => q + 1)}
                className='flex h-11 w-11 items-center justify-center transition-colors hover:bg-black/5'
              >
                <Plus className='h-4 w-4' aria-hidden />
              </button>
            </div>

            <button
              type='button'
              onClick={handleAddToBag}
              className='inline-flex h-11 items-center justify-center gap-2 border border-account-primary bg-white px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-account-primary transition-colors hover:bg-black/5'
            >
              <ShoppingBag className='h-4 w-4' aria-hidden />
              Add to Bag
            </button>

            <button
              type='button'
              onClick={handleBuyNow}
              className='inline-flex h-11 min-w-[180px] items-center justify-center gap-2 bg-account-primary px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-brand-700'
            >
              <Zap className='h-4 w-4' aria-hidden />
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
