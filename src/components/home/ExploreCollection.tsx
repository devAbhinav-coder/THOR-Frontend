"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { productApi } from "@/lib/api";
import { Product } from "@/types";
import ProductCard from "@/components/product/ProductCard";
import { ProductInfiniteGrid } from "@/components/product/ProductInfiniteGrid";
import { useInfiniteScrollTrigger } from "@/hooks/useInfiniteScrollTrigger";
import { getNextExcludeIdsParam } from "@/lib/infiniteScrollPagination";
import { cn } from "@/lib/utils";
import HomeSectionHeader from "@/components/home/HomeSectionHeader";
import { homeSectionStyles } from "@/lib/homeSectionStyles";

const EXPLORE_PAGE_LIMIT = 8;

/**
 * ExploreCollection — random storefront sample with excludeIds cursor.
 * Backend returns explicit hasNextPage based on remaining pool size.
 */
export default function ExploreCollection() {
  const {
    data,
    isLoading,
    isPending,
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

  const { sentinelRef } = useInfiniteScrollTrigger({
    hasNextPage: Boolean(hasNextPage),
    isFetchingNextPage,
    isPending: isPending && products.length === 0,
    fetchNextPage,
    rootMargin: "400px 0px",
    enabled: !isLoading,
  });

  if (!isLoading && products.length === 0) return null;

  return (
    <section className={cn(homeSectionStyles.pageBg, homeSectionStyles.sectionPad)} style={{ contain: "layout" }}>
      <div className={homeSectionStyles.container}>
        <div className='mb-10'>
          <HomeSectionHeader
            eyebrow='Just Dropped'
            title='Explore the Collection'
            subtitle='Discover sarees that beautifully blend tradition with modern elegance.'
          />
        </div>

        <ProductInfiniteGrid
          gridClassName='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 items-stretch [&>*]:h-full [&>*]:min-h-0'
          items={products}
          getItemKey={(p) => p._id}
          renderItem={(product) => <ProductCard product={product} />}
          isInitialLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={Boolean(hasNextPage)}
          pageSize={EXPLORE_PAGE_LIMIT}
          sentinelRef={sentinelRef}
        />

        <div className='mt-10 text-center'>
          <Link
            href='/shop'
            className='inline-flex items-center gap-2 px-6 py-3 border-2 border-brand-600 text-brand-600 rounded-lg font-medium hover:bg-brand-50 transition-colors'
          >
            Explore the Collection <ArrowRight className='h-4 w-4' />
          </Link>
        </div>
      </div>
    </section>
  );
}
