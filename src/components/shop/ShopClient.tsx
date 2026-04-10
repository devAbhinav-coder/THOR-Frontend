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
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const SORT_OPTIONS = [
  { label: "Newest First", value: "-createdAt" },
  { label: "Price: Low to High", value: "price" },
  { label: "Price: High to Low", value: "-price" },
  { label: "Top Rated", value: "-ratings.average" },
  { label: "Most Popular", value: "-ratings.count" },
];
const SEARCH_MAX_LEN = 30;
/** Keep in sync with getNextPageParam full-page fallback. */
const SHOP_PAGE_LIMIT = 12;

const defaultShopBanner = {
  title: "Shop Our Collection",
  subtitle: "Discover premium ethnic wear crafted for every occasion.",
  centerImage: "",
  leftImage: "",
  rightImage: "",
  isActive: true,
};

export default function ShopClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(
    null,
  );
  const [storefrontSettings, setStorefrontSettings] =
    useState<StorefrontSettings | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  /** FIFO: each debounced value we pushed with router.replace; skip draft reset when URL catches up (handles out-of-order navigations while typing). */
  const searchCommitQueue = useRef<string[]>([]);

  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
    fabric: searchParams.get("fabric") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    rating: searchParams.get("rating") || "",
    sort: searchParams.get("sort") || "-createdAt",
    search: searchParams.get("search") || "",
    isFeatured: searchParams.get("isFeatured") || "",
  });

  const [searchDraft, setSearchDraft] = useState(() =>
    (searchParams.get("search") || "").slice(0, SEARCH_MAX_LEN),
  );
  const debouncedSearch = useDebouncedValue(searchDraft.trim(), 380);
  const searchPending = searchDraft.trim() !== debouncedSearch;

  const searchParamsKey = searchParams.toString();

  useEffect(() => {
    setFilters({
      category: searchParams.get("category") || "",
      fabric: searchParams.get("fabric") || "",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      rating: searchParams.get("rating") || "",
      sort: searchParams.get("sort") || "-createdAt",
      search: (searchParams.get("search") || "").slice(0, SEARCH_MAX_LEN),
      isFeatured: searchParams.get("isFeatured") || "",
    });
  }, [searchParamsKey, searchParams]);

  useEffect(() => {
    const urlQ = (searchParams.get("search") || "").trim();
    const q = searchCommitQueue.current;
    if (q.length > 0 && q[0] === urlQ) {
      q.shift();
      return;
    }
    searchCommitQueue.current = [];
    setSearchDraft((searchParams.get("search") || "").slice(0, SEARCH_MAX_LEN));
  }, [searchParamsKey, searchParams]);

  useEffect(() => {
    const urlQ = (searchParams.get("search") || "")
      .trim()
      .slice(0, SEARCH_MAX_LEN);
    if (debouncedSearch === urlQ) return;
    /* Clear-all: field is empty and URL has no search, but debounce still holds old query — do not re-apply it */
    if (searchDraft.trim() === "" && urlQ === "" && debouncedSearch !== "") {
      return;
    }
    searchCommitQueue.current.push(debouncedSearch);
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearch)
      params.set("search", debouncedSearch.slice(0, SEARCH_MAX_LEN));
    else params.delete("search");
    const qs = params.toString();
    router.replace(qs ? `/shop?${qs}` : "/shop", { scroll: false });
  }, [debouncedSearch, router, searchParams, searchDraft]);

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

  const {
    data,
    isLoading,
    isPending,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
  } = useInfiniteQuery({
    queryKey: ["shop-products", queryKey],
    queryFn: async ({ pageParam }) => {
      const params: Record<string, string | number> = {
        sort: filters.sort,
        page: pageParam,
        limit: SHOP_PAGE_LIMIT,
      };
      if (filters.category) params.category = filters.category;
      if (filters.fabric) params.fabric = filters.fabric;
      if (filters.minPrice) params["price[gte]"] = filters.minPrice;
      if (filters.maxPrice) params["price[lte]"] = filters.maxPrice;
      if (filters.rating) params["ratings.average[gte]"] = filters.rating;
      if (filters.search)
        params.search = filters.search.slice(0, SEARCH_MAX_LEN);
      if (filters.isFeatured) params.isFeatured = filters.isFeatured;
      return productApi.getAll(params);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const p = lastPage.pagination;
      const cur = p?.currentPage ?? 1;
      const tp = Math.max(1, p?.totalPages ?? 1);
      const total = p?.total ?? p?.totalProducts ?? 0;
      const batch = (lastPage.data?.products || []) as Product[];
      if (typeof p?.hasNextPage === "boolean") {
        return p.hasNextPage ? cur + 1 : undefined;
      }
      if (cur < tp) return cur + 1;
      if (
        batch.length === SHOP_PAGE_LIMIT &&
        total > cur * SHOP_PAGE_LIMIT
      ) {
        return cur + 1;
      }
      return undefined;
    },
    staleTime: 45_000,
    /** Avoid empty grid flash when search/filters update (e.g. landing from home navbar). */
    placeholderData: (previousData) => previousData,
  });

  const products = useMemo(
    () =>
      (data?.pages ?? []).flatMap(
        (pg) => (pg.data?.products || []) as Product[],
      ),
    [data?.pages],
  );

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

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries[0]?.isIntersecting;
        if (
          hit &&
          hasNextPage &&
          !isFetchingNextPage &&
          !isPending
        ) {
          void fetchNextPage();
        }
      },
      { root: null, rootMargin: "640px 0px", threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    products.length,
  ]);

  const updateFilter = (key: string, value: string | number) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters as typeof filters);

    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v && v !== "-createdAt" && v !== "1") params.set(k, String(v));
    });
    const qs = params.toString();
    router.push(qs ? `/shop?${qs}` : "/shop", { scroll: false });
  };

  const clearFilters = () => {
    searchCommitQueue.current = [];
    setSearchDraft("");
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
      ((storefrontSettings as StorefrontSettings & {
        shopBanner?: Partial<typeof defaultShopBanner>;
      } | null)?.shopBanner as Partial<typeof defaultShopBanner> | undefined) ||
      {};
    return {
      ...defaultShopBanner,
      ...raw,
      isActive: raw.isActive !== false,
    };
  }, [storefrontSettings]);
  const headingText =
    filters.isFeatured ? "Featured Products" : "Shop Collection";
  const breadcrumbContext = useMemo(() => {
    if (filters.search) return `Search Products: "${searchTitle}"`;
    if (filters.category) return filters.category;
    if (filters.fabric) return `${filters.fabric} Collection`;
    if (filters.rating) return `${filters.rating}★ & Above`;
    if (filters.minPrice || filters.maxPrice) return "Price Filter";
    if (filters.isFeatured) return "Featured Products";
    return "All Products";
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

  const showShopBanner = shopBanner.isActive;
  const ListHeadingTag = showShopBanner ? "h2" : "h1";

  return (
    <div>
      {showShopBanner && (
        <section className='relative border-y border-gray-200/70 overflow-x-clip'>
          {shopBanner.centerImage ? (
            <div className='relative h-[130px] sm:h-[180px] lg:h-[210px]'>
              <Image
                src={shopBanner.centerImage}
                alt='Shop banner'
                fill
                className='object-cover object-center'
                sizes='100vw'
                priority
              />
              <div className='absolute inset-0 bg-black/20' />
              <div className='absolute inset-0 flex flex-col items-center justify-center px-4 text-center'>
                <h1 className='font-serif text-2xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight drop-shadow-md'>
                  {shopBanner.title || "Shop Our Collection"}
                </h1>
                <p className='mt-2 text-sm sm:text-lg text-white/95 max-w-2xl mx-auto drop-shadow'>
                  {shopBanner.subtitle ||
                    "Discover premium ethnic wear crafted for every occasion."}
                </p>
              </div>
            </div>
          ) : (
            <div className='bg-[#f2eceb]'>
              <div className='max-w-[1800px] mx-auto px-2 sm:px-4'>
                <div className='grid grid-cols-1 sm:grid-cols-[150px_1fr_150px] lg:grid-cols-[220px_1fr_220px] items-stretch min-h-[130px] sm:min-h-[180px] lg:min-h-[210px]'>
                  <div className='relative hidden sm:block'>
                    {shopBanner.leftImage && (
                      <Image
                        src={shopBanner.leftImage}
                        alt=''
                        fill
                        className='object-cover object-center'
                        sizes='220px'
                        loading='lazy'
                      />
                    )}
                  </div>
                  <div className='flex flex-col items-center justify-center px-4 sm:px-5 text-center'>
                    <h1 className='font-serif text-2xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight'>
                      {shopBanner.title || "Shop Our Collection"}
                    </h1>
                    <p className='mt-2 text-sm sm:text-lg text-gray-700 max-w-2xl mx-auto'>
                      {shopBanner.subtitle ||
                        "Discover premium ethnic wear crafted for every occasion."}
                    </p>
                  </div>
                  <div className='relative hidden sm:block'>
                    {shopBanner.rightImage && (
                      <Image
                        src={shopBanner.rightImage}
                        alt=''
                        fill
                        className='object-cover object-center'
                        sizes='220px'
                        loading='lazy'
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5'>
        <nav
          aria-label='Breadcrumb'
          className='flex items-center gap-2 text-[11px] uppercase tracking-wider text-gray-600'
        >
          <Link href='/' className='hover:text-brand-700 transition-colors'>
            Home
          </Link>
          <ChevronRight className='h-3.5 w-3.5 shrink-0 opacity-70' aria-hidden />
          <span className='text-gray-600'>Shop</span>
          <ChevronRight className='h-3.5 w-3.5 shrink-0 opacity-70' aria-hidden />
          <span className='truncate max-w-[56vw] sm:max-w-none normal-case tracking-normal text-gray-800 font-medium'>
            {breadcrumbContext}
          </span>
        </nav>

        <div className='mt-4 mb-2 sm:mb-3 flex flex-wrap items-end justify-between gap-3'>
          <div>
            <ListHeadingTag className='text-xl sm:text-2xl font-serif font-semibold text-gray-900'>
              {headingText}
            </ListHeadingTag>
            <p className='text-sm text-gray-600 mt-1'>
              {isLoading ? "Loading…" : `${pagination.totalProducts} products`}
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
      </div>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-7'>
      <div className='lg:flex lg:items-start lg:gap-6'>
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
            "lg:block lg:w-64 lg:min-w-64 lg:flex-none lg:bg-transparent lg:shadow-none lg:pl-1 lg:sticky lg:top-20 lg:self-start lg:h-fit lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto",
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

          <div className='space-y-5 p-4 sm:p-5 lg:p-0 lg:pr-2'>
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

          {isLoading ?
            <div className={productGridClass}>
              {[...Array(9)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          : !isLoading && (isError || products.length === 0) ?
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
          : <>
              <div className={productGridClass}>
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Infinite scroll sentinel */}
              <div ref={loadMoreRef} className='h-12 w-full shrink-0' aria-hidden />

              {isFetchingNextPage && (
                <div className={`mt-6 ${productGridClass}`}>
                  {[...Array(6)].map((_, i) => (
                    <ProductCardSkeleton key={`more-${i}`} />
                  ))}
                </div>
              )}

              {!pagination?.hasNextPage && products.length > 0 && (
                <p className='mt-8 text-center text-sm text-gray-600'>
                  You’ve reached the end.
                </p>
              )}
            </>
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
    <div className='border-b border-gray-200 pb-5'>
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
