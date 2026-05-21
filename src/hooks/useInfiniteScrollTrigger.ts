"use client";

import { useCallback, useEffect, useRef } from "react";

type UseInfiniteScrollTriggerOptions = {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  /** Only block IO on the very first load (not background refetches). */
  isPending?: boolean;
  fetchNextPage: () => Promise<unknown>;
  rootMargin?: string;
  threshold?: number;
  enabled?: boolean;
};

/**
 * Callback-ref sentinel so IntersectionObserver attaches when the sentinel mounts.
 * (useRef + useEffect missed the first paint when the sentinel appeared only after page 1 loaded.)
 */
export function useInfiniteScrollTrigger({
  hasNextPage,
  isFetchingNextPage,
  isPending = false,
  fetchNextPage,
  rootMargin = "280px 0px",
  threshold = 0,
  enabled = true,
}: UseInfiniteScrollTriggerOptions) {
  const ioRef = useRef<IntersectionObserver | null>(null);
  const fetchLockRef = useRef(false);
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

  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      disconnect();
      if (!node || !enabled) return;

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
        { root: null, rootMargin, threshold },
      );

      io.observe(node);
      ioRef.current = io;
    },
    [disconnect, enabled, fetchNextPage, rootMargin, threshold],
  );

  useEffect(() => () => disconnect(), [disconnect]);

  return { sentinelRef };
}
