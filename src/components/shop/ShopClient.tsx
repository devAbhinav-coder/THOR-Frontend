"use client";

import { useState, useEffect, useMemo, useRef, useId } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronUp,
  ChevronRight,
} from "lucide-react";
import { productApi, storefrontApi } from "@/lib/api";
import { Product, FilterOptions, StorefrontSettings } from "@/types";
import ProductCard from "@/components/product/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/SkeletonLoader";
import { Button } from "@/components/ui/button";
import ShopPageSkeleton from "@/components/shop/ShopPageSkeleton";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { trackSearch } from "@/lib/metaPixel";
import { trackGaSearch } from "@/lib/googleAnalytics";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useInfiniteScrollTrigger } from "@/hooks/useInfiniteScrollTrigger";
import { getNextNumericPage } from "@/lib/infiniteScrollPagination";
import { toShopCategorySlug } from "@/lib/shopCategorySeo";
import { resolveShopListHeading } from "@/lib/pageHeadings";
import { resolveShopHeroContent } from "@/lib/shopHeroCopy";
import ShopHeroBanner from "@/components/shop/ShopHeroBanner";
function isUsableBannerImage(url?: string | null): boolean {
  const u = String(url || "").trim();
  if (!u) return false;
  if (u.startsWith("/")) return true;
  if (!/^https?:\/\//i.test(u)) return false;
  if (/\.(pdf|mp4|webm|mov)(\?|$)/i.test(u)) return false;
  return true;
}

function formatProductCount(n: number): string {
  const total = Math.max(0, Number(n) || 0);
  return `${total} ${total === 1 ? "product" : "products"}`;
}
import { ProductInfiniteGrid } from "@/components/product/ProductInfiniteGrid";

const SORT_OPTIONS = [
  { label: "Recommended", value: "-createdAt" },
  { label: "Price: Low to High", value: "price" },
  { label: "Price: High to Low", value: "-price" },
  { label: "Top Rated", value: "-ratings.average" },
  { label: "Most Popular", value: "-ratings.count" },
];
const SEARCH_MAX_LEN = 30;
/** Keep in sync with getNextPageParam full-page fallback. */
const SHOP_PAGE_LIMIT = 12;

const defaultShopBanner = {
  title: "",
  subtitle: "",
  centerImage: "",
  leftImage: "",
  rightImage: "",
  isActive: true,
};

type ShopClientProps = {
  categoryContext?: {
    name: string;
    slug: string;
    description?: string;
  } | null;
};

export default function ShopClient({ categoryContext = null }: ShopClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(
    null,
  );
  const [storefrontSettings, setStorefrontSettings] =
    useState<StorefrontSettings | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const routeBasePath = categoryContext ?
      `/shop/category/${encodeURIComponent(categoryContext.slug)}`
    : "/shop";
  const categoryFromUrl = categoryContext?.name || searchParams.get("category") || "";
  const [filters, setFilters] = useState({
    category: categoryFromUrl,
    fabric: searchParams.get("fabric") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    rating: searchParams.get("rating") || "",
    sort: searchParams.get("sort") || "-createdAt",
    search: (searchParams.get("search") || "").slice(0, SEARCH_MAX_LEN),
    isFeatured: searchParams.get("isFeatured") || "",
  });

  const searchParamsKey = searchParams.toString();

  useEffect(() => {
    setFilters({
      category: categoryContext?.name || searchParams.get("category") || "",
      fabric: searchParams.get("fabric") || "",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      rating: searchParams.get("rating") || "",
      sort: searchParams.get("sort") || "-createdAt",
      search: (searchParams.get("search") || "").slice(0, SEARCH_MAX_LEN),
      isFeatured: searchParams.get("isFeatured") || "",
    });
  }, [searchParamsKey, searchParams, categoryContext?.name]);

  /* Meta Pixel & GA4: Track Search */
  const lastTrackedSearch = useRef("");
  useEffect(() => {
    if (filters.search && filters.search !== lastTrackedSearch.current) {
      trackSearch(filters.search);
      trackGaSearch(filters.search);
      lastTrackedSearch.current = filters.search;
    }
  }, [filters.search]);

  const queryKey = useMemo(
    () =>
      JSON.stringify({
        category: filters.category,
        fabric: filters.fabric,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        rating: filters.rating,
        sort: filters.sort,
        search: filters.search,
        isFeatured: filters.isFeatured,
      }),
    [filters],
  );

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await productApi.getFilterOptions();
        setFilterOptions(res.data as FilterOptions);
      } catch {
        // silent fail
      }
    };
    fetchFilters();
  }, []);

  useEffect(() => {
    storefrontApi
      .getSettings()
      .then((res) => setStorefrontSettings(res.data?.settings || null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!filterOptions?.categories?.length) return;
    const id = window.setTimeout(() => {
      filterOptions.categories.forEach((cat) => {
        const slug = toShopCategorySlug(cat);
        if (!slug) return;
        router.prefetch(`/shop/category/${encodeURIComponent(slug)}`);
      });
    }, 300);
    return () => window.clearTimeout(id);
  }, [filterOptions?.categories, router]);

  const {
    data,
    isLoading,
    isPending,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
  } = useInfiniteQuery({
    queryKey: ["shop-products", "v2", queryKey],
    queryFn: async ({ pageParam }) => {
      const pg = pageParam as number;

      // Use advanced search endpoint when there's a search query for better fuzzy matching
      if (filters.search && filters.search.trim()) {
        const searchParams: Record<string, string | number> = {
          q: filters.search.slice(0, SEARCH_MAX_LEN),
          page: pg,
          limit: SHOP_PAGE_LIMIT,
        };
        
        // Map sort parameter
        if (filters.sort === 'price') searchParams.sortBy = 'price';
        else if (filters.sort === '-price') {
          searchParams.sortBy = 'price';
          searchParams.sortOrder = 'desc';
        }
        else if (filters.sort === '-ratings.average') searchParams.sortBy = 'ratings.average';
        else if (filters.sort === '-ratings.count') searchParams.sortBy = 'soldCount';
        else searchParams.sortBy = 'relevance';
        
        // Add filters
        if (filters.category) searchParams.categories = filters.category;
        if (filters.fabric) searchParams.fabrics = filters.fabric;
        if (filters.minPrice) searchParams.minPrice = Number(filters.minPrice);
        if (filters.maxPrice) searchParams.maxPrice = Number(filters.maxPrice);
        if (filters.rating) searchParams.minRating = Number(filters.rating);
        if (filters.isFeatured) searchParams.isFeatured = filters.isFeatured;
        
        try {
          return await productApi.search(searchParams);
        } catch {
          // Fallback to basic search if advanced search fails
        }
      }
      
      // Use basic search for non-search queries or as fallback
      const params: Record<string, string | number> = {
        sort: filters.sort,
        page: pg,
        limit: SHOP_PAGE_LIMIT,
      };
      if (filters.category) params.category = filters.category;
      if (filters.fabric) params.fabric = filters.fabric;
      if (filters.minPrice) params["price[gte]"] = filters.minPrice;
      if (filters.maxPrice) params["price[lte]"] = filters.maxPrice;
      if (filters.rating) params.minRating = filters.rating;
      if (filters.search)
        params.search = filters.search.slice(0, SEARCH_MAX_LEN);
      if (filters.isFeatured) params.isFeatured = filters.isFeatured;
      return productApi.getAll(params);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      getNextNumericPage(lastPage, allPages, SHOP_PAGE_LIMIT),
    // 5-min cache keeps random page-1 stable within a tab; new visit = new $sample
    staleTime: 5 * 60 * 1000,
  });

  // Flatten pages in deterministic order.
  const products = useMemo(() => {
    return (data?.pages ?? []).flatMap((pg) => (pg.data?.products || []) as Product[]);
  }, [data?.pages]);

  const hasLoadedOnceRef = useRef(false);
  useEffect(() => {
    if (products.length > 0) hasLoadedOnceRef.current = true;
  }, [products.length]);

  const pagination = useMemo(() => {
    const first = data?.pages?.[0];
    const p = first?.pagination;
    const totalProducts = p?.total ?? p?.totalProducts ?? 0;
    const totalPages = Math.max(1, p?.totalPages ?? 1);
    return {
      totalProducts,
      totalPages,
      hasNextPage: Boolean(hasNextPage),
      hasPrevPage: false,
    };
  }, [data?.pages, hasNextPage]);

  const { sentinelRef } = useInfiniteScrollTrigger({
    hasNextPage: Boolean(hasNextPage),
    isFetchingNextPage,
    isPending: isPending && products.length === 0,
    fetchNextPage,
    rootMargin: "400px 0px",
    threshold: 0,
    enabled: !isPending || products.length > 0,
  });

  const buildQueryString = (next: typeof filters, omitCategory: boolean) => {
    const params = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => {
      if (omitCategory && k === "category") return;
      if (v && v !== "-createdAt") params.set(k, String(v));
    });
    return params.toString();
  };

  const updateFilter = (key: string, value: string | number) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters as typeof filters);

    if (key === "category") {
      const nextCategory = String(value || "").trim();
      const nextSlug = toShopCategorySlug(nextCategory);
      const paramsForNext = { ...newFilters, category: "" };
      const qs = buildQueryString(paramsForNext, true);
      if (!nextCategory || !nextSlug) {
        router.push(qs ? `/shop?${qs}` : "/shop", { scroll: false });
        return;
      }
      router.push(
        qs ? `/shop/category/${encodeURIComponent(nextSlug)}?${qs}` : `/shop/category/${encodeURIComponent(nextSlug)}`,
        { scroll: false },
      );
      return;
    }

    const qs = buildQueryString(newFilters, Boolean(categoryContext));
    router.push(qs ? `${routeBasePath}?${qs}` : routeBasePath, { scroll: false });
  };

  const clearFilters = () => {
    setFilters({
      category: "",
      fabric: "",
      minPrice: "",
      maxPrice: "",
      rating: "",
      sort: "-createdAt",
      search: "",
      isFeatured: "",
    });
    router.push("/shop");
  };

  const activeFilterCount = [
    filters.category,
    filters.fabric,
    filters.minPrice,
    filters.maxPrice,
    filters.rating,
    filters.search,
  ].filter(Boolean).length;
  const searchTitle =
    filters.search.length > 28 ?
      `${filters.search.slice(0, 28)}...`
    : filters.search;
  const shopBanner = useMemo(() => {
    const raw =
      ((
        storefrontSettings as
          | (StorefrontSettings & {
              shopBanner?: Partial<typeof defaultShopBanner>;
            })
          | null
      )?.shopBanner as Partial<typeof defaultShopBanner> | undefined) || {};
    return {
      ...defaultShopBanner,
      ...raw,
      isActive: raw.isActive !== false,
    };
  }, [storefrontSettings]);
  const heroContent = resolveShopHeroContent({
    categoryName: categoryContext?.name || filters.category,
    categoryDescription: categoryContext?.description,
    search: filters.search,
    fabric: filters.fabric,
    isFeatured: filters.isFeatured,
    bannerTitle: shopBanner.title,
  });
  const headingText = resolveShopListHeading({
    categoryName: categoryContext?.name || filters.category,
    search: filters.search,
    fabric: filters.fabric,
    isFeatured: filters.isFeatured,
  });
  const breadcrumbContext = useMemo(() => {
    if (filters.search) return `Search Products: "${searchTitle}"`;
    if (filters.category) return filters.category;
    if (filters.fabric) return `${filters.fabric} Collection`;
    if (filters.rating) return `${filters.rating}★ & Above`;
    if (filters.minPrice || filters.maxPrice) return "Price Filter";
    if (filters.isFeatured) return "Featured Products";
    return "All Sarees";
  }, [
    filters.search,
    filters.category,
    filters.fabric,
    filters.rating,
    filters.minPrice,
    filters.maxPrice,
    filters.isFeatured,
    searchTitle,
  ]);
  const productGridClass =
    "grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-4 gap-4 sm:gap-5 items-stretch [&>*]:h-full [&>*]:min-h-0";

  /** One full-width hero image only — prefer center, then legacy left/right as fallback */
  const heroImageSrc =
    isUsableBannerImage(shopBanner.centerImage) ? shopBanner.centerImage.trim()
    : isUsableBannerImage(shopBanner.leftImage) ? shopBanner.leftImage.trim()
    : isUsableBannerImage(shopBanner.rightImage) ? shopBanner.rightImage.trim()
    : null;
  const showImageHero = shopBanner.isActive && Boolean(heroImageSrc);
  const showShopBanner = shopBanner.isActive;
  const ListHeadingTag = showShopBanner ? "h2" : "h1";

  // First paint: keep skeleton consistent with route `loading.tsx`.
  if (isPending && !hasLoadedOnceRef.current) {
    return <ShopPageSkeleton />;
  }

  return (
    <div>
      {showShopBanner && (
        <section className='relative overflow-x-clip border-b border-[#ead9d4]/60'>
          {showImageHero && heroImageSrc ?
            <div className='relative h-[148px] sm:h-[188px] lg:h-[208px]'>
              <Image
                src={heroImageSrc}
                alt='The House of Rani — premium sarees and ethnic wear collection'
                fill
                className='object-cover object-center'
                sizes='100vw'
                priority
              />
              <div className='absolute inset-0 bg-gradient-to-t from-navy-950/88 via-navy-900/45 to-navy-900/20' />
              <ShopHeroBanner content={heroContent} variant='image' compact />
            </div>
          : <div
              className={cn(
                "bg-gradient-to-br from-[#f7f0ed] via-[#faf6f4] to-[#efe8e5]",
                categoryContext && "ring-1 ring-inset ring-[#e8ddd9]/80",
              )}
            >
              <ShopHeroBanner content={heroContent} variant='light' compact />
            </div>
          }
        </section>
      )}

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-5 sm:pt-4'>
        <nav
          aria-label='Breadcrumb'
          className='flex items-center gap-2 text-[11px] uppercase tracking-wider text-gray-600'
        >
          <Link href='/' className='hover:text-brand-700 transition-colors'>
            Home
          </Link>
          <ChevronRight
            className='h-3.5 w-3.5 shrink-0 opacity-70'
            aria-hidden
          />
          <span className='text-gray-600'>Shop</span>
          <ChevronRight
            className='h-3.5 w-3.5 shrink-0 opacity-70'
            aria-hidden
          />
          <span className='truncate max-w-[56vw] sm:max-w-none normal-case tracking-normal text-gray-800 font-medium'>
            {breadcrumbContext}
          </span>
        </nav>

        <div className='mt-2 mb-2 flex flex-wrap items-end justify-between gap-3'>
          <div>
            <ListHeadingTag className='text-xl sm:text-2xl font-serif font-semibold text-gray-900'>
              {headingText}
            </ListHeadingTag>
            <p className='text-sm text-gray-600 mt-1'>
              {isLoading ? "Loading…" : formatProductCount(pagination.totalProducts)}
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              className='lg:hidden flex items-center gap-2 rounded-xl'
              onClick={() => setIsSidebarOpen(true)}
              aria-expanded={isSidebarOpen}
              aria-controls='shop-filters-drawer'
            >
              <SlidersHorizontal className='h-4 w-4' aria-hidden />
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </Button>
            <select
              aria-label='Sort products'
              value={filters.sort}
              onChange={(e) => updateFilter("sort", e.target.value)}
              className='h-10 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/25'
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className='lg:flex lg:items-start lg:gap-5'>
          <aside
            id='shop-filters-drawer'
            role={isSidebarOpen ? "dialog" : undefined}
            aria-modal={isSidebarOpen ? true : undefined}
            aria-labelledby='shop-filters-drawer-title'
            className={cn(
              "flex-shrink-0",
              // Mobile drawer vs desktop sidebar
              isSidebarOpen ?
                "fixed top-2 bottom-2 left-0 z-50 w-80 max-w-[92vw] bg-white shadow-2xl overflow-y-auto rounded-2xl border border-gray-100"
              : "hidden",
              "lg:block lg:w-64 lg:min-w-64 lg:flex-none lg:bg-transparent lg:shadow-none lg:sticky lg:top-[4.75rem] lg:self-start lg:overflow-visible",
            )}
          >
            <h2 id='shop-filters-drawer-title' className='sr-only'>
              Product filters
            </h2>
            {isSidebarOpen && (
              <div className='flex items-center justify-between p-4 border-b lg:hidden'>
                <p className='font-semibold text-base' aria-hidden>
                  Filters
                </p>
                <button
                  type='button'
                  onClick={() => setIsSidebarOpen(false)}
                  className='rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  aria-label='Close filters'
                >
                  <X className='h-5 w-5' aria-hidden />
                </button>
              </div>
            )}

            <div className='space-y-4 p-4 sm:p-5 lg:p-0'>
              {activeFilterCount > 0 && (
                <button
                  type='button'
                  onClick={clearFilters}
                  className='flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-medium'
                >
                  <X className='h-4 w-4' aria-hidden /> Clear all filters (
                  {activeFilterCount})
                </button>
              )}

              <FilterSection title='Category'>
                <div className='space-y-2'>
                  {filterOptions?.categories.map((cat) => (
                    <label
                      key={cat}
                      className='flex items-center gap-2 cursor-pointer group'
                    >
                      <input
                        type='radio'
                        name='category'
                        value={cat}
                        checked={filters.category === cat}
                        onChange={() =>
                          updateFilter(
                            "category",
                            filters.category === cat ? "" : cat,
                          )
                        }
                        className='text-brand-600 focus:ring-brand-500'
                      />
                      <span className='text-sm text-gray-700 group-hover:text-brand-700'>
                        {cat}
                      </span>
                    </label>
                  ))}
                </div>
              </FilterSection>

              <FilterSection title='Fabric'>
                <div className='space-y-2'>
                  {filterOptions?.fabrics.map((fabric) => (
                    <label
                      key={fabric}
                      className='flex items-center gap-2 cursor-pointer group'
                    >
                      <input
                        type='radio'
                        name='fabric'
                        value={fabric}
                        checked={filters.fabric === fabric}
                        onChange={() =>
                          updateFilter(
                            "fabric",
                            filters.fabric === fabric ? "" : fabric,
                          )
                        }
                        className='text-brand-600 focus:ring-brand-500'
                      />
                      <span className='text-sm text-gray-700 group-hover:text-brand-700'>
                        {fabric}
                      </span>
                    </label>
                  ))}
                </div>
              </FilterSection>

              <FilterSection title='Price Range'>
                <div className='space-y-3'>
                  <div className='flex items-center gap-2'>
                    <input
                      type='number'
                      placeholder='Min'
                      value={filters.minPrice}
                      onChange={(e) => updateFilter("minPrice", e.target.value)}
                      aria-label='Minimum price'
                      className='w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-brand-500'
                    />
                    <span className='text-gray-600' aria-hidden>
                      —
                    </span>
                    <input
                      type='number'
                      placeholder='Max'
                      value={filters.maxPrice}
                      onChange={(e) => updateFilter("maxPrice", e.target.value)}
                      aria-label='Maximum price'
                      className='w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-brand-500'
                    />
                  </div>
                  {filterOptions?.priceRange && (
                    <p className='text-xs text-gray-600'>
                      {formatPrice(filterOptions.priceRange.minPrice)} —{" "}
                      {formatPrice(filterOptions.priceRange.maxPrice)}
                    </p>
                  )}
                </div>
              </FilterSection>

              <FilterSection title='Minimum Rating'>
                <div className='space-y-2'>
                  {[4, 3, 2, 1].map((r) => (
                    <label
                      key={r}
                      className='flex items-center gap-2 cursor-pointer group'
                    >
                      <input
                        type='radio'
                        name='rating'
                        value={r}
                        checked={filters.rating === String(r)}
                        onChange={() =>
                          updateFilter(
                            "rating",
                            filters.rating === String(r) ? "" : String(r),
                          )
                        }
                        className='text-brand-600 focus:ring-brand-500'
                      />
                      <span className='text-sm text-gray-700 group-hover:text-brand-700'>
                        {"★".repeat(r)} & above
                      </span>
                    </label>
                  ))}
                </div>
              </FilterSection>
            </div>
          </aside>

          {isSidebarOpen && (
            <button
              type='button'
              className='fixed inset-0 z-40 cursor-default bg-black/50 lg:hidden'
              aria-label='Close filters'
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          <div className='w-full min-w-0 lg:flex-1 lg:min-h-[70vh] lg:-mt-1'>
            {isPending ?
              <div className={productGridClass}>
                {[...Array(9)].map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            : !isPending && (isError || products.length === 0) ?
              <div className='w-full'>
                <div className='w-full rounded-2xl border border-gray-100 bg-white min-h-[420px] sm:min-h-[460px] flex flex-col items-start justify-start text-left px-6 pt-10'>
                  <p className='text-gray-700 text-lg mb-4'>
                    {isError ?
                      "Something went wrong loading products. Try again or adjust filters."
                    : "No products found matching your filters."}
                  </p>
                  <Button type='button' variant='brand' onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              </div>
            : <ProductInfiniteGrid
                gridClassName={productGridClass}
                items={products}
                getItemKey={(p) => p._id}
                renderItem={(product) => <ProductCard product={product} />}
                isInitialLoading={false}
                isFetchingNextPage={isFetchingNextPage}
                hasNextPage={Boolean(hasNextPage)}
                pageSize={SHOP_PAGE_LIMIT}
                loadMoreSkeletonCount={6}
                sentinelRef={sentinelRef}
                endMessage={undefined}
              />
            }
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const uid = useId();
  const headingId = `${uid}-heading`;
  const panelId = `${uid}-panel`;

  return (
    <div className='border-b border-gray-200 pb-3 last:border-b-0 last:pb-0'>
      <button
        id={headingId}
        type='button'
        className='flex items-center justify-between w-full mb-3 text-left rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40'
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <span className='font-semibold text-sm text-gray-900'>{title}</span>
        {isOpen ?
          <ChevronUp className='h-4 w-4 text-gray-600' aria-hidden />
        : <ChevronDown className='h-4 w-4 text-gray-600' aria-hidden />}
      </button>
      <div
        id={panelId}
        role='region'
        aria-labelledby={headingId}
        hidden={!isOpen}
      >
        {children}
      </div>
    </div>
  );
}
