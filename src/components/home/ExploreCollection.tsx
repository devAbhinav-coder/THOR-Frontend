"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { productApi } from "@/lib/api";
import { Product } from "@/types";
import ProductCard from "@/components/product/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/SkeletonLoader";

const EXPLORE_PAGE_LIMIT = 8;

/**
 * ExploreCollection — truly random, no duplicates, infinite scroll.
 *
 * Strategy:
 *  - Every page fetch calls $sample on the backend with `excludeIds` = all
 *    product IDs already loaded.
 *  - The `pageParam` carries the accumulated comma-separated exclude list so
 *    React Query stores the state cleanly in its cache (no ref mutation inside
 *    queryFn which is an anti-pattern).
 *  - `hasNextPage` is driven by the backend's `remaining` count (total minus
 *    excludeIds), so we stop fetching when the catalog is exhausted.
 */
export default function ExploreCollection() {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
    isPending,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["home-explore-collection"],
    queryFn: ({ pageParam }) =>
      productApi.getAll({
        limit: EXPLORE_PAGE_LIMIT,
        isRandom: "true",
        // pageParam holds all IDs seen so far (empty string on first call)
        ...(pageParam ? { excludeIds: pageParam as string } : {}),
      }),
    // First call: no excludeIds
    initialPageParam: "",
    getNextPageParam: (lastPage, allPages) => {
      // Stop if backend says no next page
      if (lastPage.pagination?.hasNextPage === false) return undefined;
      if (!lastPage.pagination?.hasNextPage && lastPage.pagination?.totalPages === 1) {
        return undefined;
      }
      // Build the full exclude list from all loaded products
      const seenIds = allPages
        .flatMap((pg) => (pg.data?.products || []) as Product[])
        .map((p) => p._id)
        .join(",");
      return seenIds || undefined;
    },
    // 5-min cache keeps results stable within the same tab session
    staleTime: 5 * 60 * 1000,
  });

  // Flatten all pages — no duplicates possible since backend uses excludeIds
  const products = (data?.pages ?? []).flatMap(
    (pg) => (pg.data?.products || []) as Product[],
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries[0]?.isIntersecting;
        if (hit && hasNextPage && !isFetchingNextPage && !isPending) {
          void fetchNextPage();
        }
      },
      { root: null, rootMargin: "480px 0px", threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isPending, products.length]);

  if (!isLoading && products.length === 0) return null;

  return (
    <section className='py-10 bg-white'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='mb-10 text-center'>
          <div className='inline-flex items-center gap-3 text-brand-600'>
            <span className='h-px w-12 bg-brand-200 sm:w-16' />
            <p className='font-semibold uppercase tracking-[0.22em] text-[11px] sm:text-xs'>
              Just Dropped
            </p>
            <span className='h-px w-12 bg-brand-200 sm:w-16' />
          </div>
          <h2 className='mt-3 text-3xl sm:text-5xl font-serif text-navy-900'>
            Explore the Collection
          </h2>
          <p className='text-sm text-gray-500 mt-3 max-w-2xl mx-auto'>
            Fresh picks across categories — curated to feel premium, minimal, and
            easy to shop.
          </p>
        </div>

        <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 items-stretch [&>*]:h-full [&>*]:min-h-0'>
          {isLoading && products.length === 0 ?
            [...Array(EXPLORE_PAGE_LIMIT)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))
          : products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))
          }
          {isFetchingNextPage &&
            [...Array(4)].map((_, i) => (
              <ProductCardSkeleton key={`more-${i}`} />
            ))}
        </div>

        <div
          ref={sentinelRef}
          className='h-10 w-full shrink-0 mt-2'
          aria-hidden
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
