"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { productApi } from "@/lib/api";
import { Product } from "@/types";
import ProductCard from "@/components/product/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/SkeletonLoader";

const EXPLORE_PAGE_LIMIT = 8;

function exploreNextPageParam(
  lastPage: Awaited<ReturnType<typeof productApi.getAll>>,
) {
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
    batch.length === EXPLORE_PAGE_LIMIT &&
    total > cur * EXPLORE_PAGE_LIMIT
  ) {
    return cur + 1;
  }
  return undefined;
}

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
        page: pageParam,
        limit: EXPLORE_PAGE_LIMIT,
        sort: "-createdAt",
      }),
    initialPageParam: 1,
    getNextPageParam: exploreNextPageParam,
    staleTime: 60_000,
  });

  const products = useMemo(
    () =>
      (data?.pages ?? []).flatMap(
        (pg) => (pg.data?.products || []) as Product[],
      ),
    [data?.pages],
  );

  useEffect(() => {
    const el = sentinelRef.current;
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
      { root: null, rootMargin: "480px 0px", threshold: 0.01 },
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

  if (!isLoading && products.length === 0) return null;

  return (
    <section className="py-10 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-brand-600 font-medium uppercase tracking-wider text-sm mb-2">
              Just Dropped
            </p>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900">
              Explore the Collection
            </h2>
            <p className="text-sm text-gray-500 mt-2 max-w-xl">
              Fresh picks across categories — curated to feel premium, minimal, and easy to shop.
            </p>
          </div>
          <Link
            href="/shop"
            className="hidden sm:flex items-center gap-1 text-brand-600 hover:text-brand-700 font-medium text-sm transition-colors"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 items-stretch [&>*]:h-full [&>*]:min-h-0">
          {isLoading && products.length === 0 ?
            [...Array(EXPLORE_PAGE_LIMIT)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))
          : products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          {isFetchingNextPage &&
            [...Array(4)].map((_, i) => (
              <ProductCardSkeleton key={`more-${i}`} />
            ))}
        </div>

        <div
          ref={sentinelRef}
          className="h-10 w-full shrink-0 mt-2"
          aria-hidden
        />

        <div className="mt-10 text-center sm:hidden">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-brand-600 text-brand-600 rounded-lg font-medium hover:bg-brand-50 transition-colors"
          >
            View All Products <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
