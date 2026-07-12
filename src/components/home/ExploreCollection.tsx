"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { productApi } from "@/lib/api";
import { Product } from "@/types";
import ShopCollectionCard from "@/components/shop/ShopCollectionCard";
import ShopCollectionCardSkeleton from "@/components/shop/ShopCollectionCardSkeleton";
import { ProductInfiniteGrid } from "@/components/product/ProductInfiniteGrid";
import { useInfiniteScrollTrigger } from "@/hooks/useInfiniteScrollTrigger";
import { getNextExcludeIdsParam } from "@/lib/infiniteScrollPagination";
import { cn } from "@/lib/utils";
import { homeSectionStyles } from "@/lib/homeSectionStyles";
import { expandProductsForShopListing } from "@/lib/shopProductListing";

const EXPLORE_PAGE_LIMIT = 12;

/**
 * ExploreCollection — random storefront sample with excludeIds cursor.
 * Backend returns explicit hasNextPage based on remaining pool size.
 */
export default function ExploreCollection() {
  const {
    data,
    isLoading,
    isPending,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["home-explore-collection", "v2"],
    queryFn: ({ pageParam }) =>
      productApi.getAll({
        limit: EXPLORE_PAGE_LIMIT,
        isRandom: "true",
        ...(pageParam ? { excludeIds: pageParam as string } : {}),
      }),
    initialPageParam: "",
    getNextPageParam: (lastPage, allPages) =>
      getNextExcludeIdsParam(lastPage, allPages, EXPLORE_PAGE_LIMIT),
    staleTime: 5 * 60 * 1000,
  });

  const products = (data?.pages ?? []).flatMap(
    (pg) => (pg.data?.products || []) as Product[],
  );

  const listingEntries = useMemo(
    () => expandProductsForShopListing(products),
    [products],
  );

  const { sentinelRef } = useInfiniteScrollTrigger({
    hasNextPage: Boolean(hasNextPage),
    isFetchingNextPage,
    isPending:
      (isPending && products.length === 0) ||
      (isFetching && !isFetchingNextPage),
    fetchNextPage,
    rootMargin: "500px 0px",
    enabled: !isLoading || products.length > 0,
  });

  if (!isLoading && products.length === 0) return null;

  return (
    <section
      className={cn(homeSectionStyles.pageBg, "py-12 sm:py-16 lg:py-20")}
      style={{ contain: "layout" }}
      aria-labelledby="explore-collection-heading"
    >
      <div className={homeSectionStyles.container}>
        <div className="mb-8 text-center sm:mb-12">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#c5a059] sm:text-xs">
            Curation
          </p>
          <h2
            id="explore-collection-heading"
            className="mt-3 font-serif text-3xl font-medium leading-tight text-navy-900 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]"
          >
            Explore the{" "}
            <span className="italic text-navy-900">Collection</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-gray-500 sm:mt-4 sm:text-base">
            Discover sarees that beautifully blend tradition with modern elegance.
          </p>
        </div>

        <ProductInfiniteGrid
          gridClassName="grid grid-cols-2 items-stretch gap-y-8 gap-x-4 sm:gap-y-10 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8 [&>*]:h-full [&>*]:min-h-0"
          items={listingEntries}
          getItemKey={(entry) => entry.listKey}
          renderItem={(entry) => (
            <ShopCollectionCard
              product={entry.product}
              displayColor={entry.displayColor}
              allowImageFallback
            />
          )}
          isInitialLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={Boolean(hasNextPage)}
          pageSize={EXPLORE_PAGE_LIMIT}
          loadMoreSkeletonCount={4}
          sentinelRef={sentinelRef}
          renderSkeleton={() => <ShopCollectionCardSkeleton />}
        />

        <div className="mt-10 sm:mt-12">
          <Link
            href="/shop"
            className="mx-auto flex w-full max-w-sm items-center justify-center bg-navy-900 px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-white transition-colors hover:bg-navy-800 sm:text-xs"
          >
            Delve Deeper
          </Link>
        </div>
      </div>
    </section>
  );
}
