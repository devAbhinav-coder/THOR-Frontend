"use client";

import { useRef, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import PremiumFadeIn from "@/components/premium/PremiumFadeIn";
import PremiumWishlistButton from "@/components/premium/PremiumWishlistButton";
import {
  PREMIUM_CRAFT_IMAGE,
  PREMIUM_EDITORIAL_IMAGE,
  PREMIUM_HERO_IMAGE,
} from "@/lib/premiumCollectionData";
import { mapApiProductsToPremiumViews, type PremiumProductView } from "@/lib/premiumProductMapper";
import { PREMIUM_PAGE_COPY } from "@/lib/premiumSeo";
import { formatPrice } from "@/lib/utils";
import { premiumApi } from "@/lib/api";
import { useState } from "react";

type Props = {
  products: PremiumProductView[];
  activeAudience?: string;
  banners?: any[];
  settings?: any;
};

const PREMIUM_LIMIT = 24;

export default function PremiumCollectionClient({ products: initialProducts, activeAudience = "all", banners = [], settings }: Props) {
  const activeBanners = banners.filter((b: any) => b.audience === activeAudience && b.isActive !== false);
  const { premiumEditorial, premiumStory, premiumFinalCta } = settings || {};
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentSlideIndex(0);
  }, [activeAudience]);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % activeBanners.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [activeBanners.length, activeAudience]);

  const activeBanner = activeBanners.length > 0 ? activeBanners[currentSlideIndex] : null;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["premium-products", activeAudience],
    queryFn: ({ pageParam = 2 }: { pageParam: number }) =>
      premiumApi
        .getProducts({ audience: activeAudience, page: pageParam, limit: PREMIUM_LIMIT })
        .then((r) => ({
          products: mapApiProductsToPremiumViews(r.data?.products ?? []),
          hasNextPage: r.pagination?.hasNextPage ?? (r.data?.products?.length ?? 0) >= PREMIUM_LIMIT,
        })),
    initialPageParam: 2,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasNextPage ? allPages.length + 2 : undefined,
  });

  // Merge SSR initial products with React Query fetched pages
  const extraProducts = data?.pages.flatMap((p) => p.products) ?? [];
  const products = [...initialProducts, ...extraProducts];
  const loading = isFetchingNextPage;

  // IntersectionObserver for infinite scroll trigger
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: "200px" },
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div className='bg-[#fcf9f8] text-[#1a1a1a]'>
      {/* Hero — Full Width (~50vh height) Carousel or Static */}
      <header className='relative w-full h-[45vh] md:h-[60vh] min-h-[400px] max-h-[700px] overflow-hidden bg-black'>
        {activeBanners.length > 0 ? (
          activeBanners.map((banner: any, idx: number) => (
            <div
              key={`banner-${idx}`}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                idx === currentSlideIndex ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              <Image
                src={banner?.image || PREMIUM_HERO_IMAGE}
                alt={banner?.title || "Premium Campaign"}
                fill
                priority={idx === 0}
                className='object-cover object-center'
                sizes='100vw'
              />
              <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent' />

              <div className='relative z-10 mx-auto flex h-full max-w-[1440px] flex-col justify-end px-5 pb-8 sm:px-8 sm:pb-12 md:px-16 md:pb-16'>
                <PremiumFadeIn className='max-w-2xl text-white'>
                  <p className='mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80 sm:mb-3 sm:text-[12px]'>
                    The House of Rani
                  </p>
                  <h1 className='font-serif text-[clamp(1.75rem,5vw,3.5rem)] font-bold leading-[0.95] tracking-tight'>
                    {banner?.title?.toUpperCase() || PREMIUM_PAGE_COPY.heroTitle}
                  </h1>
                  {(banner?.subtitle || !banner) && (
                    <p className='mt-3 max-w-xl text-sm font-light text-white/90 sm:mt-4 sm:text-base md:text-lg leading-relaxed'>
                      {banner?.subtitle || PREMIUM_PAGE_COPY.heroSubtitle}
                    </p>
                  )}
                  <a
                    href='#collection'
                    className='mt-5 inline-block border border-white px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] transition-all duration-300 hover:bg-white hover:text-black sm:mt-7 sm:px-8 sm:py-3.5 sm:text-[12px]'
                  >
                    Explore Premium
                  </a>
                </PremiumFadeIn>
              </div>
            </div>
          ))
        ) : (
          <div className="absolute inset-0 opacity-100 z-10">
            <Image
              src={PREMIUM_HERO_IMAGE}
              alt="Hand painted and pure silk premium sarees"
              fill
              priority
              className='object-cover object-center'
              sizes='100vw'
            />
            <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent' />

            <div className='relative z-10 mx-auto flex h-full max-w-[1440px] flex-col justify-end px-5 pb-8 sm:px-8 sm:pb-12 md:px-16 md:pb-16'>
              <PremiumFadeIn className='max-w-2xl text-white'>
                <p className='mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80 sm:mb-3 sm:text-[12px]'>
                  The House of Rani
                </p>
                <h1 className='font-serif text-[clamp(1.75rem,5vw,3.5rem)] font-bold leading-[0.95] tracking-tight'>
                  {PREMIUM_PAGE_COPY.heroTitle}
                </h1>
                <p className='mt-3 max-w-xl text-sm font-light text-white/90 sm:mt-4 sm:text-base md:text-lg leading-relaxed'>
                  {PREMIUM_PAGE_COPY.heroSubtitle}
                </p>
                <a
                  href='#collection'
                  className='mt-5 inline-block border border-white px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] transition-all duration-300 hover:bg-white hover:text-black sm:mt-7 sm:px-8 sm:py-3.5 sm:text-[12px]'
                >
                  Explore Premium
                </a>
              </PremiumFadeIn>
            </div>
          </div>
        )}
      </header>

      {/* Product grid */}
      <section
        id='collection'
        className='mx-auto max-w-[1280px] scroll-mt-[calc(var(--store-sticky-nav-offset,4.25rem)+3.25rem)] px-5 py-6 md:px-16 md:pt-8'
      >
        {/* Audience tabs — sticky under navbar (follows auto-hide offset on mobile too) */}
        <div
          className='sticky top-[var(--store-sticky-nav-offset,4.25rem)] z-30 -mx-5 mb-8 border-b border-account-primary/10 bg-[#fcf9f8]/95 backdrop-blur-md transition-[top] duration-300 ease-out motion-reduce:transition-none sm:mb-10 md:-mx-16 supports-[backdrop-filter]:bg-[#fcf9f8]/90'
        >
          <nav
            aria-label='Premium audience'
            className='flex items-center gap-1 overflow-x-auto overscroll-x-contain scrollbar-hide px-3 py-2.5 sm:justify-center sm:gap-2 sm:px-6 md:px-16'
          >
            {[
              { id: "all", label: "All" },
              { id: "women", label: "Women" },
              { id: "men", label: "Men" },
              { id: "kids", label: "Kids" },
              { id: "couple", label: "Couples" },
            ].map((tab) => (
              <Link
                key={tab.id}
                href={tab.id === "all" ? "/premium#collection" : `/premium/${tab.id}#collection`}
                className={`shrink-0 whitespace-nowrap px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.15em] transition-colors sm:px-4 sm:text-[13px] ${
                  activeAudience === tab.id
                    ? "border-b-2 border-account-primary text-account-primary"
                    : "border-b-2 border-transparent text-account-on-surface-variant hover:text-account-primary"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>

        {products.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4">
            <h3 className="font-serif text-2xl md:text-3xl font-light text-account-primary mb-4">
              Curating Soon
            </h3>
            <p className="text-sm md:text-base text-account-on-surface-variant font-light max-w-md mb-8 leading-relaxed">
              We are currently preparing our exclusive{" "}
              {activeAudience !== "all" ? activeAudience : "premium"} collection.
              Check back soon for masterfully crafted heirlooms.
            </p>
            {activeAudience !== "all" ?
              <Link
                href="/premium#collection"
                className="inline-block border border-account-primary px-8 py-3.5 text-[12px] font-semibold uppercase tracking-[0.2em] text-account-primary transition-all duration-300 hover:bg-account-primary hover:text-white"
              >
                Explore All Premium
              </Link>
            : <Link
                href="/shop"
                className="inline-block border border-account-primary px-8 py-3.5 text-[12px] font-semibold uppercase tracking-[0.2em] text-account-primary transition-all duration-300 hover:bg-account-primary hover:text-white"
              >
                Browse Shop
              </Link>
            }
          </div>
        ) : (
          <div className='grid grid-cols-1 gap-y-6 md:grid-cols-2 md:gap-x-10'>
          {products.map((product, index) => (
            <PremiumFadeIn
              key={product.slug}
              className={index % 2 === 1 ? "md:mt-16" : undefined}
            >
              <Link href={`/premium/${product.slug}`} className='group block'>
                <div className='relative mb-6 aspect-[3/4] overflow-hidden bg-account-surface-variant'>
                  <Image
                    src={product.heroImage}
                    alt={product.name}
                    fill
                    className='object-cover transition-transform duration-700 ease-out group-hover:scale-105'
                    sizes='(max-width: 768px) 100vw, 50vw'
                  />
                  <PremiumWishlistButton
                    slug={product.slug}
                    productId={product._id !== product.slug ? product._id : undefined}
                    productName={product.name}
                    className='absolute top-2.5 right-2.5 z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
                  />
                </div>
                <div className='flex items-start justify-between gap-4'>
                  <div>
                    <h3 className='font-serif text-xl tracking-wide'>
                      {product.name}
                    </h3>
                    <p className='mt-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-account-on-surface-variant'>
                      {product.fabric}
                    </p>
                  </div>
                  <span className='shrink-0 text-base text-account-primary/80'>
                    {formatPrice(product.price)}
                  </span>
                </div>
              </Link>
            </PremiumFadeIn>
          ))}
        </div>
        )}
        {loading && (
          <div className="mt-8 flex justify-center py-6 text-sm font-medium uppercase tracking-widest text-account-primary">
            Loading...
          </div>
        )}
        <div ref={observerTarget} className="h-4 w-full" />
      </section>

      {/* Editorial feature */}
      <section className='bg-white px-5 py-12 md:px-16 md:py-16'>
        <div className='mx-auto flex max-w-[1280px] flex-col items-center gap-6 md:flex-row md:gap-12'>
          <PremiumFadeIn className='w-full md:w-7/12'>
            <div className='relative aspect-[4/5] w-full overflow-hidden bg-account-surface-container'>
              <Image
                src={premiumEditorial?.image || PREMIUM_EDITORIAL_IMAGE}
                alt='Lifestyle Editorial'
                fill
                className='object-cover object-center'
                sizes='(max-width: 768px) 100vw, 58vw'
              />
            </div>
          </PremiumFadeIn>
          <PremiumFadeIn className='flex w-full flex-col justify-center md:w-5/12 md:pl-8'>
            <p className='mb-6 text-[12px] font-semibold uppercase tracking-[0.15em] text-account-on-surface-variant'>
              {premiumEditorial?.preHeading || PREMIUM_PAGE_COPY.editorialPreHeading}
            </p>
            <h2 className='font-serif text-[clamp(2rem,5vw,2.5rem)] font-semibold leading-tight'>
              {premiumEditorial?.heading || PREMIUM_PAGE_COPY.editorialHeading}
            </h2>
            <p className='mt-8 text-lg font-light leading-relaxed text-account-on-surface-variant'>
              {premiumEditorial?.text || PREMIUM_PAGE_COPY.editorialText}
            </p>
            <Link
              href='#collection'
              className='group mt-10 flex w-fit items-center space-x-4 border-b border-account-primary pb-2 transition-colors duration-300 hover:border-brand-500'
            >
              <span className='text-[12px] font-semibold uppercase tracking-[0.2em] transition-colors group-hover:text-brand-600'>
                {premiumEditorial?.linkText || "View Collection"}
              </span>
              <span
                aria-hidden
                className='text-sm transition-transform group-hover:translate-x-1'
              >
                →
              </span>
            </Link>
          </PremiumFadeIn>
        </div>
      </section>

      {/* Story */}
      <section className='bg-account-primary px-5 py-12 text-center text-white md:px-16'>
        <PremiumFadeIn className='mx-auto max-w-4xl'>
          <h2 className='font-serif text-[clamp(2rem,6vw,3.5rem)] font-normal leading-tight text-brand-100'>
            {premiumStory?.heading || PREMIUM_PAGE_COPY.storyHeading}
          </h2>
          <p className='mx-auto mt-8 max-w-2xl text-lg font-light leading-relaxed text-brand-100/90'>
            {premiumStory?.text || PREMIUM_PAGE_COPY.storyText}
          </p>
          <div className='relative mt-8 aspect-[21/9] w-full overflow-hidden opacity-90'>
            <Image
              src={premiumStory?.image || PREMIUM_CRAFT_IMAGE}
              alt='Hand painted and Banarasi craftsmanship'
              fill
              className='object-cover'
              sizes='(max-width: 1280px) 100vw, 1280px'
            />
          </div>
        </PremiumFadeIn>
      </section>

      {/* Final CTA */}
      <section className='flex min-h-[480px] flex-col items-center justify-center px-5 py-10 text-center md:px-16'>
        <PremiumFadeIn>
          <h2 className='mx-auto max-w-3xl font-serif text-[clamp(2rem,5vw,2.5rem)] font-semibold leading-tight'>
            {premiumFinalCta?.heading || PREMIUM_PAGE_COPY.finalCtaHeading}
          </h2>
          <p className='mx-auto mt-6 max-w-xl text-lg font-light text-account-on-surface-variant'>
            {premiumFinalCta?.text || PREMIUM_PAGE_COPY.finalCtaText}
          </p>
          <Link
            href='#collection'
            className='mt-12 inline-block bg-account-primary px-10 py-5 text-[12px] font-semibold uppercase tracking-[0.2em] text-white transition-colors duration-300 hover:bg-brand-600'
          >
            {premiumFinalCta?.linkText || "Explore Collection"}
          </Link>
        </PremiumFadeIn>
      </section>
    </div>
  );
}
