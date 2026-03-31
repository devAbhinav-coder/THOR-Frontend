"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Gift, Search, Star, X, SlidersHorizontal } from "lucide-react";
import { giftingApi, storefrontApi } from "@/lib/api";
import { cn, formatPrice } from "@/lib/utils";
import type { Category, Product, StorefrontSettings } from "@/types";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

type SortKey =
  | "relevance"
  | "price_low"
  | "price_high"
  | "newest"
  | "name_az"
  | "name_za"
  | "rating_high";
type PriceFilterKey =
  | "all"
  | "under_1000"
  | "1000_3000"
  | "3000_7000"
  | "above_7000";

type GiftingProductsResponse = {
  data?: {
    products?: Product[];
    page?: number;
    limit?: number;
    total?: number;
  };
};

export default function GiftingPage() {
  const [activeOccasion, setActiveOccasion] = useState("all");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 350);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("relevance");
  const [priceFilter, setPriceFilter] = useState<PriceFilterKey>("all");
  const [minRating, setMinRating] = useState<number>(0);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const { data: categoriesBody } = useQuery({
    queryKey: ["gifting-categories"],
    queryFn: () => giftingApi.getCategories(),
    staleTime: 120_000,
  });

  const { data: settingsBody } = useQuery({
    queryKey: ["storefront-settings-gifting"],
    queryFn: () => storefrontApi.getSettings(),
    staleTime: 120_000,
  });

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteQuery<GiftingProductsResponse>({
      queryKey: ["gifting-products", activeOccasion, debouncedSearch],
      queryFn: ({ pageParam }) =>
        giftingApi.getProducts({
          page: Number(pageParam || 1),
          limit: 20,
          ...(activeOccasion !== "all" && { giftOccasion: activeOccasion }),
          ...(debouncedSearch && { search: debouncedSearch }),
        }),
      getNextPageParam: (lastPage) => {
        const page = Number(lastPage?.data?.page || 1);
        const limit = Number(lastPage?.data?.limit || 20);
        const total = Number(lastPage?.data?.total || 0);
        const loaded = page * limit;
        return loaded < total ? page + 1 : undefined;
      },
      initialPageParam: 1,
      staleTime: 45_000,
    });

  const giftCategories: Category[] = categoriesBody?.data?.categories || [];
  const settings: StorefrontSettings | undefined = settingsBody?.data?.settings;
  const promo = settings?.promoBanner;
  const blog = settings?.blogBanner;
  const giftingHeroBanners = (settings?.giftingHeroBanners || []).filter(
    (b) => b.isActive !== false,
  );
  const giftingSecondaryBanners = (
    settings?.giftingSecondaryBanners || []
  ).filter((b) => b.isActive !== false);

  const rawProducts: Product[] = useMemo(
    () => (data?.pages || []).flatMap((p) => p?.data?.products || []),
    [data],
  );
  const products = useMemo(() => {
    const list = rawProducts.filter((p) => {
      const avgRating = Number(p.ratings?.average || 0);
      if (minRating > 0 && avgRating < minRating) return false;
      if (priceFilter === "under_1000") return p.price < 1000;
      if (priceFilter === "1000_3000")
        return p.price >= 1000 && p.price <= 3000;
      if (priceFilter === "3000_7000") return p.price > 3000 && p.price <= 7000;
      if (priceFilter === "above_7000") return p.price > 7000;
      return true;
    });
    if (sortBy === "price_low") list.sort((a, b) => a.price - b.price);
    else if (sortBy === "price_high") list.sort((a, b) => b.price - a.price);
    else if (sortBy === "newest")
      list.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    else if (sortBy === "name_az")
      list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "name_za")
      list.sort((a, b) => b.name.localeCompare(a.name));
    else if (sortBy === "rating_high")
      list.sort(
        (a, b) =>
          Number(b.ratings?.average || 0) - Number(a.ratings?.average || 0),
      );
    return list;
  }, [rawProducts, sortBy, priceFilter, minRating]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries[0]?.isIntersecting;
        if (hit && hasNextPage && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    if (giftingHeroBanners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveHeroIndex((prev) => (prev + 1) % giftingHeroBanners.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [giftingHeroBanners.length]);

  useEffect(() => {
    if (
      activeHeroIndex >= giftingHeroBanners.length &&
      giftingHeroBanners.length > 0
    ) {
      setActiveHeroIndex(0);
    }
  }, [activeHeroIndex, giftingHeroBanners.length]);

  const heroSlides =
    giftingHeroBanners.length > 0 ?
      giftingHeroBanners
    : [
        {
          title: promo?.title || "Smart gifting made easy",
          description:
            promo?.description ||
            "Premium gifts for every occasion, tailored to your style.",
          backgroundImage: promo?.backgroundImage || "/hero-bg.jpg",
          ctaText: promo?.primaryButtonText || "Explore gifts",
          ctaLink: promo?.primaryButtonLink || "/gifting",
        },
      ];
  const activeHero =
    heroSlides[Math.min(activeHeroIndex, heroSlides.length - 1)];

  return (
    <div className='min-h-screen bg-white'>
      {/* Banner 1 */}
      <section className='relative'>
        <div className='relative h-[176px] sm:h-[240px] lg:h-[280px] overflow-hidden'>
          <Image
            src={activeHero?.backgroundImage || "/hero-bg.jpg"}
            alt='Gifting banner'
            fill
            sizes='100vw'
            className='object-cover'
            priority
          />
          <div className='absolute inset-0 bg-black/35' />
          <div className='absolute inset-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center'>
            <div className='max-w-xl text-white'>
              <h1 className='text-xl sm:text-3xl lg:text-4xl font-serif font-bold leading-tight'>
                {activeHero?.title || "Smart gifting made easy"}
              </h1>
              <p className='mt-2 text-xs sm:text-sm text-white/90'>
                {activeHero?.description ||
                  "Premium gifts for every occasion, tailored to your style."}
              </p>
            </div>
          </div>
          {heroSlides.length > 1 && (
            <div className='absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5'>
              {heroSlides.map((_, i) => (
                <button
                  key={i}
                  type='button'
                  onClick={() => setActiveHeroIndex(i)}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    i === activeHeroIndex ? "w-6 bg-white" : "w-2 bg-white/60",
                  )}
                  aria-label={`Go to banner ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>
      {/* Categories heading */}
      <section className='max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-2 pb-1'>
        <p className='text-[11px] font-semibold uppercase tracking-wider text-brand-600'>
          Gift categories
        </p>
        {/* <p className='text-xs sm:text-sm text-gray-500 mt-1'>
          Pick a category to quickly find the right gifts.
        </p> */}
        <h2 className='text-1xl sm:text-2xl font-serif font-bold text-gray-900'>
          Crafted with love for every occasion .
        </h2>
      </section>
      {/* Admin categories image strip */}
      {giftCategories.length > 0 && (
        <section className='max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-3'>
          <div className='flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
            <button
              type='button'
              onClick={() => setActiveOccasion("all")}
              className={cn(
                "flex-shrink-0 w-[84px] sm:w-[92px] text-center",
                activeOccasion === "all" && "opacity-100",
              )}
            >
              <div className='h-14 w-14 sm:h-16 sm:w-16 rounded-full border border-gray-200 mx-auto bg-gray-100 grid place-items-center text-gray-500'>
                <Gift className='h-5 w-5' />
              </div>
              <p className='mt-1 text-[11px] font-medium text-gray-700 line-clamp-2'>
                All
              </p>
            </button>
            {giftCategories.map((cat) => (
              <button
                key={cat._id}
                type='button'
                onClick={() => setActiveOccasion(cat.name)}
                className={cn("flex-shrink-0 w-[84px] sm:w-[92px] text-center")}
              >
                <div
                  className={cn(
                    "relative h-14 w-14 sm:h-16 sm:w-16 rounded-full overflow-hidden border mx-auto bg-gray-100",
                    activeOccasion === cat.name ?
                      "border-brand-500 ring-2 ring-brand-100"
                    : "border-gray-200",
                  )}
                >
                  {cat.image ?
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      fill
                      sizes='64px'
                      className='object-cover'
                    />
                  : <div className='absolute inset-0 grid place-items-center text-gray-300'>
                      <Gift className='h-5 w-5' />
                    </div>
                  }
                </div>
                <p className='mt-1 text-[11px] font-medium text-gray-700 line-clamp-2 leading-tight'>
                  {cat.name}
                </p>
              </button>
            ))}
          </div>
        </section>
      )}
      {/* Banner 2 */}
      <section className='max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-3'>
        <div
          className={cn(
            "grid gap-3",
            (giftingSecondaryBanners.length || 1) > 1 ?
              "grid-cols-1 sm:grid-cols-2"
            : "grid-cols-1",
          )}
        >
          {(giftingSecondaryBanners.length > 0 ?
            giftingSecondaryBanners
          : [
              {
                image:
                  blog?.mainImage || promo?.backgroundImage || "/hero-bg.jpg",
                eyebrow: blog?.eyebrow || "Gifting made premium",
                title: blog?.title || "Curated picks for every celebration",
                ctaText: "Explore",
                ctaLink: "/gifting",
              },
            ]
          )
            .slice(0, 2)
            .map((banner, idx) => (
              <div
                key={idx}
                className='relative h-[110px] sm:h-[140px] rounded-2xl overflow-hidden border border-gray-100'
              >
                <Image
                  src={banner.image || "/hero-bg.jpg"}
                  alt='Gifting secondary banner'
                  fill
                  sizes='100vw'
                  className='object-cover'
                />
                <div className='absolute inset-0 bg-black/30' />
                <div className='absolute inset-0 px-4 sm:px-6 flex items-center justify-between gap-3'>
                  <div className='text-white'>
                    <p className='text-[11px] uppercase tracking-wider text-white/85'>
                      {banner.eyebrow || "Gifting made premium"}
                    </p>
                    <p className='text-sm sm:text-lg font-semibold'>
                      {banner.title || "Curated picks for every celebration"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </section>
      {/* Search (below second banner) */}
      <section className='max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-1 pb-2'>
        <div className='flex items-end justify-between gap-3'>
          <div>
            <p className='text-[11px] font-semibold uppercase tracking-wider text-brand-600'>
              Gift collections
            </p>
            <h2 className='text-2xl sm:text-2xl font-serif font-bold text-gray-900'>
              Products For You
            </h2>
          </div>
          <button
            type='button'
            onClick={() => setIsMobileFilterOpen(true)}
            className='sm:hidden h-9 w-9 rounded-lg border border-gray-200 bg-white text-gray-600 grid place-items-center'
            aria-label='Open filters'
          >
            <SlidersHorizontal className='h-4 w-4' />
          </button>
        </div>
        <div className='mt-3'>
          <div className='rounded-2xl border border-gray-200/80 bg-white p-2.5 sm:p-3 shadow-sm'>
            <div className='flex flex-col sm:flex-row gap-2 sm:items-center sticky top-14 bg-white z-10'>
              <div className='relative w-full sm:max-w-xl'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                <input
                  type='search'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder='Search by product name, category, or occasion'
                  className='w-full h-10 rounded-xl border border-gray-200 bg-white pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20'
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className='absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-gray-100 text-gray-500 grid place-items-center'
                    aria-label='Clear search'
                  >
                    <X className='h-3.5 w-3.5' />
                  </button>
                )}
              </div>
              {/* <button
                type='button'
                onClick={() => setIsMobileFilterOpen(true)}
                className='sm:hidden h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 inline-flex items-center justify-center gap-2'
              >
                <SlidersHorizontal className='h-4 w-4' /> Filters
              </button> */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className='hidden sm:block h-10 rounded-xl border border-gray-200 bg-white px-3 text-xs sm:text-sm font-medium text-gray-700 min-w-[170px]'
                aria-label='Sort products'
              >
                <option value='relevance'>Sort: Relevance</option>
                <option value='newest'>Newest first</option>
                <option value='rating_high'>Rating: High to low</option>
                <option value='price_low'>Price: Low to high</option>
                <option value='price_high'>Price: High to low</option>
                <option value='name_az'>Name: A to Z</option>
                <option value='name_za'>Name: Z to A</option>
              </select>
              <select
                value={priceFilter}
                onChange={(e) =>
                  setPriceFilter(e.target.value as PriceFilterKey)
                }
                className='hidden sm:block h-10 rounded-xl border border-gray-200 bg-white px-3 text-xs sm:text-sm font-medium text-gray-700 min-w-[160px]'
                aria-label='Filter by price'
              >
                <option value='all'>Filter: All prices</option>
                <option value='under_1000'>Under 1000</option>
                <option value='1000_3000'>1000 - 3000</option>
                <option value='3000_7000'>3000 - 7000</option>
                <option value='above_7000'>Above 7000</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {isMobileFilterOpen && (
        <div className='fixed inset-0 z-[80] sm:hidden'>
          <button
            type='button'
            className='absolute inset-0 bg-black/45'
            onClick={() => setIsMobileFilterOpen(false)}
            aria-label='Close filters overlay'
          />
          <div className='absolute left-0 top-0 h-full w-[84%] max-w-[340px] bg-white shadow-2xl p-4 overflow-y-auto'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-base font-semibold text-gray-900'>
                Filters & Sort
              </h3>
              <button
                type='button'
                onClick={() => setIsMobileFilterOpen(false)}
                className='h-8 w-8 rounded-full bg-gray-100 text-gray-600 grid place-items-center'
                aria-label='Close filters'
              >
                <X className='h-4 w-4' />
              </button>
            </div>

            <div className='space-y-4'>
              <div>
                <label className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                  Sort
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                  className='mt-1 h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm'
                >
                  <option value='relevance'>Relevance</option>
                  <option value='newest'>Newest first</option>
                  <option value='rating_high'>Rating: High to low</option>
                  <option value='price_low'>Price: Low to high</option>
                  <option value='price_high'>Price: High to low</option>
                  <option value='name_az'>Name: A to Z</option>
                  <option value='name_za'>Name: Z to A</option>
                </select>
              </div>

              <div>
                <label className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                  Rating
                </label>
                <select
                  value={String(minRating)}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  className='mt-1 h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm'
                >
                  <option value='0'>All ratings</option>
                  <option value='4'>4★ & above</option>
                  <option value='3'>3★ & above</option>
                  <option value='2'>2★ & above</option>
                </select>
              </div>

              <div>
                <label className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                  Category
                </label>
                <select
                  value={activeCategory}
                  onChange={(e) => setActiveCategory(e.target.value)}
                  className='mt-1 h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm'
                >
                  <option value='all'>All categories</option>
                  {giftCategories.map((cat) => (
                    <option key={cat._id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                  Pricing
                </label>
                <select
                  value={priceFilter}
                  onChange={(e) =>
                    setPriceFilter(e.target.value as PriceFilterKey)
                  }
                  className='mt-1 h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm'
                >
                  <option value='all'>All prices</option>
                  <option value='under_1000'>Under 1000</option>
                  <option value='1000_3000'>1000 - 3000</option>
                  <option value='3000_7000'>3000 - 7000</option>
                  <option value='above_7000'>Above 7000</option>
                </select>
              </div>
            </div>
            <div className='mt-6 grid grid-cols-2 gap-2'>
              <button
                type='button'
                onClick={() => {
                  setSortBy("relevance");
                  setPriceFilter("all");
                  setMinRating(0);
                  setActiveCategory("all");
                }}
                className='h-10 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700'
              >
                Clear all
              </button>
              <button
                type='button'
                onClick={() => setIsMobileFilterOpen(false)}
                className='h-10 rounded-xl bg-navy-900 text-sm font-semibold text-white'
              >
                Apply filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product grid with infinite scroll */}
      <section className='max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-4'>
        {isLoading ?
          <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5'>
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className='animate-pulse rounded-xl border border-gray-100 p-2.5'
              >
                <div className='aspect-[3/4] bg-gray-100 rounded-lg mb-2.5' />
                <div className='h-3 bg-gray-100 rounded w-3/4 mb-1.5' />
                <div className='h-3 bg-gray-100 rounded w-1/2' />
              </div>
            ))}
          </div>
        : products.length === 0 ?
          <div className='text-center py-20'>
            <div className='h-14 w-14 rounded-full bg-gray-100 text-gray-300 grid place-items-center mx-auto'>
              <Gift className='h-7 w-7' />
            </div>
            <p className='mt-4 text-base font-semibold text-gray-900'>
              No matching gifts found
            </p>
            <p className='mt-1 text-sm text-gray-500'>
              Try changing filters or search text.
            </p>
          </div>
        : <>
            <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5'>
              {products.map((product) => (
                <GiftProductCard key={product._id} product={product} />
              ))}
            </div>
            <div ref={sentinelRef} className='h-10' />
            {isFetchingNextPage && (
              <p className='text-center text-sm text-gray-500 pb-8'>
                Loading more...
              </p>
            )}
          </>
        }
      </section>
    </div>
  );
}

function GiftProductCard({ product }: { product: Product }) {
  const isCorporateGift = (product.giftOccasions || []).some(
    (o) => String(o).trim().toLowerCase() === "corporate",
  );
  const minPurchaseQty =
    isCorporateGift ?
      Math.max(product.minOrderQty || 1, 10)
    : Math.max(product.minOrderQty || 1, 1);
  const ratingCount = Number(product.ratings?.count || 0);
  const hasRating = ratingCount > 0;
  const ratingAverage = Number(product.ratings?.average || 0);
  console.log(product.isCustomizable );
  return (
    <Link
      href={`/shop/${product.slug}`}
      className='group block rounded-xl border border-gray-100 bg-white overflow-hidden hover:shadow-md transition-shadow'
    >
      <div className='relative aspect-[4/5] bg-gray-50'>
        {product.images?.[0]?.url ?
          <Image
            src={product.images[0].url}
            alt={product.name}
            fill
            className='object-cover'
            sizes='(max-width:640px) 50vw, 25vw'
          />
        : <div className='absolute inset-0 grid place-items-center text-gray-300'>
            <Gift className='h-8 w-8' />
          </div>
        }
        {product.images?.[1]?.url && (
          <Image
            src={product.images[1].url}
            alt={`${product.name} alternate`}
            fill
            className='object-cover opacity-0 transition-opacity duration-300 lg:group-hover:opacity-100'
            sizes='(max-width:640px) 50vw, 25vw'
          />
        )}
        {product.isCustomizable == true  && (
          <span className='absolute top-2 left-2 bg-navy-900 text-white text-[10px] font-semibold px-2 py-1 rounded-md'>
            Customizable
          </span>
        )}
        
        <span className='absolute top-2 right-2 bg-white/90 text-gray-800 text-[10px] font-semibold px-2 py-1 rounded-md border border-gray-200'>
          {product.giftOccasions?.[0] || ""}
        </span>
      </div>
      <div className='p-2.5 sm:p-3'>
        <h4 className='text-sm font-semibold text-gray-900 line-clamp-2 min-h-9'>
          {product.name}
        </h4>
        <div className='mt-1 flex items-center gap-1'>
          <Star
            className={cn(
              "h-3 w-3",
              hasRating ? "fill-gold-500 text-gold-500" : "text-gray-300",
            )}
          />
          {hasRating ?
            <>
              <span className='text-xs text-gray-700'>
                {ratingAverage.toFixed(1)}
              </span>
              <span className='text-[11px] text-gray-400'>({ratingCount})</span>
            </>
          : <span className='text-[11px] text-gray-400'>No ratings yet</span>}
        </div>
        <div className='mt-1.5 text-base font-bold text-gray-900'>
          {formatPrice(product.price)}
        </div>
        <div className='mt-1.5 flex flex-wrap gap-1.5'>
          <span className='text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-100'>
            Gift
          </span>
          {product.isCustomizable && (
            <span className='text-[10px] font-semibold px-2 py-0.5 rounded-full bg-navy-50 text-navy-700 border border-navy-100'>
              Customizable
            </span>
          )}
          {minPurchaseQty > 1 && (
            <span className='text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100'>
              Min Qty {minPurchaseQty}
            </span>
          )}
        </div>
        {minPurchaseQty > 1 && (
          <p className='mt-1 text-[11px] font-medium text-amber-700'>
            Minimum order quantity: {minPurchaseQty}
          </p>
        )}
        <div className='mt-2 h-9 rounded-lg border border-gray-200 bg-white text-navy-900 text-xs font-semibold inline-flex items-center justify-center w-full'>
          View details
        </div>
      </div>
    </Link>
  );
}
