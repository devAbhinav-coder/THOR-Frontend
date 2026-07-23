"use client";

import { useState, useEffect, useMemo, useRef, useTransition, useCallback } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { productApi, storefrontApi, categoryApi, navigationApi } from "@/lib/api";
import { Product, Category, FilterOptions, FilterCategoryTreeItem, StorefrontSettings } from "@/types";
import { Button } from "@/components/ui/button";
import ShopProductsSkeleton from "@/components/shop/ShopPageSkeleton";
import ShopCollectionCard from "@/components/shop/ShopCollectionCard";
import ShopCollectionCardSkeleton from "@/components/shop/ShopCollectionCardSkeleton";
import ShopFilterBar, { ShopFilterPanel, ShopSortDropdown } from "@/components/shop/ShopFilterBar";
import CouponStrip from "@/components/coupons/CouponStrip";
import ShopCategoryPills from "@/components/shop/ShopCategoryPills";
import ShopSearchIntentChips from "@/components/shop/ShopSearchIntentChips";
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
  resolveNextShopFilters,
  resolveCanonicalShopUrl,
  shouldShowClearShopFilters,
  dedupeShopFilterValues,
  formatShopCategoriesLabel,
  formatShopColorsLabel,
  isShopCategoryFilterSelected,
  resolveShopPriceDraft,
  shopPriceDraftToFilterStrings,
} from "@/lib/shopFilters";
import { dedupeCatalogLabels } from "@/lib/catalogAttributes";
import {
  mergeFabricOptions,
  mergeOccasionOptions,
} from "@/lib/productCatalogOptions";
import type { ParsedSearchIntent } from "@/lib/searchQueryParser";
import { ProductInfiniteGrid } from "@/components/product/ProductInfiniteGrid";
import { useShopFilterPanel } from "@/components/shop/ShopFilterPanelContext";
import { expandProductsForShopListing } from "@/lib/shopProductListing";
import { isShopCatalogCategory } from "@/lib/categoryFilters";
import { GIFTING_HREF, SHOP_SALE_HREF } from "@/lib/shopSpecialCollections";
import {
  SHOP_LOAD_MORE_SKELETON_COUNT,
  SHOP_PRODUCT_GRID_CLASS,
} from "@/lib/shopLayout";

function buildShopCategoryTree(
  megaMenuCategories: Array<{
    name: string;
    slug: string;
    subcategories?: Array<{ name: string; slug: string; productCount?: number }>;
  }>,
  productCategories: string[],
  productSubcategories: string[],
): FilterCategoryTreeItem[] {
  const productCatSet = new Set(productCategories.map((c) => c.toLowerCase()));
  const productSubSet = new Set(productSubcategories.map((s) => s.toLowerCase()));

  return megaMenuCategories
    .filter(
      (cat) =>
        productCatSet.size === 0 ||
        productCatSet.has(cat.name.toLowerCase()) ||
        (cat.subcategories ?? []).some((sub) =>
          productSubSet.has(sub.name.toLowerCase()),
        ),
    )
    .map((cat) => ({
      name: cat.name,
      slug: cat.slug,
      subcategories: (cat.subcategories ?? [])
        .filter(
          (sub) =>
            (sub.productCount ?? 0) > 0 ||
            productSubSet.size === 0 ||
            productSubSet.has(sub.name.toLowerCase()),
        )
        .map((sub) => ({ name: sub.name, slug: sub.slug })),
    }))
    .filter(
      (cat) =>
        cat.subcategories.length > 0 ||
        productCatSet.size === 0 ||
        productCatSet.has(cat.name.toLowerCase()),
    );
}

