'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { inventoryApi, operatingExpensesApi } from '@/lib/api';
import { useAdminAnalytics, invalidateAdminAnalyticsCache } from '@/hooks/useAdminAnalytics';
import { useRevenuePeriod } from '@/hooks/useRevenuePeriod';
import { formatPrice, cn } from '@/lib/utils';
import {
  RefreshCw,
  ArrowUpRight,
  CalendarRange,
  Layers,
  LineChart,
  Box,
  AlertCircle,
  PieChart,
} from 'lucide-react';

import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminErrorState from '@/components/admin/AdminErrorState';
import { Button } from '@/components/ui/button';
import RevenueCompositionDonut from '@/components/admin/RevenueCompositionDonut';
import { RevenueTrendAreaChart } from '@/components/admin/charts/RevenueTrendAreaChart';
import {
  InventorySnapshotPanel,
  PaymentMethodMixPanel,
  type InventoryValuationOverall,
} from '@/components/admin/dashboard';
import { buildFinancialSnapshot } from '@/lib/revenueMetrics';
import { availableYearsFromAnalytics, type RevenuePeriod } from '@/lib/revenuePeriod';
import {
  FinancialOverviewPanel,
  RevenueVsProfitChart,
  RevenuePeriodToolbar,
  ProductProfitTable,
  CategoryProfitPanel,
} from '@/components/admin/revenue';
import { MiniStat } from '@/components/admin/revenue/MiniStat';
import { LeakCard } from '@/components/admin/revenue/LeakCard';

type Tab = 'overview' | 'profitability' | 'leakage';

