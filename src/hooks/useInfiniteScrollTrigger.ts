"use client";

import { useCallback, useEffect, useRef } from "react";

type UseInfiniteScrollTriggerOptions = {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  /** Only block IO on the very first load (not background refetches). */
  isPending?: boolean;
  fetchNextPage: () => Promise<unknown>;
  /** Fires as soon as sentinel intersects — use to show tail skeletons early. */
  onLoadMoreRequested?: () => void;
  rootMargin?: string;
  threshold?: number;
  enabled?: boolean;
};

/**
 * Callback-ref sentinel so IntersectionObserver attaches when the sentinel mounts.
 */
export function useInfiniteScrollTrigger({
  hasNextPage,
  isFetchingNextPage,
  isPending = false,
  fetchNextPage,
  onLoadMoreRequested,
  rootMargin = "400px 0px",
  threshold = 0,
  enabled = true,
}: UseInfiniteScrollTriggerOptions) {
  const ioRef = useRef<IntersectionObserver | null>(null);
  const fetchLockRef = useRef(false);
  const fetchNextPageRef = useRef(fetchNextPage);
  const onLoadMoreRequestedRef = useRef(onLoadMoreRequested);

  useEffect(() => {
    fetchNextPageRef.current = fetchNextPage;
  }, [fetchNextPage]);

  useEffect(() => {
    onLoadMoreRequestedRef.current = onLoadMoreRequested;
  }, [onLoadMoreRequested]);

  const ioStateRef = useRef({
    hasNextPage: false,
    isFetchingNextPage: false,
    isPending: true,
  });

  ioStateRef.current = {
    hasNextPage: Boolean(hasNextPage),
    isFetchingNextPage,
    isPending,
  };

  const disconnect = useCallback(() => {
    ioRef.current?.disconnect();
    ioRef.current = null;
  }, []);

  const tryLoadMore = useCallback(() => {
    const s = ioStateRef.current;
    if (!s.hasNextPage || s.isFetchingNextPage || s.isPending) return;
    if (fetchLockRef.current) return;

    fetchLockRef.current = true;
    onLoadMoreRequestedRef.current?.();
    void fetchNextPageRef.current().finally(() => {
      fetchLockRef.current = false;
    });
  }, []);

  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      disconnect();
      if (!node || !enabled) return;

      const io = new IntersectionObserver(
        (entries) => {
          if (!entries[0]?.isIntersecting) return;
          tryLoadMore();
        },
        { root: null, rootMargin, threshold },
      );

      io.observe(node);
      ioRef.current = io;
    },
    [disconnect, enabled, rootMargin, threshold, tryLoadMore],
  );

  useEffect(() => () => disconnect(), [disconnect]);

  return { sentinelRef };
}
