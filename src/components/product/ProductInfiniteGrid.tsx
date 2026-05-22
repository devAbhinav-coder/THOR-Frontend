"use client";

import type { ReactNode, RefCallback, RefObject } from "react";
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
  sentinelRef: RefObject<HTMLDivElement | null> | RefCallback<HTMLDivElement | null>;
  renderSkeleton?: () => ReactNode;
  endMessage?: string;
};

/**
 * Product grid with inline append skeletons so scroll height grows before the user
 * reaches empty space below the last row (fixes fast-scroll overscroll gap).
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
  sentinelRef,
  renderSkeleton,
  endMessage,
}: ProductInfiniteGridProps<T>) {
  const skeletonCount = loadMoreSkeletonCount ?? pageSize;
  const Skeleton = renderSkeleton ?? (() => <ProductCardSkeleton />);

  return (
    <>
      <div className={gridClassName}>
        {isInitialLoading && items.length === 0 ?
          Array.from({ length: pageSize }).map((_, i) => (
            <Skeleton key={`initial-${i}`} />
          ))
        : items.map((item) => (
            <div key={getItemKey(item)} className='h-full min-h-0'>
              {renderItem(item)}
            </div>
          ))
        }
        {isFetchingNextPage ?
          Array.from({ length: skeletonCount }).map((_, i) => (
            <Skeleton key={`more-${items.length}-${i}`} />
          ))
        : null}
      </div>

      {(hasNextPage || isFetchingNextPage) && (
        <div
          ref={sentinelRef}
          className='h-px w-full shrink-0'
          aria-hidden
        />
      )}

      {!hasNextPage && !isFetchingNextPage && items.length > 0 && endMessage ?
        <p
          data-nosnippet
          className='mt-8 text-center text-sm text-gray-500'
          aria-hidden='true'
        >
          {endMessage}
        </p>
      : null}
    </>
  );
}
