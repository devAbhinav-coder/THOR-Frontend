'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api';
import type { DashboardAnalytics } from '@/types';

const CACHE_TTL_MS = 90_000;

let analyticsCache: { data: DashboardAnalytics; fetchedAt: number } | null = null;

export function invalidateAdminAnalyticsCache() {
  analyticsCache = null;
}

export function useAdminAnalytics(options?: { enabled?: boolean }) {
  const enabled = options?.enabled !== false;
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(() => {
    if (!analyticsCache) return null;
    if (Date.now() - analyticsCache.fetchedAt > CACHE_TTL_MS) return null;
    return analyticsCache.data;
  });
  const [isLoading, setIsLoading] = useState(() => !analytics);
  const [loadError, setLoadError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!enabled) return;

    const cached =
      analyticsCache && Date.now() - analyticsCache.fetchedAt < CACHE_TTL_MS ?
        analyticsCache.data
      : null;

    if (!silent && cached) {
      setAnalytics(cached);
      setIsLoading(false);
      setLoadError(false);
      return;
    }

    if (silent) setIsRefreshing(true);
    else {
      setIsLoading(true);
      setLoadError(false);
    }

    try {
      const res = await adminApi.getAnalytics();
      analyticsCache = { data: res.data, fetchedAt: Date.now() };
      setAnalytics(res.data);
      setLoadError(false);
    } catch {
      if (!silent) {
        setAnalytics(null);
        setLoadError(true);
      } else {
        toast.error('Could not refresh analytics.');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) load(false);
  }, [enabled, load]);

  return { analytics, isLoading, loadError, isRefreshing, load, refresh: () => load(true) };
}
