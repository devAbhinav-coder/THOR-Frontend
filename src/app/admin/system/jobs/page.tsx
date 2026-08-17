'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { adminApi } from '@/lib/api';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminErrorState from '@/components/admin/AdminErrorState';
import { Button } from '@/components/ui/button';
import { cn, formatDateTime } from '@/lib/utils';

type JobHealthEntry = {
  lastRunAt: string;
  lastSuccessAt?: string;
  lastError?: string;
  lastDurationMs: number;
  lastCount?: number;
  runCount: number;
  errorCount: number;
};

export default function AdminJobHealthPage() {
  const [jobs, setJobs] = useState<Record<string, JobHealthEntry>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const res = await adminApi.getJobHealth();
      setJobs((res.data.jobs as Record<string, JobHealthEntry>) ?? {});
      setFetchedAt(String(res.data.timestamp ?? new Date().toISOString()));
    } catch {
      setLoadError(true);
      setJobs({});
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const t = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(t);
  }, [load]);

  const rows = useMemo(
    () =>
      Object.entries(jobs)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, entry]) => ({ name, ...entry })),
    [jobs],
  );

  const errorJobs = rows.filter((r) => r.lastError);
  const healthyJobs = rows.length - errorJobs.length;

  return (
    <div className="p-4 sm:p-6 max-w-[1400px] mx-auto min-h-[calc(100dvh-4rem)] bg-[#FAF9F6] space-y-4">
      <AdminPageHeader
        title="Background jobs"
        description="Last run health for scheduled maintenance jobs (Redis-backed when enabled)."
        actions={
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={isLoading}>
            <RefreshCw className={cn('h-4 w-4 mr-1.5', isLoading && 'animate-spin')} />
            Refresh
          </Button>
        }
      />

      {!isLoading && !loadError && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-[10px] uppercase text-gray-500 font-semibold">Tracked jobs</p>
            <p className="text-2xl font-bold tabular-nums mt-1">{rows.length}</p>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-[10px] uppercase text-gray-500 font-semibold">Healthy</p>
            <p className="text-2xl font-bold tabular-nums mt-1 text-emerald-700">{healthyJobs}</p>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-[10px] uppercase text-gray-500 font-semibold">Last error</p>
            <p className="text-2xl font-bold tabular-nums mt-1 text-red-600">{errorJobs.length}</p>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-[10px] uppercase text-gray-500 font-semibold">Fetched</p>
            <p className="text-xs font-medium mt-2 text-gray-700">
              {fetchedAt ? formatDateTime(fetchedAt) : '—'}
            </p>
          </div>
        </div>
      )}

      {loadError ?
        <AdminErrorState onRetry={() => void load()} />
      : isLoading ?
        <div className="rounded-xl border bg-white p-8 animate-pulse h-64" />
      : rows.length === 0 ?
        <div className="rounded-xl border bg-white p-8 text-center text-sm text-gray-500">
          <Activity className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          No job runs recorded yet. Jobs report health after their first execution in worker mode.
        </div>
      : <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-[11px] uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-3">Job</th>
                  <th className="px-4 py-3">Last run</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Runs / errors</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr key={row.name} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3 font-mono text-xs">{row.name}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                      {formatDateTime(row.lastRunAt)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-xs">{row.lastDurationMs} ms</td>
                    <td className="px-4 py-3 tabular-nums text-xs">
                      {row.runCount} / <span className="text-red-600">{row.errorCount}</span>
                      {row.lastCount != null ?
                        <span className="text-gray-400 ml-1">· {row.lastCount} processed</span>
                      : null}
                    </td>
                    <td className="px-4 py-3">
                      {row.lastError ?
                        <span className="inline-flex items-center gap-1 text-xs text-red-700 max-w-xs truncate" title={row.lastError}>
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          {row.lastError}
                        </span>
                      : <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          OK
                        </span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  );
}
