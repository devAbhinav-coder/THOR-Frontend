'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api';
import { DashboardAnalytics } from '@/types';
import { formatPrice, cn } from '@/lib/utils';
import {
  TrendingUp,
  IndianRupee,
  RefreshCw,
  ArrowUpRight,
  Undo2,
  ShoppingBag,
  Percent,
  CalendarRange,
  Sparkles,
} from 'lucide-react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminErrorState from '@/components/admin/AdminErrorState';
import { Button } from '@/components/ui/button';
import RevenueCompositionDonut from '@/components/admin/RevenueCompositionDonut';
import MonthlyRevenueChart from '@/components/admin/MonthlyRevenueChart';

export default function AdminRevenuePage() {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (silent) setIsRefreshing(true);
    else {
      setIsLoading(true);
      setLoadError(false);
    }
    try {
      const res = await adminApi.getAnalytics();
      setAnalytics(res.data);
      setLoadError(false);
    } catch {
      if (!silent) {
        setAnalytics(null);
        setLoadError(true);
      } else {
        toast.error('Could not refresh revenue data.');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  const asOfLabel = useMemo(() => {
    return new Intl.DateTimeFormat('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date());
  }, []);

  if (isLoading && !analytics) {
    return (
      <div className="p-6 xl:p-8 space-y-4 animate-pulse max-w-[1600px] mx-auto">
        <div className="h-8 w-64 bg-gray-200 rounded-lg" />
        <div className="h-72 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50" />
      </div>
    );
  }
  if (!isLoading && loadError && !analytics) {
    return (
      <div className="p-6 xl:p-8 max-w-3xl mx-auto">
        <AdminPageHeader
          title="Revenue"
          description="Financial snapshot from paid orders and recorded refunds."
        />
        <div className="mt-8">
          <AdminErrorState onRetry={() => load(false)} />
        </div>
      </div>
    );
  }
  if (!analytics) return null;

  const { overview, revenueByMonth } = analytics;
  const refunded = overview.refundedAmount ?? 0;
  const refundedCount = overview.refundedOrdersCount ?? 0;
  const gross = overview.totalRevenue;
  const netLike = Math.max(0, gross - refunded);
  const mtd = overview.monthRevenue;
  const monthName = new Intl.DateTimeFormat('en-IN', { month: 'long' }).format(new Date());

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-gradient-to-b from-slate-50/80 via-white to-white">
      <div className="p-4 sm:p-6 xl:p-8 space-y-8 max-w-[1600px] mx-auto">
        <AdminPageHeader
          title="Revenue intelligence"
          description="Lifetime gross from paid orders, month-to-date performance, refund outflows, and how much you retain — with a clear visual split."
          actions={
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm"
                onClick={() => load(true)}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Link
                href="/admin/analytics"
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:border-brand-300 hover:bg-brand-50/50 transition-colors shadow-sm"
              >
                Analytics <ArrowUpRight className="h-4 w-4 text-brand-600" />
              </Link>
              <Link
                href="/admin/returns"
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:border-amber-200 hover:bg-amber-50/50 transition-colors shadow-sm"
              >
                Returns <ArrowUpRight className="h-4 w-4 text-amber-600" />
              </Link>
            </>
          }
        />

        <div className="rounded-2xl border border-gray-200/80 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CalendarRange className="h-4 w-4 text-brand-600 shrink-0" />
            <span>
              As of <time dateTime={new Date().toISOString()}>{asOfLabel}</time>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 xl:gap-10 items-start">
          <section className="xl:col-span-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              <Sparkles className="h-3.5 w-3.5 text-gold-500" />
              Composition
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.15)]">
              <h2 className="font-serif text-xl font-bold text-gray-900 tracking-tight">Gross → retained vs refunded</h2>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                The ring is 100% of lifetime gross. Green is what stays after recorded refunds; amber is outflow to customers.
              </p>
              <div className="mt-8">
                <RevenueCompositionDonut gross={gross} refunded={refunded} netLike={netLike} size="lg" />
              </div>
            </div>
          </section>

          <section className="xl:col-span-7 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Key figures
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <article
                className={cn(
                  'relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md',
                  'border-brand-100 bg-gradient-to-br from-white to-brand-50/30',
                )}
              >
                <span className="inline-flex items-center rounded-full bg-brand-100/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-800">
                  Lifetime
                </span>
                <div className="mt-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-gray-500">Gross revenue</p>
                    <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900 tabular-nums">{formatPrice(gross)}</p>
                    <p className="mt-2 text-[11px] text-gray-500 leading-snug">Sum of paid order totals (all time).</p>
                  </div>
                  <div className="h-11 w-11 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                    <IndianRupee className="h-5 w-5 text-brand-600" />
                  </div>
                </div>
              </article>

              <article
                className={cn(
                  'relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md',
                  'border-emerald-100 bg-gradient-to-br from-white to-emerald-50/40',
                )}
              >
                <span className="inline-flex items-center rounded-full bg-emerald-100/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-900">
                  MTD · {monthName}
                </span>
                <div className="mt-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-gray-500">This month (paid)</p>
                    <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900 tabular-nums">{formatPrice(mtd)}</p>
                    <p className="mt-2 text-[11px] text-gray-500 leading-snug">Resets on the 1st of each month.</p>
                  </div>
                  <div className="h-11 w-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </article>

              <article
                className={cn(
                  'relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md',
                  'border-amber-100 bg-gradient-to-br from-amber-50/50 to-white',
                )}
              >
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950">
                  Outflow
                </span>
                <div className="mt-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Refunds recorded</p>
                    <p className="mt-1 text-2xl font-bold tracking-tight text-amber-950 tabular-nums">{formatPrice(refunded)}</p>
                    <p className="mt-2 text-[11px] text-amber-900/80 leading-snug">
                      {refundedCount} order{refundedCount === 1 ? '' : 's'} · from refund pipeline
                    </p>
                  </div>
                  <div className="h-11 w-11 rounded-xl bg-amber-100/80 flex items-center justify-center shrink-0">
                    <Undo2 className="h-5 w-5 text-amber-800" />
                  </div>
                </div>
              </article>

              <article
                className={cn(
                  'relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md',
                  'border-navy-200 bg-gradient-to-br from-navy-900 via-navy-950 to-navy-900 text-white',
                )}
              >
                <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold-200">
                  Net retained
                </span>
                <div className="mt-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-white/60">Gross − refunds</p>
                    <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums text-white">{formatPrice(netLike)}</p>
                    <p className="mt-2 text-[11px] text-white/50 leading-snug">
                      Simplified view — align with Razorpay / bank for chargebacks.
                    </p>
                  </div>
                  <div className="h-11 w-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                    <Percent className="h-5 w-5 text-gold-300" />
                  </div>
                </div>
              </article>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <ShoppingBag className="h-4 w-4 text-gray-400" />
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Paid orders</p>
                </div>
                <p className="text-xl font-bold text-gray-900 tabular-nums">{overview.paidOrdersCount?.toLocaleString() ?? '—'}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">All time</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Percent className="h-4 w-4 text-gray-400" />
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Avg. order value</p>
                </div>
                <p className="text-xl font-bold text-gray-900 tabular-nums">{formatPrice(overview.avgOrderValue ?? 0)}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">On paid orders</p>
              </div>
            </div>
          </section>
        </div>

        <MonthlyRevenueChart
          data={revenueByMonth}
          title="Revenue trend"
          subtitle="Trailing 12 months · paid orders only · tap or hover a bar for details"
          chartHeight={210}
        />
      </div>
    </div>
  );
}
