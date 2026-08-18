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

function parseRootMarginBottom(rootMargin: string): number {
  const parts = rootMargin.trim().split(/\s+/);
  const raw = parts.length >= 3 ? parts[2] : parts[0];
  if (!raw || raw === "0" || raw === "0px") return 0;
  if (raw.endsWith("px")) return Number.parseFloat(raw) || 0;
  if (raw.endsWith("%")) {
    return (Number.parseFloat(raw) / 100) * window.innerHeight;
  }
  return Number.parseFloat(raw) || 0;
}

function isSentinelInLoadZone(node: HTMLDivElement, rootMargin: string): boolean {
  const rect = node.getBoundingClientRect();
  const margin = parseRootMarginBottom(rootMargin);
  return rect.top <= window.innerHeight + margin;
}

/**
 * Callback-ref sentinel so IntersectionObserver attaches when the sentinel mounts.
 * (useRef + useEffect missed the first paint when the sentinel appeared only after page 1 loaded.)
 */
export function useInfiniteScrollTrigger({
  hasNextPage,
  isFetchingNextPage,
  isPending = false,
  fetchNextPage,
  onLoadMoreRequested,
  rootMargin = "280px 0px",
  threshold = 0,
  enabled = true,
}: UseInfiniteScrollTriggerOptions) {
  const ioRef = useRef<IntersectionObserver | null>(null);
  const fetchLockRef = useRef(false);
  const onLoadMoreRequestedRef = useRef(onLoadMoreRequested);
  const sentinelNodeRef = useRef<HTMLDivElement | null>(null);
  const rootMarginRef = useRef(rootMargin);
  /** After a fetch, require sentinel to leave viewport before another load (prevents end-of-list loops). */
  const awaitingSentinelExitRef = useRef(false);

  useEffect(() => {
    onLoadMoreRequestedRef.current = onLoadMoreRequested;
  }, [onLoadMoreRequested]);

  useEffect(() => {
    rootMarginRef.current = rootMargin;
  }, [rootMargin]);

  useEffect(() => {
    if (!hasNextPage) {
      awaitingSentinelExitRef.current = false;
    }
  }, [hasNextPage]);

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

  const requestLoadMore = useCallback(
    (allowOneChain = false) => {
      const s = ioStateRef.current;
      if (!s.hasNextPage || s.isFetchingNextPage || s.isPending) return;
      if (fetchLockRef.current) return;

      fetchLockRef.current = true;
      onLoadMoreRequestedRef.current?.();
      void fetchNextPage()
        .finally(() => {
          fetchLockRef.current = false;
          awaitingSentinelExitRef.current = true;

          if (!allowOneChain) return;

          requestAnimationFrame(() => {
            const latest = ioStateRef.current;
            if (!latest.hasNextPage || latest.isFetchingNextPage || latest.isPending) {
              return;
            }

            const node = sentinelNodeRef.current;
            if (!node || !isSentinelInLoadZone(node, rootMarginRef.current)) {
              return;
            }

            // At most one chained fetch per intersection (fast scroll prefetch).
            requestLoadMore(false);
          });
        });
    },
    [fetchNextPage],
  );

  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      disconnect();
      sentinelNodeRef.current = node;
      awaitingSentinelExitRef.current = false;
      if (!node || !enabled) return;

      const io = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry) return;

          if (!entry.isIntersecting) {
            awaitingSentinelExitRef.current = false;
            return;
          }

          if (awaitingSentinelExitRef.current) return;

          requestLoadMore(true);
        },
        { root: null, rootMargin, threshold },
      );

      io.observe(node);
      ioRef.current = io;
    },
    [disconnect, enabled, requestLoadMore, rootMargin, threshold],
  );

  useEffect(() => () => disconnect(), [disconnect]);

  return { sentinelRef };
}
