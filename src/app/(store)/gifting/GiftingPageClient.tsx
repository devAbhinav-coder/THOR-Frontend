"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Gift, Star, SlidersHorizontal, X } from "lucide-react";
import { categoryApi, giftingApi, storefrontApi } from "@/lib/api";
import type { StorefrontSettingsApiEnvelope } from "@/lib/api-schemas";
import { cn, formatPrice } from "@/lib/utils";
import type { Category, Product, StorefrontSettings } from "@/types";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Skeleton } from "@/components/ui/SkeletonLoader";
import StoreSearchAutocomplete from "@/components/search/StoreSearchAutocomplete";
import { productNeedsCustomization } from "@/lib/productCustomization";
import { queryKeys } from "@/lib/queryKeys";

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
const SEARCH_MAX_LEN = 80;

// Seeded shuffle removed as we now use true backend randomness to avoid jumping.

function parseGiftingQuery(search: string) {
  const q = new URLSearchParams(search);
  return {
    occasion: q.get("occasion")?.trim() || "",
    productCategory: q.get("productCategory")?.trim() || "",
    search: q.get("search")?.trim() || "",
  };
}

function giftingQueriesMatch(a: string, b: string) {
  const pa = parseGiftingQuery(a.startsWith("?") ? a.slice(1) : a);
  const pb = parseGiftingQuery(b.startsWith("?") ? b.slice(1) : b);
  return (
    pa.occasion === pb.occasion &&
    pa.productCategory === pb.productCategory &&
    pa.search === pb.search
  );
}

