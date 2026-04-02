"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(
    null,
  );
  const [storefrontSettings, setStorefrontSettings] =
    useState<StorefrontSettings | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [page, setPage] = useState(1);
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

  const fetchProducts = useCallback(
    async (nextPage: number, mode: "replace" | "append") => {
      if (mode === "replace") setIsLoading(true);
      else setIsLoadingMore(true);
      try {
        const params: Record<string, string | number> = {
          sort: filters.sort,
          page: nextPage,
          limit: 8,
        };

        if (filters.category) params.category = filters.category;
        if (filters.fabric) params.fabric = filters.fabric;
        if (filters.minPrice) params["price[gte]"] = filters.minPrice;
        if (filters.maxPrice) params["price[lte]"] = filters.maxPrice;
        if (filters.rating) params["ratings.average[gte]"] = filters.rating;
        if (filters.search)
          params.search = filters.search.slice(0, SEARCH_MAX_LEN);
        if (filters.isFeatured) params.isFeatured = filters.isFeatured;

        const res = await productApi.getAll(params);
        const next = (res.data.products || []) as Product[];
        setProducts((prev) => (mode === "append" ? [...prev, ...next] : next));
        const p = res.pagination;
        setPagination({
          currentPage: p?.currentPage ?? nextPage,
          totalPages: p?.totalPages ?? 1,
          totalProducts: p?.totalProducts ?? p?.total ?? 0,
          hasNextPage: p?.hasNextPage ?? false,
          hasPrevPage: p?.hasPrevPage ?? false,
        });
      } catch {
        if (mode === "replace") setProducts([]);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [filters],
  );

  useEffect(() => {
    setPage(1);
    fetchProducts(1, "replace");
  }, [queryKey, fetchProducts]);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    if (isLoading || isLoadingMore) return;
    if (!pagination?.hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (isLoading || isLoadingMore) return;
        if (!pagination?.hasNextPage) return;

        const nextPage = page + 1;
        setPage(nextPage);
        fetchProducts(nextPage, "append");
      },
      { root: null, rootMargin: "600px 0px", threshold: 0.01 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [page, fetchProducts, pagination?.hasNextPage, isLoading, isLoadingMore]);

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

  return (
    <div>
      {shopBanner.isActive && (
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
                        alt='Shop banner left'
                        fill
                        className='object-cover object-center'
                        sizes='220px'
                        priority
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
                        alt='Shop banner right'
                        fill
                        className='object-cover object-center'
                        sizes='220px'
                        priority
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
        <div className='flex items-center gap-2 text-[11px] uppercase tracking-wider text-gray-500'>
          <Link href='/' className='hover:text-brand-700 transition-colors'>
            Home
          </Link>
          <ChevronRight className='h-3.5 w-3.5' />
          <span>Buy</span>
          <ChevronRight className='h-3.5 w-3.5' />
          <span className='truncate max-w-[56vw] sm:max-w-none normal-case tracking-normal text-gray-700'>
            {breadcrumbContext}
          </span>
        </div>

        <div className='mt-4 mb-2 sm:mb-3 flex flex-wrap items-end justify-between gap-3'>
          <div>
            <h2 className='text-xl sm:text-2xl font-serif font-semibold text-gray-900'>
              {headingText}
            </h2>
            <p className='text-sm text-gray-500 mt-1'>
              {isLoading ? "Loading..." : `${pagination.totalProducts} products`}
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              className='lg:hidden flex items-center gap-2 rounded-xl'
              onClick={() => setIsSidebarOpen(true)}
            >
              <SlidersHorizontal className='h-4 w-4' />
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </Button>
            <select
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
          className={cn(
            "flex-shrink-0",
            // Mobile drawer vs desktop sidebar
            isSidebarOpen ?
              "fixed top-2 bottom-2 left-0 z-50 w-80 max-w-[92vw] bg-white shadow-2xl overflow-y-auto rounded-2xl border border-gray-100"
            : "hidden",
            "lg:block lg:w-64 lg:min-w-64 lg:flex-none lg:bg-transparent lg:shadow-none lg:pl-1 lg:sticky lg:top-20 lg:self-start lg:h-fit lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto",
          )}
        >
          {isSidebarOpen && (
            <div className='flex items-center justify-between p-4 border-b lg:hidden'>
              <h2 className='font-semibold'>Filters</h2>
              <button onClick={() => setIsSidebarOpen(false)}>
                <X className='h-5 w-5' />
              </button>
            </div>
          )}

          <div className='space-y-5 p-4 sm:p-5 lg:p-0 lg:pr-2'>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className='flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-medium'
              >
                <X className='h-4 w-4' /> Clear all filters ({activeFilterCount}
                )
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
                    className='w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-brand-500'
                  />
                  <span className='text-gray-400'>—</span>
                  <input
                    type='number'
                    placeholder='Max'
                    value={filters.maxPrice}
                    onChange={(e) => updateFilter("maxPrice", e.target.value)}
                    className='w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-brand-500'
                  />
                </div>
                {filterOptions?.priceRange && (
                  <p className='text-xs text-gray-400'>
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
          <div
            className='fixed inset-0 bg-black/50 z-40 lg:hidden'
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
          : products.length === 0 ?
            <div className='w-full'>
              <div className='w-full rounded-2xl border border-gray-100 bg-white min-h-[420px] sm:min-h-[460px] flex flex-col items-start justify-start text-left px-6 pt-10'>
                <p className='text-gray-500 text-lg mb-4'>
                  No products found matching your filters.
                </p>
                <Button variant='brand' onClick={clearFilters}>
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
              <div ref={loadMoreRef} className='h-10' />

              {isLoadingMore && (
                <div className={`mt-6 ${productGridClass}`}>
                  {[...Array(6)].map((_, i) => (
                    <ProductCardSkeleton key={`more-${i}`} />
                  ))}
                </div>
              )}

              {!pagination?.hasNextPage && products.length > 0 && (
                <p className='mt-8 text-center text-sm text-gray-400'>
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

  return (
    <div className='border-b border-gray-200 pb-5'>
      <button
        className='flex items-center justify-between w-full mb-3 text-left'
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className='font-semibold text-sm text-gray-900'>{title}</span>
        {isOpen ?
          <ChevronUp className='h-4 w-4 text-gray-500' />
        : <ChevronDown className='h-4 w-4 text-gray-500' />}
      </button>
      {isOpen && children}
    </div>
  );
}
