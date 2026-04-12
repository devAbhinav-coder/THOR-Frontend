'use client';

import { useMemo } from 'react';
import type { DashboardAnalytics } from '@/types';
import { OrdersVolumeTrendChart } from '@/components/admin/charts/OrdersVolumeTrendChart';

const STATUS_ORDER = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
] as const;

const STATUS_COLORS: Record<string, string> = {
  pending: '#eab308',
  confirmed: '#3b82f6',
  processing: '#a855f7',
  shipped: '#6366f1',
  delivered: '#22c55e',
  cancelled: '#ef4444',
  refunded: '#9ca3af',
};

function formatLabel(id: string) {
  return id.replace(/_/g, ' ');
}

export function OrdersInsightsPanel({ analytics }: { analytics: DashboardAnalytics }) {
  const slice = analytics.revenueByMonth.slice(-6);
  const hasVolumeTrend = slice.length > 0;
  const rows = useMemo(() => {
    const list = [...analytics.ordersByStatus];
    list.sort((a, b) => {
      const ia = STATUS_ORDER.indexOf(a._id as (typeof STATUS_ORDER)[number]);
      const ib = STATUS_ORDER.indexOf(b._id as (typeof STATUS_ORDER)[number]);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
    return list.filter((r) => r.count > 0);
  }, [analytics.ordersByStatus]);

  const totalInMix = useMemo(() => rows.reduce((s, r) => s + r.count, 0), [rows]);

  if (!hasVolumeTrend && rows.length === 0) return null;

  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white p-5 sm:p-6 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.1)]">
      <div
        className={
          hasVolumeTrend
            ? 'grid gap-8 lg:grid-cols-12 lg:items-stretch lg:gap-10'
            : 'grid grid-cols-1'
        }
      >
        {hasVolumeTrend && (
          <div className="min-w-0 lg:col-span-7">
            <OrdersVolumeTrendChart
              data={slice}
              height={300}
              title="Order volume"
              subtitle="How many orders landed each month — operations view (not revenue)"
              titleRight={<span className="text-xs text-gray-400">Hover chart for details</span>}
            />
          </div>
        )}

        <div className={hasVolumeTrend ? 'flex min-w-0 flex-col lg:col-span-5' : 'flex w-full flex-col'}>
          <div className="mb-3">
            <h4 className="font-serif text-base font-bold text-gray-900">Pipeline mix</h4>
            <p className="mt-0.5 text-xs text-gray-500">Orders by status — share of your catalogue</p>
          </div>

          {totalInMix > 0 && rows.length > 0 ? (
            <>
              <div
                className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200/80"
                title="Status distribution"
              >
                {rows.map((r) => (
                  <div
                    key={r._id}
                    className="h-full min-w-[2px] first:rounded-l-full last:rounded-r-full transition-[flex-grow] duration-500"
                    style={{
                      flexGrow: r.count,
                      flexBasis: 0,
                      backgroundColor: STATUS_COLORS[r._id] ?? '#94a3b8',
                    }}
                  />
                ))}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {rows.map((r) => {
                  const pct = totalInMix > 0 ? Math.round((r.count / totalInMix) * 1000) / 10 : 0;
                  const color = STATUS_COLORS[r._id] ?? '#64748b';
                  return (
                    <div
                      key={r._id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-slate-50/50 px-3 py-2.5 text-left shadow-sm transition-colors hover:border-slate-300 hover:bg-white"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white" style={{ backgroundColor: color }} />
                        <span className="truncate text-xs font-semibold capitalize text-slate-800">{formatLabel(r._id)}</span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-sm font-bold tabular-nums text-slate-900">{r.count}</span>
                        <span className="text-[10px] font-medium text-slate-500">{pct}%</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 py-8 text-center text-sm text-slate-500">
              No status breakdown yet
            </p>
          )}

          <p className="mt-auto pt-4 text-[11px] leading-relaxed text-slate-400">
            Total in store:{' '}
            <span className="font-semibold text-slate-600">{analytics.overview.totalOrders.toLocaleString()}</span> orders
          </p>
        </div>
      </div>
    </div>
  );
}