type GiftingProductsResponse = {
  data?: {
    products?: Product[];
  };
  pagination?: {
    currentPage: number;
    totalPages: number;
    total: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

export default function GiftingPageClient({
  initialStorefront,
  initialGiftingCategories,
}: {
  initialStorefront: StorefrontSettingsApiEnvelope | null;
  /** Server JSON for `giftingApi.getCategories()` — removes category-strip skeleton flash. */
  initialGiftingCategories?: Awaited<
    ReturnType<typeof giftingApi.getCategories>
  > | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeOccasion, setActiveOccasion] = useState(
    () => searchParams.get("occasion")?.trim() || "all",
  );
  const [search, setSearch] = useState(() =>
    (searchParams.get("search")?.trim() || "").slice(0, SEARCH_MAX_LEN),
  );
  const debouncedSearch = useDebouncedValue(search.trim(), 350);
  const skipNextUrlPush = useRef(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("relevance");
  const [priceFilter, setPriceFilter] = useState<PriceFilterKey>("all");
  const [minRating, setMinRating] = useState<number>(0);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const handleSearchChange = (value: string) =>
    setSearch(value.slice(0, SEARCH_MAX_LEN));

  const { data: categoriesBody, isLoading: categoriesLoading } = useQuery({
    queryKey: ["gifting-categories"],
    queryFn: () => giftingApi.getCategories(),
    staleTime: 120_000,
    initialData: initialGiftingCategories ?? undefined,
  });

  const { data: catalogCategoriesBody } = useQuery({
    queryKey: ["gifting-catalog-categories"],
    queryFn: () => categoryApi.getAll({ active: true }),
    staleTime: 120_000,
  });

  const { data: settingsBody, isPending: settingsPending } = useQuery({
    queryKey: queryKeys.storefrontSettings,
    queryFn: () => storefrontApi.getSettings(),
    staleTime: 120_000,
    initialData: initialStorefront ?? undefined,
    placeholderData: (prev) => prev ?? initialStorefront ?? undefined,
  });

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteQuery<GiftingProductsResponse>({
      queryKey: [
        "gifting-products",
        activeOccasion,
        debouncedSearch,
        sortBy, // changing sort changes backend fetch mode
      ],
      queryFn: ({ pageParam }) => {
        const { page, excludeIds } = (pageParam || { page: 1, excludeIds: "" }) as { page: number; excludeIds: string };
        return giftingApi.getProducts({
          limit: 12,
          ...(activeOccasion !== "all" && { giftOccasion: activeOccasion }),
          ...(debouncedSearch && { search: debouncedSearch }),
          ...(sortBy === "relevance" 
              ? { isRandom: "true", ...(excludeIds ? { excludeIds } : {}) }
              : { page }
          ),
        });
      },
      getNextPageParam: (lastPage, allPages) => {
        if (lastPage.pagination?.hasNextPage === false) return undefined;
        if (!lastPage.pagination?.hasNextPage && lastPage.pagination?.totalPages === 1) return undefined;
        
        const page = (lastPage.pagination?.currentPage || 1) + 1;
        const seenIds = allPages.flatMap(pg => pg.data?.products || []).map(p => p._id).join(",");
        return { page, excludeIds: seenIds };
      },
      initialPageParam: { page: 1, excludeIds: "" },
      staleTime: 45_000,
      placeholderData: (previousData) => previousData,
    });

  const giftCategories: Category[] = categoriesBody?.data?.categories || [];
  const catalogCategories: Category[] =
    catalogCategoriesBody?.data?.categories || [];
  const productCategoriesForFilter = useMemo(() => {
    const list = catalogCategories.filter((c) => c.isGiftCategory);
    return list.length ? list : catalogCategories;
  }, [catalogCategories]);

  const serializeGiftingQuery = useCallback(() => {
    const q = new URLSearchParams();
    if (activeOccasion !== "all") q.set("occasion", activeOccasion);
    if (debouncedSearch) q.set("search", debouncedSearch);
    return q.toString();
  }, [activeOccasion, debouncedSearch]);

  const giftingUrlKey = searchParams.toString();

  useLayoutEffect(() => {
    const occ = searchParams.get("occasion")?.trim() || "all";
    const s = (searchParams.get("search")?.trim() || "").slice(
      0,
      SEARCH_MAX_LEN,
    );
    skipNextUrlPush.current = true;
    setActiveOccasion(occ);
    setSearch(s);
    // giftingUrlKey is searchParams.toString(); only re-sync when the URL query changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [giftingUrlKey]);

  useEffect(() => {
    if (skipNextUrlPush.current) {
      skipNextUrlPush.current = false;
      return;
    }
    const next = serializeGiftingQuery();
    const cur = searchParams.toString();
    if (giftingQueriesMatch(next, cur)) return;
    const href = next ? `${pathname}?${next}` : pathname;
    router.replace(href, { scroll: false });
  }, [serializeGiftingQuery, searchParams, pathname, router]);
  const settings: StorefrontSettings | undefined =
    settingsBody?.data?.settings ?? initialStorefront?.data?.settings;
  const settingsLoading = settings == null && settingsPending;
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
    // Relevance is now truly random from the backend. 
    // We only client-sort for other filters.
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
          backgroundImage: promo?.backgroundImage || "/logo.png",
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
        <div className='relative h-[176px] sm:h-[240px] lg:h-[280px] overflow-hidden bg-gray-100'>
          {settingsLoading ?
            <>
              <Skeleton className='absolute inset-0 rounded-none' />
              <div className='absolute inset-0 bg-black/25' />
              <div className='absolute inset-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center'>
                <div className='max-w-xl space-y-3'>
                  <Skeleton className='h-7 sm:h-10 w-72 sm:w-[28rem] bg-white/25' />
                  <Skeleton className='h-4 w-80 bg-white/20' />
                  <Skeleton className='h-4 w-64 bg-white/15' />
                </div>
              </div>
            </>
          : <>
              <Image
                src={activeHero?.backgroundImage || "/logo.png"}
                alt='Gifting collection featured visuals at The House of Rani'
                fill
                sizes='100vw'
                className='object-cover animate-in zoom-in-105 duration-[4000ms] ease-out'
                priority
                fetchPriority='high'
                quality={58}
              />
              <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/10' />
              <div className='absolute inset-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center'>
                <div className='max-w-xl text-white animate-in slide-in-from-bottom-8 fade-in duration-1000 ease-out'>
                  <h1 className='text-3xl sm:text-4xl lg:text-5xl font-serif font-bold leading-tight drop-shadow-xl'>
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
                        i === activeHeroIndex ? "w-6 bg-white" : (
                          "w-2 bg-white/60"
                        ),
                      )}
                      aria-label={`Go to banner ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </>
          }
        </div>
      </section>
      {/* Categories heading */}
      <section className='max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-6 pb-2'>
        <div className='flex flex-col items-start'>
          <p className='text-xs font-semibold uppercase tracking-widest text-brand-600 animate-in fade-in slide-in-from-bottom-2 duration-700'>
            Gift Categories
          </p>
          <h2 className='text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-1.5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100'>
            Crafted with love for every occasion.
          </h2>
        </div>
      </section>
      {/* Admin categories image strip */}
      <section className='max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-3'>
        <div className='flex items-start gap-2.5 overflow-x-auto px-1 pt-2 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
          {categoriesLoading ?
            Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className='flex flex-shrink-0 flex-col items-center w-[84px] sm:w-[92px]'
              >
                <Skeleton className='h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-full bg-gray-100' />
                <Skeleton className='mt-2 h-3 w-16 shrink-0 rounded bg-gray-100' />
              </div>
            ))
          : giftCategories.length > 0 ?
            <>
              <button
                type='button'
                onClick={() => setActiveOccasion("all")}
                className={cn(
                  "group flex flex-shrink-0 flex-col items-center w-[72px] sm:w-[96px] transition-all duration-300",
                  activeOccasion === "all" && "opacity-100",
                )}
              >
                <div className={cn(
                  "relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-full border bg-white grid place-items-center text-gray-500 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg",
                  activeOccasion === "all" ?
                    "border-brand-500 ring-4 ring-brand-100 shadow-xl scale-105 text-brand-600"
                  : "border-gray-200 shadow-sm"
                )}>
                  <Gift className='h-6 w-6 sm:h-7 sm:w-7' />
                </div>
                <p className='mt-2 block min-h-[2.5rem] w-full px-0.5 text-center text-[12px] font-medium leading-tight text-gray-700 line-clamp-2 group-hover:text-brand-600 transition-colors'>
                  All
                </p>
              </button>
              {giftCategories.map((cat) => (
                <button
                  key={cat._id}
                  type='button'
                  onClick={() => setActiveOccasion(cat.name)}
                  className='group flex flex-shrink-0 flex-col items-center w-[72px] sm:w-[96px] transition-all duration-300'
                >
                  <div
                    className={cn(
                      "relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-full border bg-white transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg",
                      activeOccasion === cat.name ?
                        "border-brand-500 ring-4 ring-brand-100 shadow-xl scale-105"
                      : "border-gray-200 shadow-sm",
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
                  <p className='mt-2 block min-h-[2.5rem] w-full px-0.5 text-center text-[12px] font-medium leading-tight text-gray-700 line-clamp-2 group-hover:text-brand-600 transition-colors'>
                    {cat.name}
                  </p>
                </button>
              ))}
            </>
          : null}
        </div>
      </section>
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
          {settingsLoading ?
            Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className='relative h-[110px] sm:h-[140px] rounded-2xl overflow-hidden border border-gray-100 bg-gray-100'
              >
                <Skeleton className='absolute inset-0' />
                <div className='absolute inset-0 px-4 sm:px-6 flex items-center justify-between gap-3'>
                  <div className='space-y-2'>
                    <Skeleton className='h-3 w-32 bg-white/20' />
                    <Skeleton className='h-6 w-56 bg-white/20' />
                  </div>
                </div>
              </div>
            ))
          : (giftingSecondaryBanners.length > 0 ?
              giftingSecondaryBanners
            : [
                {
                  image:
                    blog?.mainImage || promo?.backgroundImage || "/logo.png",
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
                  className='group relative h-[140px] sm:h-[180px] rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer'
                >
                  <Image
                    src={banner.image || "/logo.png"}
                    alt={
                      banner.title ?
                        `Gifting highlight: ${banner.title}`
                      : "Gifting collection highlight"
                    }
                    fill
                    sizes='(max-width: 640px) 100vw, 50vw'
                    className='object-cover transition-transform duration-[800ms] ease-out group-hover:scale-110'
                    loading={idx === 0 ? "eager" : "lazy"}
                    quality={72}
                  />
                  <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500' />
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
              ))
          }
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
        <div className='mt-4 sticky top-16 z-20'>
          <div className='rounded-2xl border border-gray-200/80 bg-white/90 backdrop-blur-xl p-3 sm:p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] transition-all duration-300'>
            <div className='flex flex-col sm:flex-row gap-3 sm:items-center'>
              <div className='relative w-full sm:max-w-xl'>
                <StoreSearchAutocomplete
                  scope='gifting'
                  variant='gifting-inline'
                  value={search}
                  onValueChange={handleSearchChange}
                  maxLen={SEARCH_MAX_LEN}
                  placeholder='Search by product name, category, or occasion'
                />
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
              <select
                value={activeOccasion}
                onChange={(e) => setActiveOccasion(e.target.value)}
                className='hidden sm:block h-10 rounded-xl border border-gray-200 bg-white px-3 text-xs sm:text-sm font-medium text-gray-700 min-w-[160px]'
                aria-label='Filter by product occasion'
              >
                <option value='all'>All Occasions</option>
                {giftCategories.map((cat) => (
                  <option key={cat._id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
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
                  aria-label='Sort gifts'
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
                  aria-label='Minimum rating'
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
                  Gifting Occasions
                </label>
                <select
                  aria-label='Gifting Occasions'
                  value={activeOccasion}
                  onChange={(e) => setActiveOccasion(e.target.value)}
                  className='mt-1 h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm'
                >
                  <option value='all'>All Occasions</option>
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
                  aria-label='Price range'
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
                  setActiveOccasion("all");
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
      <section
        className='max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-4'
        aria-labelledby='gifting-products-heading'
      >
        <h3 id='gifting-products-heading' className='sr-only'>
          Matching gift products
        </h3>
        {isLoading ?
          <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5'>
            {Array.from({ length: 8 }).map((_, i) => (
              <GiftProductCardSkeleton key={i} />
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
              <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 pb-8'>
                {Array.from({ length: 4 }).map((_, i) => (
                  <GiftProductCardSkeleton key={i} />
                ))}
              </div>
            )}
          </>
        }
      </section>
    </div>
  );
}

function GiftProductCardSkeleton() {
  return (
    <div className='rounded-xl border border-gray-100 bg-white overflow-hidden'>
      <div className='relative aspect-[4/5] bg-gray-50'>
        <Skeleton className='absolute inset-0 rounded-none' />
        <Skeleton className='absolute top-2 left-2 h-5 w-24 rounded-md bg-white/70' />
        <Skeleton className='absolute top-2 right-2 h-5 w-20 rounded-md bg-white/70' />
      </div>
      <div className='p-2.5 sm:p-3 space-y-2'>
        <div className='space-y-1'>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-4/5' />
        </div>
        <div className='flex items-center justify-between gap-2'>
          <Skeleton className='h-4 w-20' />
          <Skeleton className='h-4 w-14' />
        </div>
        <Skeleton className='h-10 w-full rounded-lg' />
      </div>
    </div>
  );
}

function GiftProductCard({ product }: { product: Product }) {
  const needsCustomization = productNeedsCustomization(product);
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
  return (
    <Link
      href={`/shop/${encodeURIComponent(product.slug)}`}
      className='group block rounded-xl border border-gray-100 bg-white overflow-hidden hover:shadow-md transition-shadow'
    >
      <div className='relative aspect-[4/5] bg-gray-50'>
        {product.images?.[0]?.url ?
          <Image
            src={product.images[0].url}
            alt={`${product.name} — gift product photo`}
            fill
            className='object-cover'
            sizes='(max-width:640px) 50vw, 25vw'
          />
        : <div className='absolute inset-0 grid place-items-center text-gray-300'>
            <Gift className='h-8 w-8' aria-hidden />
          </div>
        }
        {product.images?.[1]?.url && (
          <Image
            src={product.images[1].url}
            alt=''
            fill
            className='object-cover opacity-0 transition-opacity duration-300 lg:group-hover:opacity-100'
            sizes='(max-width:640px) 50vw, 25vw'
          />
        )}
        {needsCustomization && (
          <span className='absolute top-2 left-2 bg-navy-900 text-white text-[10px] font-semibold px-2 py-1 rounded-md'>
            Customizable
          </span>
        )}

        <span className='absolute top-2 right-2 bg-white/90 text-gray-800 text-[10px] font-semibold px-2 py-1 rounded-md border border-gray-200'>
          {product.giftOccasions?.[0] || ""}
        </span>
      </div>
      <div className='p-2.5 sm:p-3'>
        <p className='text-sm font-semibold text-gray-900 line-clamp-2 min-h-9'>
          {product.name}
        </p>
        <div className='mt-1 flex items-center gap-1'>
          <Star
            className={cn(
              "h-3 w-3 shrink-0",
              hasRating ? "fill-gold-500 text-gold-500" : "text-gray-300",
            )}
            aria-hidden
          />
          {hasRating ?
            <>
              <span className='text-xs text-gray-700'>
                {ratingAverage.toFixed(1)}
              </span>
              <span className='text-[11px] text-gray-600'>({ratingCount})</span>
            </>
          : <span className='text-[11px] text-gray-600'>No ratings yet</span>}
        </div>
        <div className='mt-1.5 text-base font-bold text-gray-900'>
          {formatPrice(product.price)}
        </div>
        <div className='mt-1.5 flex flex-wrap gap-1.5'>
          <span className='text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-100'>
            Gift
          </span>
          {needsCustomization && (
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

        <div className='mt-2 h-9 rounded-lg border border-gray-200 bg-white text-navy-900 text-xs font-semibold inline-flex items-center justify-center w-full'>
          View details
        </div>
      </div>
    </Link>
  );
}
