"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UseInfiniteScrollTriggerOptions = {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  /** Only block IO on the very first load (not background refetches). */
  isPending?: boolean;
  fetchNextPage: () => Promise<unknown>;
  /** Fires as soon as sentinel intersects — use to show tail skeletons early. */
  onLoadMoreRequested?: () => void;
  /** Return current loaded item count — used to detect end-of-list (no growth). */
  getLoadedCount?: () => number;
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

const MAX_CONSECUTIVE_LOADS = 10;

/**
 * Callback-ref sentinel so IntersectionObserver attaches when the sentinel mounts.
 */
export function useInfiniteScrollTrigger({
  hasNextPage,
  isFetchingNextPage,
  isPending = false,
  fetchNextPage,
  onLoadMoreRequested,
  getLoadedCount,
  rootMargin = "280px 0px",
  threshold = 0,
  enabled = true,
}: UseInfiniteScrollTriggerOptions) {
  const ioRef = useRef<IntersectionObserver | null>(null);
  const fetchLockRef = useRef(false);
  const onLoadMoreRequestedRef = useRef(onLoadMoreRequested);
  const getLoadedCountRef = useRef(getLoadedCount);
  const sentinelNodeRef = useRef<HTMLDivElement | null>(null);
  const rootMarginRef = useRef(rootMargin);
  const consecutiveLoadsRef = useRef(0);
  const exhaustedRef = useRef(false);
  const trackedPageCountRef = useRef(0);
  const requestLoadMoreRef = useRef<() => void>(() => {});
  const [exhausted, setExhausted] = useState(false);

  useEffect(() => {
    onLoadMoreRequestedRef.current = onLoadMoreRequested;
  }, [onLoadMoreRequested]);

  useEffect(() => {
    getLoadedCountRef.current = getLoadedCount;
  }, [getLoadedCount]);

  useEffect(() => {
    rootMarginRef.current = rootMargin;
  }, [rootMargin]);

  useEffect(() => {
    if (hasNextPage) {
      exhaustedRef.current = false;
      setExhausted(false);
      consecutiveLoadsRef.current = 0;
    }
  }, [hasNextPage]);

  useEffect(() => {
    const external = getLoadedCountRef.current?.();
    if (typeof external === "number" && external >= 0) {
      trackedPageCountRef.current = external;
    }
  });

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

  const markExhausted = useCallback(() => {
    exhaustedRef.current = true;
    setExhausted(true);
  }, []);

  const scheduleFollowUp = useCallback(() => {
    requestAnimationFrame(() => {
      const latest = ioStateRef.current;
      if (
        exhaustedRef.current ||
        !latest.hasNextPage ||
        latest.isFetchingNextPage ||
        latest.isPending
      ) {
        return;
      }

      if (consecutiveLoadsRef.current >= MAX_CONSECUTIVE_LOADS) {
        return;
      }

      const node = sentinelNodeRef.current;
      if (!node || !isSentinelInLoadZone(node, rootMarginRef.current)) {
        return;
      }

      requestLoadMoreRef.current();
    });
  }, []);

  const requestLoadMore = useCallback(() => {
    const s = ioStateRef.current;
    if (exhaustedRef.current || !s.hasNextPage || s.isFetchingNextPage || s.isPending) {
      return;
    }
    if (fetchLockRef.current) return;

    const countBefore =
      getLoadedCountRef.current?.() ?? trackedPageCountRef.current;
    fetchLockRef.current = true;
    onLoadMoreRequestedRef.current?.();

    void fetchNextPage()
      .then((result) => {
        const pagesAfter =
          (result as { data?: { pages?: unknown[] } } | undefined)?.data?.pages
            ?.length ?? countBefore;
        trackedPageCountRef.current = pagesAfter;
        return pagesAfter > countBefore;
      })
      .then((grew) => {
        if (!grew) {
          markExhausted();
          return;
        }
        scheduleFollowUp();
      })
      .catch(() => {
        markExhausted();
      })
      .finally(() => {
        fetchLockRef.current = false;
        consecutiveLoadsRef.current += 1;
      });
  }, [fetchNextPage, markExhausted, scheduleFollowUp]);

  useEffect(() => {
    requestLoadMoreRef.current = requestLoadMore;
  }, [requestLoadMore]);

  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      disconnect();
      sentinelNodeRef.current = node;
      if (!node || !enabled) return;

      const io = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry) return;

          if (!entry.isIntersecting) {
            consecutiveLoadsRef.current = 0;
            return;
          }

          requestLoadMoreRef.current();
        },
        { root: null, rootMargin, threshold },
      );

      io.observe(node);
      ioRef.current = io;
    },
    [disconnect, enabled, rootMargin, threshold],
  );

  useEffect(() => () => disconnect(), [disconnect]);

  return { sentinelRef, exhausted };
}