function formatProductCount(n: number): string {
  const total = Math.max(0, Number(n) || 0);
  return `${total} ${total === 1 ? "product" : "products"}`;
}

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
  const match = pathname.match(/^\/shop\/(?:category|collections)\/([^/?#]+)(?:\/([^/?#]+))?/);
  if (!match) return null;

  const rawCatSlug = decodeURIComponent(match[1]);
  const rawSubSlug = match[2] ? decodeURIComponent(match[2]) : undefined;
  
  const wantedCatSlug = toShopCategorySlug(rawCatSlug);
  let name = humanizeCategorySlug(rawCatSlug);

  for (const n of categoryNames ?? []) {
    if (toShopCategorySlug(n) === wantedCatSlug) {
      name = n;
      break;
    }
  }

  if (rawSubSlug) {
    const subName = humanizeCategorySlug(rawSubSlug);
    return {
      name,
      slug: wantedCatSlug,
      subcategory: { name: subName, slug: rawSubSlug }
    };
  }

  return {
    name,
    slug: wantedCatSlug,
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

export default function ShopClient({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { isFilterOpen, openFilterPanel, closeFilterPanel, toggleFilterPanel } =
    useShopFilterPanel();

  const pathCategoryContext = useMemo(
    () => resolveCategoryContextFromPath(pathname, undefined),
    [pathname],
  );

  const { data: filterOptionsData } = useQuery({
    queryKey: ["shop-filter-options", pathCategoryContext?.name ?? "all"],
    queryFn: async () => {
      const res = await productApi.getFilterOptions(
        pathCategoryContext?.name ?
          { category: pathCategoryContext.name }
        : undefined,
      );
      return res.data as FilterOptions;
    },
    staleTime: 5 * 60 * 1000,
  });

  const filterOptions = useMemo((): FilterOptions | null => {
    if (!filterOptionsData) return null;
    return {
      ...filterOptionsData,
      colors: dedupeCatalogLabels(filterOptionsData.colors ?? []),
      fabrics: mergeFabricOptions(filterOptionsData.fabrics ?? []),
    };
  }, [filterOptionsData]);

  const { data: megaMenuData } = useQuery({
    queryKey: ["shop-mega-menu"],
    queryFn: async () => {
      const res = await navigationApi.getMegaMenu();
      return res.data?.categories ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const categoryTree = useMemo(() => {
    if (filterOptions?.categoryTree?.length) return filterOptions.categoryTree;
    if (!megaMenuData?.length) return [];
    return buildShopCategoryTree(
      megaMenuData,
      filterOptions?.categories ?? [],
      filterOptions?.subcategories ?? [],
    );
  }, [
    filterOptions?.categoryTree,
    filterOptions?.categories,
    filterOptions?.subcategories,
    megaMenuData,
  ]);

  const occasionOptions = useMemo(
    () => mergeOccasionOptions(filterOptions?.occasions ?? []),
    [filterOptions?.occasions],
  );

  const [, startFilterTransition] = useTransition();
  const categoryContext = useMemo(() => {
    const ctx = resolveCategoryContextFromPath(pathname, filterOptions?.categories);
    if (!ctx?.subcategory || !categoryTree.length) return ctx;
    for (const cat of categoryTree) {
      if (toShopCategorySlug(cat.name) !== ctx.slug) continue;
      const subMatch = cat.subcategories.find(
        (s) =>
          s.slug === ctx.subcategory!.slug ||
          toShopCategorySlug(s.name) === toShopCategorySlug(ctx.subcategory!.slug),
      );
      if (subMatch) {
        return {
          ...ctx,
          subcategory: { name: subMatch.name, slug: subMatch.slug },
        };
      }
    }
    return ctx;
  }, [pathname, filterOptions?.categories, categoryTree]);

  const [storefrontSettings, setStorefrontSettings] =
    useState<StorefrontSettings | null>(null);

  const [filters, setFilters] = useState(() =>
    parseShopFiltersFromUrl(searchParams, null),
  );

  const [draftMinPrice, setDraftMinPrice] = useState(filters.minPrice);
  const [draftMaxPrice, setDraftMaxPrice] = useState(filters.maxPrice);

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
    setDraftMinPrice(parsed.minPrice);
    setDraftMaxPrice(parsed.maxPrice);
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

  const productQueryKey = useMemo(
    () =>
      JSON.stringify({
        routeCategory: categoryContext?.slug ?? "",
        routeSubcategory: categoryContext?.subcategory?.slug ?? "",
        categories: filters.categories,
        subcategories: filters.subcategories,
        occasions: filters.occasions,
        fabrics: filters.fabrics,
        colors: filters.colors,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        ratings: filters.ratings,
        sort: filters.sort,
        search: filters.search,
        isFeatured: filters.isFeatured,
        onSale: filters.onSale,
        hasOffer: filters.hasOffer,
      }),
    [filters, categoryContext],
  );

  useEffect(() => {
    storefrontApi
      .getSettings()
      .then((res) => setStorefrontSettings(res.data?.settings || null))
      .catch(() => {});
  }, []);

  const { data: categoriesData } = useQuery({
    queryKey: ["shop-categories-list"],
    queryFn: () => categoryApi.getAll({ active: true }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: subcategoriesData } = useQuery({
    queryKey: ["shop-subcategories-list", categoryContext?.slug],
    queryFn: () => categoryApi.getSubcategories(categoryContext!.slug),
    enabled: Boolean(categoryContext?.slug),
    staleTime: 5 * 60 * 1000,
  });

  const categoryPills = useMemo(() => {
    if (categoryContext?.slug && subcategoriesData?.data?.subcategories) {
      return subcategoriesData.data.subcategories.map((sub: any) => ({
        name: sub.name,
        href: `/shop/collections/${encodeURIComponent(categoryContext.slug)}/${encodeURIComponent(sub.slug)}`,
        isActive: false
      }));
    } else if (!categoryContext?.slug && categoriesData?.data?.categories) {
      const catalogPills = categoriesData.data.categories
        .filter(isShopCatalogCategory)
        .map((cat: Category) => ({
          name: cat.name,
          href: `/shop/collections/${encodeURIComponent(cat.slug)}`,
          isActive: isShopCategoryFilterSelected(filters.categories, cat.name),
        }));

      return [
        {
          name: "Sale",
          href: SHOP_SALE_HREF,
          isActive: filters.onSale === "true",
        },
        ...catalogPills,
        {
          name: "Gifting",
          href: GIFTING_HREF,
          isActive: false,
        },
      ];
    }
    return [];
  }, [categoryContext, subcategoriesData, categoriesData, filters.categories, filters.onSale]);

  useEffect(() => {
    if (!filterOptions?.categories?.length) return;
    const id = window.setTimeout(() => {
      filterOptions.categories.forEach((cat) => {
        const slug = toShopCategorySlug(cat);
        if (!slug) return;
        router.prefetch(`/shop/collections/${encodeURIComponent(slug)}`);
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
    queryKey: ["shop-products", "v2", productQueryKey],
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
    placeholderData: (previousData, previousQuery) => {
      if (!previousData?.pages?.length) return previousData;

      const prevKeyRaw = previousQuery?.queryKey?.[2];
      if (typeof prevKeyRaw === "string" && prevKeyRaw !== productQueryKey) {
        try {
          const prev = JSON.parse(prevKeyRaw) as {
            routeCategory?: string;
            routeSubcategory?: string;
          };
          const curr = JSON.parse(productQueryKey) as {
            routeCategory?: string;
            routeSubcategory?: string;
          };
          if (
            prev.routeCategory !== curr.routeCategory ||
            prev.routeSubcategory !== curr.routeSubcategory
          ) {
            return undefined;
          }
        } catch {
          /* keep previous placeholder on parse failure */
        }
      }

      // Keep only page 1 while filters change — avoids stale multi-page scroll state.
      return {
        ...previousData,
        pages: previousData.pages.slice(0, 1),
        pageParams: previousData.pageParams.slice(0, 1),
      };
    },
  });

  const products = useMemo(() => {
    const raw = (data?.pages ?? []).flatMap(
      (pg) => (pg.data?.products || []) as Product[],
    );
    const seen = new Set<string>();
    const deduplicated: Product[] = [];
    for (const p of raw) {
      if (!seen.has(p._id)) {
        seen.add(p._id);
        deduplicated.push(p);
      }
    }
    return deduplicated;
  }, [data?.pages]);

  const listingEntries = useMemo(
    () => expandProductsForShopListing(products),
    [products],
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

  const searchIntent = useMemo((): ParsedSearchIntent | null => {
    const first = data?.pages?.[0]?.data as
      | { searchIntent?: ParsedSearchIntent }
      | undefined;
    return first?.searchIntent ?? null;
  }, [data?.pages]);

  const { sentinelRef } = useInfiniteScrollTrigger({
    hasNextPage: Boolean(hasNextPage),
    isFetchingNextPage,
    isPending: isPending && products.length === 0,
    fetchNextPage,
    rootMargin: "600px 0px",
    threshold: 0,
    enabled: true,
  });

  const applyColor = useCallback(
    (color: string) => {
      const next = resolveNextShopFilters(filters, "colors", color);
      const url = resolveCanonicalShopUrl(next, categoryContext);
      router.push(url, { scroll: true });
    },
    [filters, categoryContext, router],
  );

  const pushFilters = useCallback(
    (next: typeof filters) => {
      startFilterTransition(() => {
        router.push(resolveCanonicalShopUrl(next, categoryContext), {
          scroll: false,
        });
      });
    },
    [router, categoryContext, startFilterTransition],
  );

  const updateFilter = useCallback(
    (key: string, value: string | number) => {
      const filterKey = key as keyof typeof filters;
      const next = resolveNextShopFilters(filters, filterKey, value);
      setFilters(next);
      pushFilters(next);
    },
    [filters, pushFilters],
  );

  const applyPriceFilters = useCallback(
    (minPrice: string, maxPrice: string) => {
      const next = { ...filters, minPrice, maxPrice };
      setFilters(next);
      pushFilters(next);
    },
    [filters, pushFilters],
  );

  const handleApplyPriceFilters = () => {
    const { min, max } = resolveShopPriceDraft(draftMinPrice, draftMaxPrice);
    const { minPrice, maxPrice } = shopPriceDraftToFilterStrings(min, max);
    applyPriceFilters(minPrice, maxPrice);
  };

  const categoryLabel = formatShopCategoriesLabel(filters.categories);
  const colorLabel = formatShopColorsLabel(filters.colors);

  const clearFilters = useCallback(() => {
    const { path, filters: cleared } = resolveClearShopFiltersNavigation();
    queryClient.removeQueries({ queryKey: ["shop-products", "v2"] });
    setFilters(cleared);
    setDraftMinPrice("");
    setDraftMaxPrice("");
    startFilterTransition(() => {
      router.replace(path, { scroll: false });
    });
  }, [queryClient, router, startFilterTransition]);

  const activeFilterCount = countActiveShopFilters(filters, categoryContext);
  const showClearFilters = shouldShowClearShopFilters(filters, categoryContext);
  const searchTitle =
    filters.search.length > 48 ?
      `${filters.search.slice(0, 48)}...`
    : filters.search;

  const applySearchQuery = (query: string) => {
    router.push(
      resolveCanonicalShopUrl({ ...filters, search: query }, categoryContext),
      { scroll: false },
    );
  };

  const applyIntentCategory = (category: string) => {
    router.push(
      resolveCanonicalShopUrl(
        {
          ...filters,
          categories: dedupeShopFilterValues([...filters.categories, category]),
        },
        categoryContext,
      ),
      { scroll: false },
    );
  };

  const applyIntentMaxPrice = (maxPrice: string) => {
    router.push(
      resolveCanonicalShopUrl({ ...filters, maxPrice }, categoryContext),
      { scroll: false },
    );
  };

  const clearSearchOnly = () => {
    router.push(
      resolveCanonicalShopUrl({ ...filters, search: "" }, categoryContext),
      { scroll: false },
    );
  };
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
    color: colorLabel,
    isFeatured: filters.isFeatured,
    onSale: filters.onSale,
    bannerTitle: shopBanner.title,
  });
  const headingText = resolveShopListHeading({
    categoryName: categoryLabel || categoryContext?.name,
    search: filters.search,
    color: colorLabel,
    isFeatured: filters.isFeatured,
    onSale: filters.onSale,
  });

  const breadcrumbContext = useMemo(() => {
    if (filters.search) return `Search Products: "${searchTitle}"`;
    if (categoryLabel) return categoryLabel;
    if (colorLabel) return `${colorLabel} Collection`;
    if (filters.ratings.length) {
      return `${Math.min(...filters.ratings.map(Number))}★ & Above`;
    }
    if (filters.minPrice || filters.maxPrice) return "Price Filter";
    if (filters.isFeatured) return "Featured Products";
    if (filters.onSale === "true") return "On Sale";
    if (filters.hasOffer === "true") return "Coupon Offers";
    return "All Collections";
  }, [
    filters.search,
    categoryLabel,
    colorLabel,
    filters.ratings,
    filters.minPrice,
    filters.maxPrice,
    filters.isFeatured,
    filters.onSale,
    filters.hasOffer,
    searchTitle,
  ]);
  const productGridClass = SHOP_PRODUCT_GRID_CLASS;

  const quickColors = useMemo(() => {
    const colors = dedupeCatalogLabels(filterOptions?.colors ?? []);
    return colors.slice(0, 5);
  }, [filterOptions?.colors]);

  const heroTitle = useMemo(() => {
    if (activeFilterCount > 0 || categoryContext) return headingText;
    return "The Curated Archive";
  }, [activeFilterCount, categoryContext, headingText]);

  const showProductsSkeleton =
    !isFetchingNextPage && isPending && products.length === 0;

  const productCountLabel =
    isLoading ? "Loading…" : formatProductCount(pagination.totalProducts);

  return (
    <div className='bg-white selection:bg-brand-100 selection:text-brand-900'>
      <div className='pb-[calc(3.25rem+env(safe-area-inset-bottom,0px)+2rem)] pt-3 sm:pb-12 sm:pt-4 lg:pb-16 lg:pt-5'>
        <section className='mb-2 px-4 sm:mb-2.5 sm:px-6 lg:px-8'>
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
                href='/shop/collections'
                className='transition-colors hover:text-[#c5a059]'
              >
                Shop
              </Link>
              {categoryContext?.subcategory ? (
                <>
                  <ChevronRight
                    className='h-3 w-3 shrink-0 opacity-50'
                    aria-hidden
                  />
                  <Link
                    href={`/shop/collections/${encodeURIComponent(categoryContext.slug)}`}
                    className='transition-colors hover:text-[#c5a059]'
                  >
                    {categoryContext.name}
                  </Link>
                  <ChevronRight
                    className='h-3 w-3 shrink-0 opacity-50'
                    aria-hidden
                  />
                  <span className='truncate normal-case tracking-normal text-gray-600'>
                    {categoryContext.subcategory.name}
                  </span>
                </>
              ) : (
                <>
                  <ChevronRight
                    className='h-3 w-3 shrink-0 opacity-50'
                    aria-hidden
                  />
                  <span className='truncate normal-case tracking-normal text-gray-600'>
                    {breadcrumbContext}
                  </span>
                </>
              )}
            </nav>

            <h1 className='mt-2 line-clamp-2 font-serif text-2xl font-medium italic leading-tight tracking-tight text-[#c5a059] sm:mt-2.5 sm:text-3xl lg:text-4xl'>
              <span className='sr-only'>{heroContent.h1Accessible}</span>
              <span aria-hidden='true'>{heroTitle}</span>
            </h1>

            {filters.search ?
              <ShopSearchIntentChips
                search={filters.search}
                filters={filters}
                searchIntent={searchIntent}
                onApplySearch={applySearchQuery}
                onApplyColor={applyColor}
                onApplyCategory={applyIntentCategory}
                onApplyMaxPrice={applyIntentMaxPrice}
                onClearSearch={clearSearchOnly}
              />
            : null}
          </div>
        </section>

        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-4 sm:mb-6'>
          <CouponStrip title='Shop with offers' />
        </div>

        <ShopFilterBar
          filters={filters}
          filterOptions={filterOptions}
          categoryTree={categoryTree}
          occasionOptions={occasionOptions}
          subcategories={subcategoriesData?.data?.subcategories || []}
          activeFilterCount={activeFilterCount}
          showClearFilters={showClearFilters}
          isFilterOpen={isFilterOpen}
          onOpenFilter={openFilterPanel}
          onCloseFilter={closeFilterPanel}
          onToggleFilter={toggleFilterPanel}
          onUpdateFilter={updateFilter}
          onClearFilters={clearFilters}
          onApplyPriceFilters={applyPriceFilters}
          quickColors={quickColors}
          productCountLabel={productCountLabel}
        />

        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:-mt-1 lg:px-8'>
          <div className='grid grid-cols-1 items-start gap-5 lg:grid-cols-[250px_1fr] lg:gap-8'>
            <aside 
              data-lenis-prevent-vertical 
              className='hidden lg:block lg:sticky lg:top-28 self-start overflow-y-auto max-h-[calc(100vh-7rem)] scrollbar-hide pr-2'
            >
              <div className='flex items-center justify-between pb-4 border-b border-gray-200 mb-6'>
                <h3 className='text-[13px] font-bold uppercase tracking-wider text-navy-900'>Filters</h3>
                {showClearFilters && (
                  <button
                    onClick={clearFilters}
                    className='text-[11px] uppercase font-bold tracking-wider text-[#c5a059] hover:text-[#a68648]'
                  >
                    Clear All
                  </button>
                )}
              </div>
              <ShopFilterPanel
                filters={filters}
                filterOptions={filterOptions}
                categoryTree={categoryTree}
                occasionOptions={occasionOptions}
                subcategories={subcategoriesData?.data?.subcategories || []}
                draftMinPrice={draftMinPrice}
                draftMaxPrice={draftMaxPrice}
                onUpdateFilter={updateFilter}
                onMinPriceChange={setDraftMinPrice}
                onMaxPriceChange={setDraftMaxPrice}
                sidebar={true}
                onApply={handleApplyPriceFilters}
              />
            </aside>

            <section className='min-w-0 flex-1'>
              {children}
              <div className='mb-4 flex flex-col gap-3 sm:mb-5'>
                <div className='hidden lg:flex items-center justify-between border-b border-gray-100 pb-4'>
                  <p className='text-[11px] font-semibold text-gray-500 uppercase tracking-wider'>{productCountLabel}</p>
                  <ShopSortDropdown
                    value={filters.sort}
                    onChange={(next) => updateFilter("sort", next)}
                    hoverCapable={true}
                  />
                </div>
              </div>
              
              {showProductsSkeleton ?
                <ShopProductsSkeleton />
          : !isPending && (isError || products.length === 0) ?
            <div className='flex min-h-[240px] flex-col items-start justify-start border border-gray-100 bg-white px-6 pt-10 sm:min-h-[460px]'>
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
                items={listingEntries}
                getItemKey={(entry) => entry.listKey}
                renderItem={(entry) => (
                  <ShopCollectionCard
                    product={entry.product}
                    displayColor={entry.displayColor}
                    allowImageFallback
                  />
                )}
                isInitialLoading={false}
                isFetchingNextPage={isFetchingNextPage}
                hasNextPage={Boolean(hasNextPage)}
                pageSize={SHOP_PAGE_LIMIT}
                loadMoreSkeletonCount={SHOP_LOAD_MORE_SKELETON_COUNT}
                sentinelRef={sentinelRef}
                renderSkeleton={() => <ShopCollectionCardSkeleton />}
                endMessage="You've reached the end of the collection."
              />
            </>
          }
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
