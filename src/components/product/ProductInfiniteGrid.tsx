"use client";

import { useEffect, useRef, useState, type ReactNode, type RefCallback, type RefObject } from "react";
import { ProductCardSkeleton } from "@/components/ui/SkeletonLoader";

type ProductInfiniteGridProps<T> = {
  gridClassName: string;
  items: T[];
  getItemKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  isInitialLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  pageSize: number;
  loadMoreSkeletonCount?: number;
  /** Increment when sentinel fires — shows tail skeletons before network starts. */
  loadMoreSignal?: number;
  sentinelRef: RefObject<HTMLDivElement | null> | RefCallback<HTMLDivElement | null>;
  renderSkeleton?: () => ReactNode;
  endMessage?: string;
};

/**
 * Product grid with tail skeletons that stay until new items append (no blank flash).
 */
export function ProductInfiniteGrid<T>({
  gridClassName,
  items,
  getItemKey,
  renderItem,
  isInitialLoading,
  isFetchingNextPage,
  hasNextPage,
  pageSize,
  loadMoreSkeletonCount,
  loadMoreSignal = 0,
  sentinelRef,
  renderSkeleton,
  endMessage,
}: ProductInfiniteGridProps<T>) {
  const skeletonCount = loadMoreSkeletonCount ?? pageSize;
  const Skeleton = renderSkeleton ?? (() => <ProductCardSkeleton />);

  const itemCountRef = useRef(items.length);
  const baselineCountRef = useRef(0);
  const [tailSkeletons, setTailSkeletons] = useState(false);

  useEffect(() => {
    itemCountRef.current = items.length;
  }, [items.length]);

  /** Sentinel fired — reserve tail space immediately (before isFetchingNextPage flips). */
  useEffect(() => {
    if (loadMoreSignal <= 0) return;
    baselineCountRef.current = itemCountRef.current;
    setTailSkeletons(true);
  }, [loadMoreSignal]);

  /** Network started loading the next page. */
  useEffect(() => {
    if (!isFetchingNextPage) return;
    baselineCountRef.current = itemCountRef.current;
    setTailSkeletons(true);
  }, [isFetchingNextPage]);

  /** New items appended — drop tail skeletons. */
  useEffect(() => {
    if (!tailSkeletons) return;
    if (items.length > baselineCountRef.current) {
      setTailSkeletons(false);
    }
  }, [items.length, tailSkeletons]);

  /** Filter reset / shorter list — clear stale tail state. */
  useEffect(() => {
    if (items.length < baselineCountRef.current) {
      setTailSkeletons(false);
    }
  }, [items.length]);

  /** Fetch finished with no growth (error or end) — release tail quickly. */
  useEffect(() => {
    if (!tailSkeletons || isFetchingNextPage) return;

    if (items.length > baselineCountRef.current) {
      setTailSkeletons(false);
      return;
    }

    if (!hasNextPage) {
      setTailSkeletons(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setTailSkeletons(false);
    }, 200);

    return () => window.clearTimeout(timer);
  }, [tailSkeletons, isFetchingNextPage, hasNextPage, items.length]);

  const showTailSkeletons =
    hasNextPage && (isFetchingNextPage || tailSkeletons);

  const dedupedItems = (() => {
    const seen = new Set<string>();
    return items.filter((item) => {
      const key = getItemKey(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  })();

  return (
    <>
      <div className={gridClassName}>
        {isInitialLoading && items.length === 0 ?
          Array.from({ length: pageSize }).map((_, i) => (
            <Skeleton key={`initial-${i}`} />
          ))
        : dedupedItems.map((item) => (
            <div key={getItemKey(item)} className="h-full min-h-0">
              {renderItem(item)}
            </div>
          ))
        }
        {showTailSkeletons ?
          Array.from({ length: skeletonCount }).map((_, i) => (
            <Skeleton key={`more-${items.length}-${i}`} />
          ))
        : null}
      </div>

      {(hasNextPage || showTailSkeletons) && (
        <div
          ref={sentinelRef}
          className="h-px w-full shrink-0"
          aria-hidden
        />
      )}

      {!hasNextPage && !showTailSkeletons && items.length > 0 && endMessage ?
        <p
          data-nosnippet
          className="mt-8 text-center text-sm text-gray-500"
          aria-hidden="true"
        >
          {endMessage}
        </p>
      : null}
    </>
  );
}
