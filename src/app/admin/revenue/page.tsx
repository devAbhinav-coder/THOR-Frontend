'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { adminApi, inventoryApi } from '@/lib/api';
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
import { RevenueTrendAreaChart } from '@/components/admin/charts/RevenueTrendAreaChart';

export default function AdminRevenuePage() {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [invValuation, setInvValuation] = useState<any>(null);
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
      const [res, invRes] = await Promise.all([
        adminApi.getAnalytics(),
        inventoryApi.getValuation()
      ]);
      setAnalytics(res.data);
      setInvValuation(invRes.data);
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
          description="Financial snapshot from gross order totals, recorded refunds, and retained value."
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
  const feesRetained = overview.nonRefundableFeesRetained ?? 0;
  const gross = overview.totalRevenue;
  const netLike = Math.max(0, gross - refunded);
  const mtd = overview.monthRevenue;
  const monthName = new Intl.DateTimeFormat('en-IN', { month: 'long' }).format(new Date());
  const refundRatePct = overview.totalOrders > 0 ? (refundedCount / overview.totalOrders) * 100 : 0;
  const retainRatePct = gross > 0 ? (netLike / gross) * 100 : 0;

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-gradient-to-b from-slate-50/80 via-white to-white">
      <div className="p-4 sm:p-6 xl:p-8 space-y-8 max-w-[1600px] mx-auto">
        <AdminPageHeader
          title="Revenue intelligence"
          description="Gross sums checkout totals for paid and refunded orders; refunds are the cash returned (usually product value). Shipping/COD kept on refunds is listed separately when applicable."
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
                The ring is 100% of lifetime gross (original order totals). Amber is cash refunded to customers; green is retained. Shipping/COD fees not refunded are part of green, and may also appear as “fees kept” when recorded.
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
                    <p className="mt-2 text-[11px] text-gray-500 leading-snug">
                      Sum of order totals for paid + refunded orders (all time) — same checkout amount whether or not later refunded.
                    </p>
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
                    <p className="text-xs font-medium text-gray-500">This month (gross)</p>
                    <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900 tabular-nums">{formatPrice(mtd)}</p>
                    <p className="mt-2 text-[11px] text-gray-500 leading-snug">
                      Orders placed this month (paid or later refunded). Resets on the 1st.
                    </p>
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
                      {refundedCount} order{refundedCount === 1 ? '' : 's'} · amount sent back (excludes shipping/COD kept)
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
                  'border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white',
                )}
              >
                <span className="inline-flex items-center rounded-full bg-emerald-100/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-900">
                  Policy · non-refundable
                </span>
                <div className="mt-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-emerald-900/80">Shipping &amp; COD kept on refunds</p>
                    <p className="mt-1 text-2xl font-bold tracking-tight text-emerald-950 tabular-nums">{formatPrice(feesRetained)}</p>
                    <p className="mt-2 text-[11px] text-emerald-900/70 leading-snug">
                      {feesRetained > 0
                        ? 'Sum of non-refundable fees on processed refunds.'
                        : 'No retained shipping/COD fees recorded yet.'}
                    </p>
                  </div>
                  <div className="h-11 w-11 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                    <IndianRupee className="h-5 w-5 text-emerald-700" />
                  </div>
                </div>
              </article>

              <article
                className={cn(
                  'relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md',
                  'border-navy-200 bg-gradient-to-br from-navy-900 via-navy-950 to-navy-900 text-white sm:col-span-2',
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
                      Gross minus refunds. Align with payouts; fees kept on refunds are inside this total.
                    </p>
                  </div>
                  <div className="h-11 w-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                    <Percent className="h-5 w-5 text-gold-300" />
                  </div>
                </div>
              </article>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <ShoppingBag className="h-4 w-4 text-gray-400" />
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Currently paid</p>
                </div>
                <p className="text-xl font-bold text-gray-900 tabular-nums">{overview.paidOrdersCount?.toLocaleString() ?? '—'}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">All time · excludes refunded</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Percent className="h-4 w-4 text-gray-400" />
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Avg. order value</p>
                </div>
                <p className="text-xl font-bold text-gray-900 tabular-nums">{formatPrice(overview.avgOrderValue ?? 0)}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Paid + refunded orders (checkout totals)</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Undo2 className="h-4 w-4 text-amber-500" />
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Refund rate</p>
                </div>
                <p className="text-xl font-bold text-gray-900 tabular-nums">{refundRatePct.toFixed(1)}%</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{refundedCount} / {overview.totalOrders.toLocaleString()} orders</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Retention ratio</p>
                </div>
                <p className="text-xl font-bold text-gray-900 tabular-nums">{retainRatePct.toFixed(1)}%</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Net retained / Gross</p>
              </div>
            </div>
          </section>
        </div>

        <RevenueTrendAreaChart
          data={revenueByMonth}
          title="Revenue mountain trend"
          subtitle="Trailing 12 months · gross (paid + refunded) with monthly order count overlay"
          height={360}
          smooth
          titleRight={<span className="text-xs text-gray-400">Hover points for month-wise detail</span>}
        />

        {/* ── NEW: Revenue Breakdown & Channel Intelligence ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Revenue breakdown
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Coupon Discounts</p>
                  <p className="text-lg font-bold text-red-600">{formatPrice(overview.couponDiscountTotal || 0)}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{overview.couponOrdersTotal || 0} orders used coupons</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Shipping Collected</p>
                  <p className="text-lg font-bold text-gray-800">{formatPrice(overview.shippingCollected || 0)}</p>
                  <p className="text-[10px] text-gray-400 mt-1">Gross shipping income</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">COD Fees</p>
                  <p className="text-lg font-bold text-gray-800">{formatPrice(overview.codFeeCollected || 0)}</p>
                  <p className="text-[10px] text-gray-400 mt-1">Extra fees for cash collection</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Output GST (Paid)</p>
                  <p className="text-lg font-bold text-emerald-600">{formatPrice(overview.taxCollected || 0)}</p>
                  <p className="text-[10px] text-gray-400 mt-1">Tax collected on paid orders</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-700">Payment method mix (by revenue)</p>
                <div className="space-y-2">
                  {(analytics.paymentMethodMix || []).map((pm) => {
                    const pct = gross > 0 ? (pm.revenue / gross) * 100 : 0;
                    return (
                      <div key={pm._id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-gray-600 capitalize">{pm._id.replace(/_/g, ' ')}</span>
                          <span className="font-bold text-gray-900">{formatPrice(pm.revenue)} ({pct.toFixed(1)}%)</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-navy-600 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Inventory intelligence
            </div>
            <div className="rounded-2xl border border-gray-100 bg-navy-950 p-6 shadow-xl text-white space-y-6">
              <div>
                <h3 className="font-serif text-lg font-bold text-gold-200">Profitability Forecast</h3>
                <p className="text-xs text-white/50 mt-1">Based on current stock and listing prices.</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Inventory at Cost</p>
                  <p className="text-2xl font-bold text-white">{formatPrice(invValuation?.overall?.totalCostValue || 0)}</p>
                  <p className="text-[10px] text-white/40">Total investment in stock</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Potential Margin</p>
                  <p className="text-2xl font-bold text-gold-400">{invValuation?.overall?.potentialMargin || 0}%</p>
                  <p className="text-[10px] text-white/40">Expected gross markup</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60">Estimated Sale Value</span>
                  <span className="font-bold">{formatPrice(invValuation?.overall?.totalSaleValue || 0)}</span>
                </div>
                <div className="flex items-center justify-between text-xs border-t border-white/10 pt-3">
                  <span className="text-white/60">Expected Gross Profit</span>
                  <span className="font-bold text-emerald-400">{formatPrice((invValuation?.overall?.totalSaleValue || 0) - (invValuation?.overall?.totalCostValue || 0))}</span>
                </div>
              </div>

              <p className="text-[10px] text-white/30 italic">
                Note: This is a forecast on remaining stock. Realized profit depends on actual selling price, discounts, and returns.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