export default function AdminRevenuePage() {
  const { analytics, isLoading, loadError, isRefreshing, load, refresh } = useAdminAnalytics();
  const [period, setPeriod] = useState<RevenuePeriod>('year');
  const [year, setYear] = useState(() => new Date().getFullYear());
  const { summary, isLoading: periodLoading, reload: reloadPeriod } = useRevenuePeriod(period, year);
  const [invValuation, setInvValuation] = useState<InventoryValuationOverall | null>(null);
  const [yearOpex, setYearOpex] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const years = useMemo(
    () => (analytics ? availableYearsFromAnalytics(analytics) : [new Date().getFullYear()]),
    [analytics],
  );

  const loadInventory = useCallback(async () => {
    try {
      const [invRes, opexRes] = await Promise.all([
        inventoryApi.getValuation(),
        operatingExpensesApi.getSummary({ year }),
      ]);
      setInvValuation((invRes.data as { overall?: InventoryValuationOverall }).overall ?? null);
      const sum = (opexRes.data as { summary?: { yearTotal?: number } }).summary;
      setYearOpex(sum?.yearTotal ?? 0);
    } catch {
      setInvValuation(null);
      setYearOpex(0);
    }
  }, [year]);

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

  const handleRefresh = () => {
    invalidateAdminAnalyticsCache();
    refresh();
    reloadPeriod();
    loadInventory();
  };

  if (isLoading && !analytics) {
    return (
      <div className="p-4 sm:p-6 xl:p-8 space-y-6 animate-pulse max-w-[1600px] mx-auto min-h-[calc(100dvh-4rem)] bg-[#FAF9F6]">
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
      <div className="p-6 xl:p-8 max-w-3xl mx-auto min-h-[calc(100dvh-4rem)] bg-[#FAF9F6]">
        <AdminPageHeader title="Revenue" description="Financial and profit intelligence." />
        <div className="mt-8">
          <AdminErrorState onRetry={() => load(false)} />
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const { overview } = analytics;
  const periodData = summary;
  const periodOverview = periodData?.overview;
  const feesRetained =
    periodOverview?.nonRefundableFeesRetained ?? overview.nonRefundableFeesRetained ?? 0;
  const gross = periodOverview?.grossRevenue ?? overview.totalRevenue;
  const refunded = periodOverview?.refunds ?? overview.refundedAmount ?? 0;
  const netLike = periodOverview?.netRevenue ?? Math.max(0, gross - refunded);
  const finInput = periodOverview
    ? {
        ...periodOverview,
        grossMarginPercent: periodOverview.grossMarginPercent,
        couponOrdersTotal: periodOverview.couponOrdersCount,
      }
    : overview;

  const fin = buildFinancialSnapshot(
    finInput,
    refunded,
    feesRetained,
    period === 'year' ? yearOpex : period === 'lifetime' ? yearOpex : 0,
    { usePeriodFields: !!periodOverview },
  );

  const couponTotal = periodOverview?.couponDiscountTotal ?? overview.couponDiscountTotal ?? 0;
  const couponOrders = periodOverview?.couponOrdersCount ?? overview.couponOrdersTotal ?? 0;
  const shippingTotal = periodOverview?.shippingCollected ?? overview.shippingCollected ?? 0;
  const codTotal = periodOverview?.codFeeCollected ?? overview.codFeeCollected ?? 0;
  const taxTotal = periodOverview?.taxCollected ?? overview.taxCollected ?? 0;
  const feesKept = periodOverview?.nonRefundableFeesRetained ?? feesRetained;

  const revenueByMonth = periodData?.revenueByMonth ?? analytics.revenueByMonth;
  const profitByMonth = periodData?.profitByMonth ?? analytics.profitByMonth ?? [];
  const refundsByMonth = periodData?.refundsByMonth ?? analytics.refundsByMonth ?? [];
  const productsByProfit = periodData?.topProductsByProfit ?? analytics.topProductsByProfit ?? [];
  const categoryProfit = periodData?.categoryProfit ?? analytics.categoryProfit ?? [];

  const chartSubtitle =
    period === 'month'
      ? 'Last 12 months · hover for gross, net, product revenue & profit'
      : period === 'year'
        ? `${year} monthly · gross vs net vs product revenue`
        : 'Lifetime trend (recent months) · gross vs net vs profit';

  const refundRatePct =
    (periodOverview?.orders ?? overview.totalOrders) > 0
      ? ((periodOverview?.refundedOrdersCount ?? overview.refundedOrdersCount ?? 0) /
          (periodOverview?.orders ?? overview.totalOrders)) *
        100
      : 0;
  const retainRatePct = gross > 0 ? (netLike / gross) * 100 : 0;
  const opexForPeriod = period === 'year' && year === new Date().getFullYear() ? yearOpex : 0;

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Financial Overview', icon: LineChart },
    { id: 'profitability', label: 'Profitability', icon: Box },
    { id: 'leakage', label: 'Leakage & Stock', icon: AlertCircle },
  ];

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-[#FAF9F6]">
      <div className="p-4 sm:p-6 xl:p-8 space-y-6 sm:space-y-8 max-w-[1600px] mx-auto pb-12">
        <AdminPageHeader
          title="Revenue & profit"
          badge="Finance"
          description="Gross cash flow, net revenue after refunds, product profit. Live order data."
          actions={
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl border-gray-200 bg-white shadow-sm hover:bg-gray-50 transition-colors"
                onClick={handleRefresh}
                disabled={isRefreshing || periodLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isRefreshing || periodLoading ? 'animate-spin' : ''}`}
                />
                Refresh
              </Button>
              <Link
                href="/admin/expenses"
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:border-brand-300 shadow-sm transition-all hover:scale-105"
              >
                Operating costs <ArrowUpRight className="h-4 w-4 text-brand-600" />
              </Link>
            </>
          }
        />

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <RevenuePeriodToolbar
            period={period}
            year={year}
            years={years}
            onPeriodChange={setPeriod}
            onYearChange={setYear}
            periodLabel={periodData?.label}
          />
          <div className="rounded-xl border border-gray-200/80 bg-white/80 px-4 py-2.5 shadow-sm flex items-center gap-2 text-sm text-gray-600 backdrop-blur-sm">
            <CalendarRange className="h-4 w-4 text-brand-600 shrink-0" />
            <span>
              As of <time dateTime={new Date().toISOString()}>{asOfLabel}</time>
            </span>
          </div>
        </div>

        {opexForPeriod > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-sm animate-in slide-in-from-top-2">
            <p className="text-amber-900">
              <strong>{formatPrice(opexForPeriod)}</strong> operating costs logged for {year} are deducted in the
              profit flow when viewing this year.
            </p>
            <Link
              href="/admin/expenses"
              className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline shrink-0"
            >
              Manage costs <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="sticky -top-2 sm:-top-2 z-40 bg-[#FAF9F6]/95 backdrop-blur-xl pt-2 pb-0 -mt-2 border-b border-gray-200/60 transition-all duration-300">
          <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-px">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-5 py-3 rounded-t-2xl text-sm font-bold transition-all duration-300 border-b-2",
                    isActive 
                      ? "bg-white text-navy-900 border-brand-600 shadow-[0_-4px_12px_-4px_rgba(0,0,0,0.05)]" 
                      : "text-gray-500 border-transparent hover:text-navy-700 hover:bg-white/60"
                  )}
                >
                  <Icon className={cn("h-4 w-4", isActive ? "text-brand-600" : "text-gray-400")} strokeWidth={isActive ? 2.5 : 2} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Contents */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          
          {/* ===================== OVERVIEW TAB ===================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6 sm:space-y-8">
              {periodLoading && !periodData ? (
                <div className="h-48 rounded-[1.5rem] bg-gray-100 animate-pulse" />
              ) : (
                <FinancialOverviewPanel fin={fin} />
              )}

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="rounded-[1.5rem] border border-gray-200/80 bg-white p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <h3 className="font-serif font-bold text-gray-900 flex items-center gap-2 mb-1">
                    <LineChart className="w-5 h-5 text-brand-600" />
                    Revenue vs profit
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">{chartSubtitle}</p>
                  {periodLoading ? (
                    <div className="h-[300px] rounded-2xl bg-gray-100 animate-pulse" />
                  ) : (
                    <RevenueVsProfitChart
                      revenueByMonth={revenueByMonth}
                      profitByMonth={profitByMonth}
                      refundsByMonth={refundsByMonth}
                      height={300}
                    />
                  )}
                </div>
                <div className="rounded-[1.5rem] border border-gray-100 bg-white p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <h3 className="font-serif font-bold text-gray-900 flex items-center gap-2 mb-1">
                    <PieChart className="w-5 h-5 text-brand-600" />
                    Cash retained
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">
                    {periodData?.label ?? 'Selected period'} — gross minus refunds
                  </p>
                  <RevenueCompositionDonut gross={gross} refunded={refunded} netLike={netLike} size="lg" />
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-gray-200/80 bg-white p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                <RevenueTrendAreaChart
                  data={revenueByMonth}
                  title="Gross revenue trend"
                  subtitle={`${periodData?.label ?? 'Period'} — monthly checkout totals`}
                  height={300}
                  smooth
                />
              </div>
            </div>
          )}

          {/* ===================== PROFITABILITY TAB ===================== */}
          {activeTab === 'profitability' && (
            <div className="space-y-6 sm:space-y-8">
              <section className="rounded-[1.5rem] border border-gray-200/90 bg-white shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
                <div className="px-5 sm:px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-white via-brand-50/30 to-white">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h2 className="font-serif text-lg sm:text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <Box className="w-5 h-5 text-brand-600" />
                        Product profit ledger
                      </h2>
                      <p className="text-xs text-gray-500 mt-1">
                        {periodData?.label ?? 'Period'} — tap a row for SKU breakdown
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-brand-100 text-brand-900 text-[11px] font-bold px-3 py-1">
                      {productsByProfit.length} SKUs ranked
                    </span>
                  </div>
                </div>
                <div className="p-4 sm:p-6">
                  {periodLoading ? (
                    <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
                  ) : (
                    <ProductProfitTable products={productsByProfit} />
                  )}
                </div>
              </section>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-8">
                <section className="xl:col-span-5 space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {periodData?.label ?? 'Period'} snapshot
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <MiniStat label="Gross revenue" value={formatPrice(fin.grossRevenue)} sub="Checkout totals" />
                    <MiniStat label="Net revenue" value={formatPrice(fin.netRevenue)} accent="navy" sub="After refunds" />
                    <MiniStat
                      label="Product revenue"
                      value={formatPrice(fin.productRevenue)}
                      sub="Paid line items"
                    />
                    <MiniStat label="Gross profit" value={formatPrice(fin.grossProfit)} accent="emerald" sub="− COGS" />
                    <MiniStat label="Refunds" value={formatPrice(refunded)} accent="amber" />
                    <MiniStat
                      label="Margin"
                      value={`${fin.grossMarginPct.toFixed(1)}%`}
                      sub="Gross profit ÷ product revenue"
                    />
                  </div>
                </section>

                <section className="xl:col-span-7 space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5" />
                    Profit by category · {periodData?.label ?? 'period'}
                  </p>
                  <div className="rounded-[1.5rem] border border-gray-100 bg-white p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow duration-300 min-h-[200px]">
                    {categoryProfit.length === 0 ?
                      <p className="text-sm text-gray-500 py-8 text-center">No category profit data for this period.</p>
                    : <CategoryProfitPanel rows={categoryProfit} />}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <MiniStat
                      label="Orders"
                      value={(periodOverview?.orders ?? overview.totalOrders)?.toLocaleString() ?? '—'}
                      sub="In selected period"
                    />
                    <MiniStat
                      label="AOV"
                      value={formatPrice(
                        (periodOverview?.orders ?? 0) > 0
                          ? gross / (periodOverview?.orders ?? 1)
                          : overview.avgOrderValue ?? 0,
                      )}
                    />
                    <MiniStat label="Refund rate" value={`${refundRatePct.toFixed(1)}%`} accent="amber" />
                    <MiniStat label="Cash retention" value={`${retainRatePct.toFixed(1)}%`} accent="emerald" />
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* ===================== LEAKAGE & STOCK TAB ===================== */}
          {activeTab === 'leakage' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="rounded-[1.5rem] border border-gray-100 bg-white p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow duration-300 space-y-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Revenue leakage & fees · {periodData?.label ?? 'period'}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <LeakCard
                    label="Coupon discounts"
                    value={formatPrice(couponTotal)}
                    sub={`${couponOrders} orders with codes`}
                    tone="red"
                  />
                  <LeakCard label="Shipping collected" value={formatPrice(shippingTotal)} />
                  <LeakCard label="COD fees" value={formatPrice(codTotal)} />
                  <LeakCard
                    label="GST collected"
                    value={formatPrice(taxTotal)}
                    tone="emerald"
                  />
                  <LeakCard
                    label="Fees kept on refunds"
                    value={formatPrice(feesKept)}
                    tone="emerald"
                    className="col-span-2"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-700 mb-3">
                    Payment mix · {periodData?.label ?? 'period'}
                  </p>
                  <PaymentMethodMixPanel
                    rows={periodData?.paymentMethodMix ?? analytics.paymentMethodMix ?? []}
                    grossTotal={gross}
                  />
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">
                  Stock vs realized profit
                </h3>
                <InventorySnapshotPanel
                  valuation={invValuation}
                  stockHealth={analytics.stockHealth}
                  compact
                />
                <p className="text-[11px] text-gray-500 leading-relaxed px-1 bg-white/50 backdrop-blur-sm p-3 rounded-xl border border-gray-200/50">
                  Inventory panel shows <strong>potential</strong> margin on unsold stock. Product ledger shows{' '}
                  <strong>realized</strong> margin for the selected period.
                </p>
              </section>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
