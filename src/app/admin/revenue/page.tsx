'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { inventoryApi } from '@/lib/api';
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics';
import { formatPrice, cn } from '@/lib/utils';
import { RefreshCw, ArrowUpRight, CalendarRange, Layers } from 'lucide-react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminErrorState from '@/components/admin/AdminErrorState';
import { Button } from '@/components/ui/button';
import RevenueCompositionDonut from '@/components/admin/RevenueCompositionDonut';
import { RevenueTrendAreaChart } from '@/components/admin/charts/RevenueTrendAreaChart';
import {
  AdminCrossNav,
  InventorySnapshotPanel,
  PaymentMethodMixPanel,
  type InventoryValuationOverall,
} from '@/components/admin/dashboard';
import { buildFinancialSnapshot } from '@/lib/revenueMetrics';
import {
  FinancialOverviewPanel,
  RevenueVsProfitChart,
  ProductProfitTable,
  CategoryProfitPanel,
} from '@/components/admin/revenue';

export default function AdminRevenuePage() {
  const { analytics, isLoading, loadError, isRefreshing, load, refresh } = useAdminAnalytics();
  const [invValuation, setInvValuation] = useState<InventoryValuationOverall | null>(null);

  const loadInventory = useCallback(async () => {
    try {
      const invRes = await inventoryApi.getValuation();
      setInvValuation((invRes.data as { overall?: InventoryValuationOverall }).overall ?? null);
    } catch {
      setInvValuation(null);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const asOfLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date()),
    [],
  );

  if (isLoading && !analytics) {
    return (
      <div className="p-6 xl:p-8 space-y-4 animate-pulse max-w-[1600px] mx-auto">
        <div className="h-8 w-64 bg-gray-200 rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-2xl" />
          ))}
        </div>
        <div className="h-96 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  if (!isLoading && loadError && !analytics) {
    return (
      <div className="p-6 xl:p-8 max-w-3xl mx-auto">
        <AdminPageHeader title="Revenue" description="Financial and profit intelligence." />
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
  const productsByProfit = analytics.topProductsByProfit ?? [];
  const categoryProfit = analytics.categoryProfit ?? [];
  const profitByMonth = analytics.profitByMonth ?? [];
  const fin = buildFinancialSnapshot(overview, refunded, feesRetained);

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-gradient-to-b from-slate-50/80 via-white to-white">
      <div className="p-4 sm:p-6 xl:p-8 space-y-8 max-w-[1600px] mx-auto">
        <AdminPageHeader
          title="Revenue & profit"
          badge="Finance"
          description="Gross cash flow, actual product profit (revenue − COGS), and per-SKU economics. Click any product row for full breakdown."
          actions={
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl border-gray-200 bg-white/80 shadow-sm"
                onClick={() => {
                  refresh();
                  loadInventory();
                }}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Link
                href="/admin/inventory"
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:border-brand-300 shadow-sm"
              >
                Set costs <ArrowUpRight className="h-4 w-4 text-brand-600" />
              </Link>
            </>
          }
        />

        <div className="rounded-xl border border-gray-200/80 bg-white/80 px-4 py-2.5 shadow-sm flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
          <CalendarRange className="h-4 w-4 text-brand-600 shrink-0" />
          <span>
            As of <time dateTime={new Date().toISOString()}>{asOfLabel}</time>
          </span>
          <span className="hidden sm:inline text-gray-300">|</span>
          <span className="text-xs text-gray-500">
            Paid orders only for profit · IST boundaries
          </span>
        </div>

        <FinancialOverviewPanel fin={fin} />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-gray-200/80 bg-white p-5 sm:p-6 shadow-sm">
            <h3 className="font-serif font-bold text-gray-900">Revenue vs profit (12 months)</h3>
            <p className="text-xs text-gray-500 mt-1 mb-4">
              Bars: gross &amp; product revenue · Green line: gross profit
            </p>
            <RevenueVsProfitChart
              revenueByMonth={revenueByMonth}
              profitByMonth={profitByMonth}
              height={300}
            />
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm">
            <h3 className="font-serif font-bold text-gray-900">Cash retained</h3>
            <p className="text-xs text-gray-500 mt-1 mb-4">Gross order totals minus refunds</p>
            <RevenueCompositionDonut gross={gross} refunded={refunded} netLike={netLike} size="lg" />
          </div>
        </div>

        {/* Product profit — primary section */}
        <section className="rounded-2xl border border-gray-200/90 bg-white shadow-[0_24px_60px_-32px_rgba(15,23,42,0.15)] overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-white via-emerald-50/30 to-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                  Product profit ledger
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  What sold, for how much, cost per unit, and actual margin — tap a row for details
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-bold px-3 py-1">
                {productsByProfit.length} SKUs ranked
              </span>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            <ProductProfitTable products={productsByProfit} />
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-8">
          <section className="xl:col-span-5 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Month snapshot</p>
            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="Gross revenue" value={formatPrice(fin.grossRevenue)} />
              <MiniStat label="Net revenue" value={formatPrice(fin.netRevenue)} accent="navy" />
              <MiniStat label={`MTD gross · ${monthName}`} value={formatPrice(mtd)} accent="emerald" />
              <MiniStat label="Gross profit" value={formatPrice(fin.grossProfit)} accent="emerald" />
              <MiniStat label="Net income" value={formatPrice(fin.netIncome)} accent="navy" />
              <MiniStat label="Refunds" value={formatPrice(refunded)} accent="amber" />
            </div>
          </section>

          <section className="xl:col-span-7 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              Profit by category
            </p>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm min-h-[200px]">
              {categoryProfit.length === 0 ?
                <p className="text-sm text-gray-500 py-8 text-center">No category profit data yet.</p>
              : <CategoryProfitPanel rows={categoryProfit} />}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MiniStat
                label="Paid orders"
                value={overview.paidOrdersCount?.toLocaleString() ?? '—'}
                sub="Excl. refunded"
              />
              <MiniStat label="AOV" value={formatPrice(overview.avgOrderValue ?? 0)} />
              <MiniStat label="Refund rate" value={`${refundRatePct.toFixed(1)}%`} accent="amber" />
              <MiniStat label="Retention" value={`${retainRatePct.toFixed(1)}%`} accent="emerald" />
            </div>
          </section>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 sm:p-6 shadow-sm">
          <RevenueTrendAreaChart
            data={revenueByMonth}
            title="Gross revenue trend"
            subtitle="Monthly order checkout totals — paid + refunded"
            height={300}
            smooth
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Revenue leakage & fees</h3>
            <div className="grid grid-cols-2 gap-3">
              <LeakCard
                label="Coupon discounts"
                value={formatPrice(overview.couponDiscountTotal || 0)}
                sub={`${overview.couponOrdersTotal || 0} orders`}
                tone="red"
              />
              <LeakCard label="Shipping collected" value={formatPrice(overview.shippingCollected || 0)} />
              <LeakCard label="COD fees" value={formatPrice(overview.codFeeCollected || 0)} />
              <LeakCard
                label="GST collected"
                value={formatPrice(overview.taxCollected || 0)}
                tone="emerald"
              />
              <LeakCard
                label="Fees kept on refunds"
                value={formatPrice(feesRetained)}
                tone="emerald"
                className="col-span-2"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-700 mb-3">Payment mix</p>
              <PaymentMethodMixPanel rows={analytics.paymentMethodMix || []} grossTotal={gross} />
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">
              Stock vs realized profit
            </h3>
            <InventorySnapshotPanel
              valuation={invValuation}
              stockHealth={analytics.stockHealth}
              compact
            />
            <p className="text-[11px] text-gray-500 leading-relaxed px-1">
              Inventory panel shows <strong>potential</strong> margin on unsold stock. Product ledger above shows{' '}
              <strong>realized</strong> margin on what already sold.
            </p>
            <AdminCrossNav
              items={[
                {
                  label: 'Merchandising analytics',
                  href: '/admin/analytics',
                  description: 'Views, conversion, peak hours.',
                  accent: 'border-brand-100 bg-brand-50/30',
                },
                {
                  label: 'Operations dashboard',
                  href: '/admin',
                  description: 'Today, queue, recent orders.',
                  accent: 'border-gray-200 bg-white',
                },
              ]}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: 'emerald' | 'amber' | 'navy';
}) {
  const border =
    accent === 'emerald' ? 'border-emerald-100 bg-emerald-50/40'
    : accent === 'amber' ? 'border-amber-100 bg-amber-50/40'
    : accent === 'navy' ? 'border-navy-200 bg-navy-50/30'
    : 'border-gray-100 bg-gray-50/50';
  return (
    <div className={cn('rounded-xl border p-3', border)}>
      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-base font-bold text-gray-900 tabular-nums mt-0.5">{value}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function LeakCard({
  label,
  value,
  sub,
  tone,
  className,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'red' | 'emerald';
  className?: string;
}) {
  return (
    <div className={cn('rounded-xl border border-gray-100 bg-gray-50/60 p-3', className)}>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
      <p
        className={cn(
          'text-lg font-bold tabular-nums mt-0.5',
          tone === 'red' && 'text-red-600',
          tone === 'emerald' && 'text-emerald-700',
        )}
      >
        {value}
      </p>
      {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
    </div>
  );
}
