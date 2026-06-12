"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { productApi, storefrontApi } from "@/lib/api";
import { Product, FilterOptions, StorefrontSettings } from "@/types";
import { Button } from "@/components/ui/button";
import ShopPageSkeleton from "@/components/shop/ShopPageSkeleton";
import ShopCollectionCard from "@/components/shop/ShopCollectionCard";
import ShopCollectionCardSkeleton from "@/components/shop/ShopCollectionCardSkeleton";
import ShopFilterBar from "@/components/shop/ShopFilterBar";
import { trackSearch } from "@/lib/metaPixel";
import { trackGaSearch } from "@/lib/googleAnalytics";
import { useInfiniteScrollTrigger } from "@/hooks/useInfiniteScrollTrigger";
import { getNextNumericPage } from "@/lib/infiniteScrollPagination";
import { toShopCategorySlug } from "@/lib/shopCategorySeo";
import { resolveShopListHeading } from "@/lib/pageHeadings";
import { resolveShopHeroContent } from "@/lib/shopHeroCopy";
import {
  SHOP_PAGE_LIMIT,
  type ShopCategoryContext,
  buildShopProductQueryParams,
  countActiveShopFilters,
  parseShopFiltersFromUrl,
  resolveClearShopFiltersNavigation,
  resolveShopFilterNavigation,
  resolveCanonicalShopUrl,
  shouldShowClearShopFilters,
  dedupeShopFilterValues,
  formatShopCategoriesLabel,
  formatShopFabricsLabel,
} from "@/lib/shopFilters";
import { ProductInfiniteGrid } from "@/components/product/ProductInfiniteGrid";
import { useShopFilterPanel } from "@/components/shop/ShopFilterPanelContext";

function formatProductCount(n: number): string {
  const total = Math.max(0, Number(n) || 0);
  return `${total} ${total === 1 ? "product" : "products"}`;
}

/** Persists across /shop ↔ /shop/category navigations (layout-mounted client). */
let shopListingHasLoadedOnce = false;

