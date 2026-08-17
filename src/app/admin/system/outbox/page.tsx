'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, RotateCcw, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminErrorState from '@/components/admin/AdminErrorState';
import { Button } from '@/components/ui/button';
import { cn, formatDateTime } from '@/lib/utils';

const OUTBOX_TYPES = [
  'order',
  'cart',
  'inventory',
  'coupon',
  'gifting',
  'push',
  'blog_publish',
] as const;

type OutboxType = (typeof OUTBOX_TYPES)[number];

type DlqRow = {
  _id: string;
  eventType?: string;
  status?: string;
  attempts?: number;
  lastError?: string;
  updatedAt?: string;
  createdAt?: string;
};

export default function AdminOutboxDlqPage() {
  const [type, setType] = useState<OutboxType>('order');
  const [rows, setRows] = useState<DlqRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [replayingId, setReplayingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const res = await adminApi.listOutboxDeadLetter(type, { limit: 100 });
      setRows((res.data.rows as DlqRow[]) ?? []);
    } catch {
      setLoadError(true);
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [type]);

  useEffect(() => {
    void load();
  }, [load]);

  const replay = async (id: string) => {
    setReplayingId(id);
    try {
      await adminApi.replayOutboxEntry(type, id);
      toast.success('Entry queued for replay');
      await load();
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? 'Replay failed');
    } finally {
      setReplayingId(null);
    }
  };

  const typeLabel = useMemo(
    () => OUTBOX_TYPES.map((t) => ({ id: t, label: t.replace(/_/g, ' ') })),
    [],
  );

  return (
    <div className="p-4 sm:p-6 max-w-[1400px] mx-auto min-h-[calc(100dvh-4rem)] bg-[#FAF9F6] space-y-4">
      <AdminPageHeader
        title="Outbox dead letter"
        description="Failed outbox events stuck in dead_letter status. Replay after fixing the root cause."
        actions={
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={isLoading}>
            <RefreshCw className={cn('h-4 w-4 mr-1.5', isLoading && 'animate-spin')} />
            Refresh
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {typeLabel.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setType(t.id)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-colors',
              type === t.id ?
                'bg-navy-900 text-white border-navy-900'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loadError ?
        <AdminErrorState onRetry={() => void load()} />
      : isLoading ?
        <div className="rounded-xl border bg-white p-8 animate-pulse h-48" />
      : rows.length === 0 ?
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-8 text-center">
          <p className="text-sm font-medium text-emerald-900">No dead-letter entries for {type}</p>
        </div>
      : <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-[11px] uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Attempts</th>
                  <th className="px-4 py-3">Last error</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3 w-28" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr key={row._id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-gray-800">{row._id}</p>
                      {row.eventType ?
                        <p className="text-xs text-gray-500 mt-0.5">{row.eventType}</p>
                      : null}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{row.attempts ?? '—'}</td>
                    <td className="px-4 py-3 max-w-md">
                      <p className="text-xs text-red-700 line-clamp-2 flex gap-1">
                        {row.lastError ?
                          <>
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            {row.lastError}
                          </>
                        : '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {row.updatedAt ? formatDateTime(row.updatedAt) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={replayingId === row._id}
                        onClick={() => void replay(row._id)}
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1" />
                        Replay
                      </Button>
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
