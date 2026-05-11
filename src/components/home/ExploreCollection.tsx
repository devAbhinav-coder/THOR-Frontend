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
  /** Latest query flags for the observer without tearing down / reconnecting IO on every new page (was causing scroll jank with Lenis). */
  const ioStateRef = useRef({
    hasNextPage: false,
    isFetchingNextPage: false,
    isPending: true,
  });
  /** Prevents double `fetchNextPage` in the same frame before React flips `isFetchingNextPage`. */
  const fetchLockRef = useRef(false);

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
      if (
        !lastPage.pagination?.hasNextPage &&
        lastPage.pagination?.totalPages === 1
      ) {
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

  ioStateRef.current = {
    hasNextPage: Boolean(hasNextPage),
    isFetchingNextPage,
    isPending,
  };

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        const s = ioStateRef.current;
        if (!s.hasNextPage || s.isFetchingNextPage || s.isPending) return;
        if (fetchLockRef.current) return;
        fetchLockRef.current = true;
        void fetchNextPage().finally(() => {
          fetchLockRef.current = false;
        });
      },
      /** Tighter margin = fewer premature loads while still prefetching — less layout churn during Lenis scroll. */
      { root: null, rootMargin: "220px 0px", threshold: 0 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [fetchNextPage]);

  if (!isLoading && products.length === 0) return null;

  return (
    <section className='py-10 bg-[#FAF9F6]' style={{ contain: "layout" }}>
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
            Discover sarees that beautifully blend tradition with modern
            elegance.
          </p>
        </div>

        <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 items-stretch [&>*]:h-full [&>*]:min-h-0'>
          {isLoading && products.length === 0 ?
            [...Array(EXPLORE_PAGE_LIMIT)].map((_, i) => (
              <ProductCardSkeleton key={`first-${i}`} />
            ))
          : products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))
          }
          {/* Append-shimmer: same skeleton card as the initial grid so the section keeps a uniform array of cards while the next page is fetched (no centered "Loading more…" jump). */}
          {isFetchingNextPage ?
            [...Array(EXPLORE_PAGE_LIMIT)].map((_, i) => (
              <ProductCardSkeleton key={`more-${products.length}-${i}`} />
            ))
          : null}
        </div>

        <div
          ref={sentinelRef}
          className='h-8 w-full shrink-0 mt-2'
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