function humanizeCategorySlug(input: string): string {
  const decoded = decodeURIComponent(String(input || "").trim());
  if (!decoded) return "Shop Category";
  return decoded
    .replace(/[-_]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function resolveCategoryContextFromPath(
  pathname: string,
  categoryNames: string[] | undefined,
): ShopCategoryContext {
  const match = pathname.match(/^\/shop\/category\/([^/?#]+)/);
  if (!match) return null;

  const rawSlug = decodeURIComponent(match[1]);
  const wantedSlug = toShopCategorySlug(rawSlug);

  for (const name of categoryNames ?? []) {
    if (toShopCategorySlug(name) === wantedSlug) {
      return { name, slug: wantedSlug };
    }
  }

  return {
    name: humanizeCategorySlug(rawSlug),
    slug: wantedSlug,
  };
}

function syncCategoryNamesWithOptions(
  categories: string[],
  categoryNames: string[] | undefined,
): string[] {
  if (!categoryNames?.length) return categories;
  return dedupeShopFilterValues(
    categories.map((cat) => {
      const slug = toShopCategorySlug(cat);
      const match = categoryNames.find((n) => toShopCategorySlug(n) === slug);
      return match || cat;
    }),
  );
}

const defaultShopBanner = {
  title: "",
  subtitle: "",
  centerImage: "",
  leftImage: "",
  rightImage: "",
  isActive: true,
};

export default function ShopClient() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(
    null,
  );
  const [storefrontSettings, setStorefrontSettings] =
    useState<StorefrontSettings | null>(null);
  const { isFilterOpen, openFilterPanel, closeFilterPanel, toggleFilterPanel } =
    useShopFilterPanel();

  const categoryContext = useMemo(
    () => resolveCategoryContextFromPath(pathname, filterOptions?.categories),
    [pathname, filterOptions?.categories],
  );

  const [filters, setFilters] = useState(() =>
    parseShopFiltersFromUrl(searchParams, null),
  );

  const searchParamsKey = searchParams.toString();

  useEffect(() => {
    const parsed = parseShopFiltersFromUrl(searchParams, categoryContext);
    setFilters({
      ...parsed,
      categories: syncCategoryNamesWithOptions(
        parsed.categories,
        filterOptions?.categories,
      ),
    });
  }, [
    searchParamsKey,
    searchParams,
    categoryContext,
    filterOptions?.categories,
  ]);

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
        categories: filters.categories,
        fabrics: filters.fabrics,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        ratings: filters.ratings,
        sort: filters.sort,
        search: filters.search,
        isFeatured: filters.isFeatured,
      }),
    [filters],
  );

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await productApi.getFilterOptions(
          categoryContext?.name ?
            { category: categoryContext.name }
          : undefined,
        );
        setFilterOptions(res.data as FilterOptions);
      } catch {
        // silent fail
      }
    };
    fetchFilters();
  }, [categoryContext?.name]);

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
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
  } = useInfiniteQuery({
    queryKey: ["shop-products", "v2", queryKey],
    queryFn: async ({ pageParam }) => {
      const pg = pageParam as number;
      const { mode, params } = buildShopProductQueryParams(
        filters,
        pg,
        SHOP_PAGE_LIMIT,
        categoryContext,
      );

      if (mode === "search") {
        try {
          return await productApi.search(params);
        } catch {
          // Fallback to basic listing if advanced search fails
        }
      }

      return productApi.getAll(params);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      getNextNumericPage(lastPage, allPages, SHOP_PAGE_LIMIT),
    // 5-min cache keeps random page-1 stable within a tab; new visit = new $sample
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => {
      if (!previousData?.pages?.length) return previousData;
      // Keep only page 1 while filters change — avoids stale multi-page scroll state.
      return {
        ...previousData,
        pages: previousData.pages.slice(0, 1),
        pageParams: previousData.pageParams.slice(0, 1),
      };
    },
  });

  // Flatten pages in deterministic order.
  const products = useMemo(() => {
    return (data?.pages ?? []).flatMap(
      (pg) => (pg.data?.products || []) as Product[],
    );
  }, [data?.pages]);

  const hasLoadedOnceRef = useRef(shopListingHasLoadedOnce);
  useEffect(() => {
    if (products.length > 0 || !isPending) {
      hasLoadedOnceRef.current = true;
      shopListingHasLoadedOnce = true;
    }
  }, [products.length, isPending]);

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
    isPending:
      (isPending && products.length === 0) ||
      (isFetching && !isFetchingNextPage),
    fetchNextPage,
    rootMargin: "1500px 0px",
    threshold: 0,
    enabled: !isPending || products.length > 0,
  });

  const updateFilter = (key: string, value: string | number) => {
    const filterKey = key as keyof typeof filters;
    router.push(
      resolveShopFilterNavigation(filters, filterKey, value, categoryContext),
      { scroll: false },
    );
  };

  const applyPriceFilters = (minPrice: string, maxPrice: string) => {
    const next = { ...filters, minPrice, maxPrice };
    router.push(resolveCanonicalShopUrl(next, categoryContext), {
      scroll: false,
    });
  };

  const categoryLabel = formatShopCategoriesLabel(filters.categories);
  const fabricLabel = formatShopFabricsLabel(filters.fabrics);

  const clearFilters = () => {
    const { path } = resolveClearShopFiltersNavigation();
    router.replace(path, { scroll: false });
  };

  const activeFilterCount = countActiveShopFilters(filters, categoryContext);
  const showClearFilters = shouldShowClearShopFilters(filters, categoryContext);
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
    categoryName: categoryLabel || categoryContext?.name,
    categoryDescription: categoryContext?.description,
    search: filters.search,
    fabric: fabricLabel,
    isFeatured: filters.isFeatured,
    bannerTitle: shopBanner.title,
  });
  const headingText = resolveShopListHeading({
    categoryName: categoryLabel || categoryContext?.name,
    search: filters.search,
    fabric: fabricLabel,
    isFeatured: filters.isFeatured,
  });
  const breadcrumbContext = useMemo(() => {
    if (filters.search) return `Search Products: "${searchTitle}"`;
    if (categoryLabel) return categoryLabel;
    if (fabricLabel) return `${fabricLabel} Collection`;
    if (filters.ratings.length) {
      return `${Math.min(...filters.ratings.map(Number))}★ & Above`;
    }
    if (filters.minPrice || filters.maxPrice) return "Price Filter";
    if (filters.isFeatured) return "Featured Products";
    return "All Sarees";
  }, [
    filters.search,
    categoryLabel,
    fabricLabel,
    filters.ratings,
    filters.minPrice,
    filters.maxPrice,
    filters.isFeatured,
    searchTitle,
  ]);
  const productGridClass =
    "grid grid-cols-2 items-stretch gap-y-2 gap-x-1 sm:gap-y-2 sm:gap-x-2 lg:grid-cols-4 lg:gap-x-3 [&>*]:h-full [&>*]:min-h-0";

  const quickFabrics = useMemo(() => {
    const fabrics = filterOptions?.fabrics ?? [];
    return fabrics.slice(0, 5);
  }, [filterOptions?.fabrics]);

  const heroTitle = useMemo(() => {
    if (activeFilterCount > 0 || categoryContext) return headingText;
    return "The Curated Archive";
  }, [activeFilterCount, categoryContext, headingText]);

  const showInitialSkeleton =
    isPending && !hasLoadedOnceRef.current && products.length === 0;

  if (showInitialSkeleton) {
    return <ShopPageSkeleton />;
  }

  const showGridSkeleton =
    isFetchingNextPage === false &&
    isPending &&
    products.length === 0 &&
    hasLoadedOnceRef.current;

  const productCountLabel =
    isLoading ? "Loading…" : formatProductCount(pagination.totalProducts);

  return (
    <div className='bg-white selection:bg-brand-100 selection:text-brand-900'>
      <div className='pb-12 pt-6 sm:pt-8 lg:pb-16 lg:pt-10'>
        <section className='mb-6 px-4 sm:mb-8 sm:px-6 lg:px-8'>
          <div className='mx-auto max-w-7xl'>
            <nav
              aria-label='Breadcrumb'
              className='flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400'
            >
              <Link href='/' className='transition-colors hover:text-[#c5a059]'>
                Home
              </Link>
              <ChevronRight
                className='h-3 w-3 shrink-0 opacity-50'
                aria-hidden
              />
              <Link
                href='/shop'
                className='transition-colors hover:text-[#c5a059]'
              >
                Shop
              </Link>
              <ChevronRight
                className='h-3 w-3 shrink-0 opacity-50'
                aria-hidden
              />
              <span className='truncate normal-case tracking-normal text-gray-600'>
                {breadcrumbContext}
              </span>
            </nav>

            <h1 className='mt-3 line-clamp-2 font-serif text-2xl font-medium italic leading-tight tracking-tight text-[#c5a059] sm:mt-4 sm:text-3xl lg:text-4xl'>
              <span className='sr-only'>{heroContent.h1Accessible}</span>
              <span aria-hidden='true'>{heroTitle}</span>
            </h1>
          </div>
        </section>

        <ShopFilterBar
          filters={filters}
          filterOptions={filterOptions}
          activeFilterCount={activeFilterCount}
          showClearFilters={showClearFilters}
          isFilterOpen={isFilterOpen}
          onOpenFilter={openFilterPanel}
          onCloseFilter={closeFilterPanel}
          onToggleFilter={toggleFilterPanel}
          onUpdateFilter={updateFilter}
          onClearFilters={clearFilters}
          onApplyPriceFilters={applyPriceFilters}
          quickFabrics={quickFabrics}
          productCountLabel={productCountLabel}
        />

        <section className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          {showGridSkeleton ?
            <div className={productGridClass}>
              {Array.from({ length: 8 }).map((_, i) => (
                <ShopCollectionCardSkeleton key={i} />
              ))}
            </div>
          : !isPending && (isError || products.length === 0) ?
            <div className='flex min-h-[420px] flex-col items-start justify-start border border-gray-100 bg-white px-6 pt-10 sm:min-h-[460px]'>
              <p className='mb-4 text-lg text-gray-700'>
                {isError ?
                  "Something went wrong loading products. Try again or adjust filters."
                : "No products found matching your filters."}
              </p>
              <Button type='button' variant='brand' onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          : <>
              <ProductInfiniteGrid
                gridClassName={productGridClass}
                items={products}
                getItemKey={(p) => p._id}
                renderItem={(product) => (
                  <ShopCollectionCard product={product} />
                )}
                isInitialLoading={false}
                isFetchingNextPage={isFetchingNextPage}
                hasNextPage={Boolean(hasNextPage)}
                pageSize={SHOP_PAGE_LIMIT}
                loadMoreSkeletonCount={4}
                sentinelRef={sentinelRef}
                renderSkeleton={() => <ShopCollectionCardSkeleton />}
                endMessage={undefined}
              />

              {hasNextPage && !isFetchingNextPage && (
                <div className='mt-16 flex justify-center sm:mt-20'>
                  <button
                    type='button'
                    onClick={() => fetchNextPage()}
                    className='group relative overflow-hidden border border-navy-900 px-10 py-3.5 transition-all duration-500 sm:px-12 sm:py-4'
                  >
                    <span className='relative z-10 text-[11px] font-semibold uppercase tracking-[0.2em] text-navy-900 transition-colors duration-500 group-hover:text-white'>
                      Discover More
                    </span>
                    <div className='absolute inset-0 translate-y-full bg-navy-900 transition-transform duration-500 ease-out group-hover:translate-y-0' />
                  </button>
                </div>
              )}
            </>
          }
        </section>
      </div>
    </div>
  );
}
