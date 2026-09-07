"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ShoppingBag,
  Zap,
} from "lucide-react";
import PremiumFadeIn from "@/components/premium/PremiumFadeIn";
import PremiumWishlistButton from "@/components/premium/PremiumWishlistButton";
import { PdpStorySection } from "@/components/product/pdp/PdpStorySection";
import type { PremiumEditorialPanel } from "@/lib/premiumCollectionData";
import {
  PREMIUM_CRAFT_IMAGE,
  PREMIUM_EDITORIAL_IMAGE,
} from "@/lib/premiumCollectionData";
import type { PremiumProductView } from "@/lib/premiumProductMapper";
import { writeBuyNowToSession } from "@/lib/buyNowCheckoutSession";
import { loginUrlWithRedirect } from "@/lib/safeRedirect";
import { isFreeProductSize } from "@/lib/productCatalogOptions";
import { getSelectedVariantPriceDisplay } from "@/lib/productPricing";
import { hasInStockVariant } from "@/lib/productStock";
import { productApi } from "@/lib/api";
import { trackViewContent } from "@/lib/metaPixel";
import { trackGaViewItem } from "@/lib/googleAnalytics";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import type { Product, ProductVariant } from "@/types";
import { cn, formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";

type Props = {
  product: PremiumProductView;
  related: PremiumProductView[];
};

function normalizeVariants(variants: ProductVariant[]): ProductVariant[] {
  return variants.map((v) => ({
    ...v,
    size: v.size?.trim() || "Free Size",
  }));
}

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

function PremiumPriceInline({
  sellLabel,
  mrpLabel,
  discountPercent,
  className,
  sellClassName,
}: {
  sellLabel: string;
  mrpLabel: string | null;
  discountPercent: number;
  className?: string;
  sellClassName?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-baseline gap-2", className)}>
      <span className={cn("tabular-nums text-account-primary", sellClassName)}>
        {sellLabel}
      </span>
      {mrpLabel ?
        <span className='text-sm tabular-nums text-black/40 line-through'>
          {mrpLabel}
        </span>
      : null}
      {discountPercent >= 1 ?
        <span className='text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8a6d3b]'>
          {discountPercent}% OFF
        </span>
      : null}
    </div>
  );
}

function PremiumSizeChips({
  sizes,
  selectedVariant,
  getVariant,
  onSelect,
  compact = false,
}: {
  sizes: string[];
  selectedVariant: ProductVariant | null;
  getVariant: (size: string) => ProductVariant | undefined;
  onSelect: (v: ProductVariant) => void;
  compact?: boolean;
}) {
  if (sizes.length === 0) return null;

  return (
    <div
      className={cn(
        "flex max-w-full items-center gap-1.5 overflow-x-auto",
        compact ? "scrollbar-none" : "",
      )}
      role='group'
      aria-label='Select size'
    >
      {sizes.map((size) => {
        const v = getVariant(size);
        const ok = v && v.stock > 0;
        const selected = selectedVariant?.size === size;
        return (
          <button
            key={size}
            type='button'
            onClick={() => v && onSelect(v)}
            disabled={!ok}
            className={cn(
              "shrink-0 border px-2.5 py-2 text-[10px] font-semibold uppercase tracking-wide transition-colors sm:px-3 sm:text-[11px]",
              compact ? "h-11 min-w-[2.75rem]" : "min-w-[3rem] py-2.5",
              selected ?
                "border-account-primary bg-account-primary text-white"
              : ok ?
                "border-black/15 bg-white text-account-primary hover:border-account-primary/50"
              : "cursor-not-allowed border-black/10 bg-black/[0.03] text-black/25 line-through",
            )}
          >
            {size}
          </button>
        );
      })}
    </div>
  );
}

export default function PremiumProductClient({ product, related }: Props) {
  const router = useRouter();
  const { addToCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [activeImage, setActiveImage] = useState(0);
  const [isHeroAutoPlaying, setIsHeroAutoPlaying] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);

  const isLiveProduct = product._id !== product.slug;

  const variants = useMemo(
    () => normalizeVariants(product.variants || []),
    [product.variants],
  );

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    () => variants.find((v) => v.stock > 0) ?? variants[0] ?? null,
  );

  useEffect(() => {
    setSelectedVariant(
      variants.find((v) => v.stock > 0) ?? variants[0] ?? null,
    );
  }, [product._id, variants]);

  /** Same as shop PDP: Free Size never appears as a chip — size UI only when real sizes exist. */
  const sizes = useMemo(() => {
    const unique = Array.from(
      new Set(variants.map((v) => v.size).filter(Boolean)),
    ) as string[];
    return unique.filter((s) => !isFreeProductSize(s));
  }, [variants]);

  const getVariantBySize = useCallback(
    (size: string) =>
      variants.find((v) => v.size === size && v.stock > 0) ??
      variants.find((v) => v.size === size),
    [variants],
  );

  const storyProduct = useMemo((): Product => {
    return {
      _id: product._id,
      name: product.name,
      slug: product.catalogSlug || product.slug,
      description: product.description,
      shortDescription: product.shortDescription,
      price: product.price,
      comparePrice: product.comparePrice,
      discountPercent: product.discountPercent,
      saleCampaignId: product.saleCampaignId,
      saleBadge: product.saleBadge,
      category: product.category || "Premium",
      subcategory: product.subcategory,
      fabric: product.fabric,
      careInstructions: product.careInstructions,
      highlights: product.highlights,
      productDetails: product.productDetails,
      occasions: product.occasions,
      motionVideoUrl: product.motionVideoUrl,
      motionReelUrl: product.motionReelUrl,
      images: product.images.map((url, i) => ({
        url,
        publicId: `premium/${product.slug}/${i}`,
      })),
      variants: product.variants,
      totalStock: product.totalStock,
      tags: product.tags?.length ? product.tags : ["premium"],
      isFeatured: false,
      isActive: product.isActive,
      isPremium: true,
      premiumSlug: product.slug,
      ratings: { average: 0, count: 0 },
      createdAt: new Date().toISOString(),
    };
  }, [product]);

  const cartProduct = useMemo((): Product | undefined => {
    if (!isLiveProduct) return undefined;
    return storyProduct;
  }, [isLiveProduct, storyProduct]);

  /* Analytics: one counted view per product per browser session (same as shop PDP) */
  useEffect(() => {
    if (!isLiveProduct) return;
    const viewSlug = product.catalogSlug || product.slug;
    if (!viewSlug) return;
    const key = `hor_pv_${viewSlug}`;
    try {
      if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(key))
        return;
      if (typeof sessionStorage !== "undefined")
        sessionStorage.setItem(key, "1");
    } catch {
      /* storage blocked */
    }
    productApi.recordView(viewSlug).catch(() => {});
  }, [isLiveProduct, product.catalogSlug, product.slug]);

  /* Meta Pixel + GA: one ViewContent / view_item per premium PDP visit */
  const hasTrackedViewContent = useRef(false);
  useEffect(() => {
    hasTrackedViewContent.current = false;
  }, [product._id]);
  useEffect(() => {
    if (
      !isLiveProduct ||
      !cartProduct ||
      !selectedVariant ||
      hasTrackedViewContent.current
    )
      return;
    hasTrackedViewContent.current = true;
    trackViewContent(cartProduct, selectedVariant);
    trackGaViewItem(cartProduct);
  }, [isLiveProduct, cartProduct, product._id, selectedVariant?.sku]);

  const priceDisplay = useMemo(() => {
    if (cartProduct && selectedVariant) {
      const d = getSelectedVariantPriceDisplay(cartProduct, selectedVariant);
      const mrp =
        d.mrp ??
        (product.comparePrice != null && product.comparePrice > d.sell ?
          product.comparePrice
        : null);
      const discountPercent =
        d.discountPercent >= 1 ? d.discountPercent
        : mrp != null && mrp > d.sell ?
          Math.round(((mrp - d.sell) / mrp) * 100)
        : 0;
      return {
        sell: d.sell,
        sellLabel: d.sellLabel,
        mrp,
        mrpLabel: mrp != null ? formatPrice(mrp) : null,
        discountPercent,
      };
    }
    const sell = product.price;
    const mrp =
      product.comparePrice != null && product.comparePrice > sell ?
        product.comparePrice
      : null;
    const discountPercent =
      mrp != null ? Math.round(((mrp - sell) / mrp) * 100) : 0;
    return {
      sell,
      sellLabel: formatPrice(sell),
      mrp,
      mrpLabel: mrp != null ? formatPrice(mrp) : null,
      discountPercent,
    };
  }, [cartProduct, selectedVariant, product.price, product.comparePrice]);

  const isOutOfStock =
    isLiveProduct ?
      !selectedVariant ||
        selectedVariant.stock <= 0 ||
        !hasInStockVariant(product as unknown as Product)
    : false;

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
    router.push(
      loginUrlWithRedirect(window.location.pathname + window.location.search),
    );
  };

  const handleAddToBag = async () => {
    if (!isLiveProduct || !selectedVariant || !cartProduct) {
      toast.success("Premium pieces launch soon — we will notify you.", {
        icon: "✦",
      });
      return;
    }
    if (!isAuthenticated) return requireAuth("Sign in to add items to cart");
    if (selectedVariant.stock <= 0) {
      toast.error("Please select an available size");
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
        1,
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
    if (selectedVariant.stock <= 0) {
      toast.error("Please select an available size");
      return;
    }

    setIsBuyingNow(true);
    try {
      writeBuyNowToSession({
        productId: product._id,
        name: product.name,
        image: product.heroImage || product.images[0] || "",
        quantity: 1,
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
    "pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:pb-6";

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
          <p className='hidden max-w-[40vw] truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-account-on-surface-variant sm:block'>
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
            <PremiumPriceInline
              sellLabel={priceDisplay.sellLabel}
              mrpLabel={priceDisplay.mrpLabel}
              discountPercent={priceDisplay.discountPercent}
              sellClassName='text-sm'
            />
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
            <div className='mt-6 flex flex-wrap items-baseline gap-2.5'>
              <span className='text-xl tabular-nums'>
                {priceDisplay.sellLabel}
              </span>
              {priceDisplay.mrpLabel ?
                <span className='text-base tabular-nums text-white/50 line-through'>
                  {priceDisplay.mrpLabel}
                </span>
              : null}
              {priceDisplay.discountPercent >= 1 ?
                <span className='text-[11px] font-semibold uppercase tracking-[0.12em] text-[#e4c27a]'>
                  {priceDisplay.discountPercent}% OFF
                </span>
              : null}
            </div>
            {sizes.length > 0 ?
              <div className='mt-5'>
                <p className='mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70'>
                  Size
                  {selectedVariant?.size ?
                    <span className='ml-2 font-medium normal-case tracking-normal text-white/90'>
                      {selectedVariant.size}
                    </span>
                  : null}
                </p>
                <div className='flex flex-wrap gap-2'>
                  {sizes.map((size) => {
                    const v = getVariantBySize(size);
                    const ok = v && v.stock > 0;
                    const selected = selectedVariant?.size === size;
                    return (
                      <button
                        key={size}
                        type='button'
                        onClick={() => v && setSelectedVariant(v)}
                        disabled={!ok}
                        className={cn(
                          "min-w-[3.25rem] border px-3 py-2 text-[11px] font-semibold uppercase tracking-wide transition-colors",
                          selected ?
                            "border-white bg-white text-account-primary"
                          : ok ?
                            "border-white/50 bg-transparent text-white hover:border-white"
                          : "cursor-not-allowed border-white/20 text-white/30 line-through",
                        )}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            : null}
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
              <div className='grid gap-4 md:grid-cols-2 md:gap-8'>
                <EditorialImage
                  src={row.left}
                  alt={`${product.name} — gallery`}
                />
                <EditorialImage
                  src={row.right}
                  alt={`${product.name} — gallery`}
                />
              </div>
            )}

            {row.type === "single" && (
              <EditorialImage
                src={row.image}
                alt={`${product.name} — gallery`}
                className='mx-auto max-w-xl'
              />
            )}
          </PremiumFadeIn>
        ))}
      </section>

      {/* Shop-style story: Fabric & Care, description, Why You'll Love It */}
      <PdpStorySection
        product={storyProduct}
        selectedVariant={selectedVariant}
        layout='premium'
        motionVideoUrl={product.motionVideoUrl}
        motionReelUrl={product.motionReelUrl}
        motionPosterUrl={
          product.images.length > 1 ?
            product.images[1]
          : product.images[0] || product.heroImage
        }
      />

      {related.length > 0 && (
        <section className='border-t border-black/10 bg-white px-5 py-12 md:px-16'>
          <div className='mx-auto max-w-[1280px]'>
            <h2 className='font-serif text-2xl font-semibold tracking-wide'>
              More hand painted & pure silk pieces
            </h2>
            <div className='mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3'>
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
                    </div>
                    <p className='font-serif text-lg tracking-wide'>
                      {item.name}
                    </p>
                    <p className='mt-1 text-sm tabular-nums text-account-primary/80'>
                      {formatPrice(item.price)}
                    </p>
                  </Link>
                </PremiumFadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Mobile purchase bar — size + Add to Bag + Buy Now */}
      <div
        className='fixed inset-x-0 bottom-0 z-[88] border-t border-black/10 bg-[#fcf9f8]/95 backdrop-blur-md pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-6px_28px_rgba(0,13,33,0.08)] lg:hidden'
        role='toolbar'
        aria-label='Purchase actions'
      >
        <div className='mx-auto max-w-[1280px] space-y-2 px-4 py-2.5'>
          {sizes.length > 0 ?
            <PremiumSizeChips
              sizes={sizes}
              selectedVariant={selectedVariant}
              getVariant={getVariantBySize}
              onSelect={setSelectedVariant}
              compact
            />
          : null}
          <div className='flex items-center gap-2'>
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
      </div>

      {/* Desktop purchase bar */}
      <div className='fixed inset-x-0 bottom-0 z-[88] hidden border-t border-black/10 bg-[#fcf9f8]/95 backdrop-blur-md lg:block'>
        <div className='mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-5 py-4 md:px-16'>
          <div className='min-w-0'>
            <p className='truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-account-on-surface-variant'>
              {product.name}
            </p>
            <PremiumPriceInline
              sellLabel={priceDisplay.sellLabel}
              mrpLabel={priceDisplay.mrpLabel}
              discountPercent={priceDisplay.discountPercent}
              sellClassName='text-lg'
              className='mt-0.5'
            />
          </div>

          <div className='flex min-w-0 flex-1 items-center justify-end gap-3 sm:gap-4'>
            <PremiumSizeChips
              sizes={sizes}
              selectedVariant={selectedVariant}
              getVariant={getVariantBySize}
              onSelect={setSelectedVariant}
              compact
            />

            <button
              type='button'
              onClick={handleAddToBag}
              disabled={isLiveProduct && (isOutOfStock || isAddingToCart)}
              className='inline-flex h-11 shrink-0 items-center justify-center gap-2 border border-account-primary bg-white px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-account-primary transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50'
            >
              {isAddingToCart ?
                <span className='h-4 w-4 animate-spin rounded-full border-2 border-account-primary/30 border-t-account-primary' />
              : <>
                  <ShoppingBag className='h-4 w-4' aria-hidden />
                  Add to Bag
                </>
              }
            </button>

            <button
              type='button'
              onClick={handleBuyNow}
              disabled={isLiveProduct && (isOutOfStock || isBuyingNow)}
              className='inline-flex h-11 min-w-[160px] shrink-0 items-center justify-center gap-2 bg-account-primary px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50'
            >
              {isBuyingNow ?
                <span className='h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white' />
              : <>
                  <Zap className='h-4 w-4' aria-hidden />
                  Buy Now
                </>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
