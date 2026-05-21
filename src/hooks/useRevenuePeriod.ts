'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api';
import type { RevenuePeriod, RevenuePeriodSummary } from '@/lib/revenuePeriod';

export function useRevenuePeriod(period: RevenuePeriod, year?: number, month?: number) {
  const [summary, setSummary] = useState<RevenuePeriodSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(false);
    try {
      const params: { period: string; year?: number; month?: number } = { period };
      if (period === 'year' && year) params.year = year;
      if (period === 'month' && month) params.month = month;
      const res = await adminApi.getRevenueSummary(params);
      setSummary(res.data as RevenuePeriodSummary);
    } catch {
      setError(true);
      setSummary(null);
      toast.error('Could not load revenue for this period.');
    } finally {
      setIsLoading(false);
    }
  }, [period, year, month]);

  useEffect(() => {
    load();
  }, [load]);

  return { summary, isLoading, error, reload: load };
}
