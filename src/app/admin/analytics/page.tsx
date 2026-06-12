'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Clock,
  RefreshCw,
  IndianRupee,
  Megaphone,
  Users,
  Repeat2,
  TrendingUp,
  ShoppingBag,
  Star,
  UserPlus,
  Receipt,
  CreditCard,
  Target,
  Package,
  LineChart,
} from 'lucide-react';
import { formatPrice, cn } from '@/lib/utils';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminErrorState from '@/components/admin/AdminErrorState';
import { Button } from '@/components/ui/button';
import {
  CategoryRevenueBarChart,
  DailyOrdersRevenueChart,
  OrdersMixPieChart,
} from '@/components/admin/charts';
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics';
import {
  AdminCrossNav,
  AdminMetricCard,
  PaymentMethodMixPanel,
  StockAlertsPanel,
} from '@/components/admin/dashboard';
import {
  PeakHoursChart,
  VariantSizePanel,
  TopSellersList,
  ChannelSplitBar,
  StorefrontDemandSection,
} from '@/components/admin/analytics';

type Tab = 'sales' | 'catalogue' | 'customers';

export default function AnalyticsPage() {
  const { analytics, isLoading, loadError, isRefreshing, load, refresh } = useAdminAnalytics();
  const [activeTab, setActiveTab] = useState<Tab>('sales');

  const stockLists = useMemo(() => {
    if (!analytics) return { out: [], low: [] };
    const out =
      analytics.outOfStockProducts ??
      analytics.lowStockProducts.filter((p) => p.totalStock === 0);
    const low =
      analytics.lowStockOnlyProducts ??
      analytics.lowStockProducts.filter((p) => p.totalStock > 0);
    return { out, low };
  }, [analytics]);

  const avgConversion = useMemo(() => {
    const rows = analytics?.topViewedProducts ?? [];
    if (!rows.length) return 0;
    const sum = rows.reduce((s, p) => s + (p.conversionPercent || 0), 0);
    return Math.round((sum / rows.length) * 10) / 10;
  }, [analytics?.topViewedProducts]);

  if (isLoading && !analytics) {
    return (
      <div className="p-4 sm:p-6 xl:p-8 space-y-6 animate-pulse max-w-[1600px] mx-auto min-h-[calc(100dvh-4rem)] bg-[#FAF9F6]">
        <div className="h-8 w-56 bg-gray-200 rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-2xl" />
          ))}
        </div>
        <div className="h-[300px] bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  if (!isLoading && loadError && !analytics) {
    return (
      <div className="p-6 xl:p-8 max-w-3xl mx-auto min-h-[calc(100dvh-4rem)] bg-[#FAF9F6]">
        <AdminPageHeader
          title="Analytics"
          description="Merchandising, traffic, and category performance."
        />
        <div className="mt-8">
          <AdminErrorState onRetry={() => load(false)} />
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const { overview } = analytics;
  const topViewed = analytics.topViewedProducts ?? [];
  const revenueByCat = analytics.revenueByCategory ?? [];
  const paymentMix = analytics.paymentMethodMix ?? [];
  const gross = overview.totalRevenue;

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'sales', label: 'Sales & Traffic', icon: LineChart },
    { id: 'catalogue', label: 'Catalogue & Products', icon: Package },
    { id: 'customers', label: 'Customers & Retention', icon: Users },
  ];

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-[#FAF9F6]">
      <div className="p-4 sm:p-6 xl:p-8 space-y-6 sm:space-y-8 max-w-[1600px] mx-auto pb-12">
        <AdminPageHeader
          title="Analytics & insights"
          badge="Merchandising"
          description="Deep dive into traffic, conversion, category performance, and peak hours."
          actions={
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl border-gray-200 bg-white shadow-sm hover:bg-gray-50 transition-colors"
                onClick={refresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Link
                href="/admin/revenue"
                className="inline-flex items-center gap-1.5 rounded-xl border border-navy-200 bg-gradient-to-br from-navy-900 to-navy-950 px-3 py-2 text-sm font-semibold text-white shadow-md transition-all hover:scale-105 active:scale-95"
              >
                <IndianRupee className="h-4 w-4 text-brand-300" />
                Revenue
              </Link>
            </>
          }
        />

        <AdminCrossNav
          items={[
            {
              label: 'Revenue intelligence',
              href: '/admin/revenue',
              description: 'Gross, refunds, net retained, payment mix, and tax.',
              accent: 'border-navy-100 bg-navy-50/30 hover:border-navy-200',
            },
            {
              label: 'Operations dashboard',
              href: '/admin',
              description: 'Today’s orders, fulfilment queue, and recent activity.',
              accent: 'border-brand-100 bg-brand-50/30 hover:border-brand-200',
            },
          ]}
        />

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

          {/* ===================== SALES & TRAFFIC TAB ===================== */}
          {activeTab === 'sales' && (
            <div className="space-y-6 sm:space-y-8">
              {/* Core KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <AdminMetricCard
                  label="MTD gross"
                  value={formatPrice(overview.monthRevenue)}
                  sub={`${overview.revenueGrowth >= 0 ? '+' : ''}${overview.revenueGrowth}% vs last month`}
                  icon={TrendingUp}
                  growth={overview.revenueGrowth}
                  className="hover:-translate-y-1 transition-transform duration-300"
                />
                <AdminMetricCard
                  label="Avg. order value"
                  value={formatPrice(overview.avgOrderValue)}
                  sub={`${overview.paidOrdersCount || 0} paid orders`}
                  icon={Receipt}
                  className="hover:-translate-y-1 transition-transform duration-300"
                />
                <AdminMetricCard
                  label="Online vs offline"
                  value={formatPrice(overview.onlineRevenue || 0)}
                  sub={`${overview.onlineCount || 0} online · ${overview.offlineCount || 0} offline`}
                  icon={ShoppingBag}
                  className="hover:-translate-y-1 transition-transform duration-300"
                />
                <AdminMetricCard
                  label="Avg. PDP conversion"
                  value={`${avgConversion}%`}
                  sub="Across top viewed SKUs"
                  icon={Target}
                  variant="success"
                  className="hover:-translate-y-1 transition-transform duration-300"
                />
              </div>

              {(analytics.revenueByDay?.length ?? 0) > 0 && (
                <div className="rounded-[1.5rem] border border-gray-200/80 bg-white p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <DailyOrdersRevenueChart
                    data={analytics.revenueByDay ?? []}
                    height={300}
                    title="Daily orders & revenue"
                    subtitle="Last 30 days · Asia/Kolkata · gross (paid + refunded)"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8 rounded-[1.5rem] border border-gray-100 bg-white p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="mb-4">
                    <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-brand-600" />
                      Peak order times (IST)
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Plan email sends, ads, and staffing around high-velocity hours.
                    </p>
                  </div>
                  <PeakHoursChart data={analytics.ordersByHour ?? []} />
                </div>
                <div className="lg:col-span-4 rounded-[1.5rem] border border-gray-200/80 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <OrdersMixPieChart
                    data={analytics.ordersByStatus}
                    totalOrders={overview.totalOrders}
                    height={220}
                    title="Order pipeline"
                    subtitle="Status mix — fulfilment health"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ===================== CATALOGUE & PRODUCTS TAB ===================== */}
          {activeTab === 'catalogue' && (
            <div className="space-y-6 sm:space-y-8">
              <StorefrontDemandSection
                topViewed={topViewed}
              />

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                <div className="xl:col-span-8 rounded-[1.5rem] border border-gray-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <CategoryRevenueBarChart
                    data={revenueByCat}
                    height={Math.min(320, 100 + revenueByCat.length * 32)}
                    title="Revenue by category"
                    subtitle="Paid orders · line revenue by catalog category"
                  />
                </div>
                <div className="xl:col-span-4 rounded-[1.5rem] border border-gray-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <h2 className="font-serif font-bold text-gray-900 mb-3">Top sellers (paid)</h2>
                  <TopSellersList products={analytics.topProducts} />
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                <div className="rounded-[1.5rem] border border-gray-200/80 bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
                  <VariantSizePanel rows={analytics.topVariantSizes ?? []} />
                </div>
                <div className="rounded-[1.5rem] bg-white border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
                  <StockAlertsPanel
                    outOfStock={stockLists.out}
                    lowStockOnly={stockLists.low}
                    stockHealth={analytics.stockHealth}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ===================== CUSTOMERS & RETENTION TAB ===================== */}
          {activeTab === 'customers' && (
            <div className="space-y-6 sm:space-y-8">
              {/* Customer KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <AdminMetricCard
                  label="Avg. lifetime value"
                  value={formatPrice(overview.avgLtv || 0)}
                  sub="Per paying customer"
                  icon={Users}
                  variant="navy"
                  className="hover:-translate-y-1 transition-transform duration-300"
                />
                <AdminMetricCard
                  label="Repeat rate"
                  value={`${overview.repeatRate || 0}%`}
                  sub={`${overview.repeatCustomers || 0} repeat buyers`}
                  icon={Repeat2}
                  className="hover:-translate-y-1 transition-transform duration-300"
                />
                <AdminMetricCard
                  label="New signups (MTD)"
                  value={String(overview.newUsersThisMonth ?? 0)}
                  sub={`${overview.totalUsers || 0} total customers`}
                  icon={UserPlus}
                  className="hover:-translate-y-1 transition-transform duration-300"
                />
                <AdminMetricCard
                  label="Reviews (MTD)"
                  value={String(overview.reviewsThisMonth ?? 0)}
                  sub={`${overview.totalReviews || 0} all time`}
                  icon={Star}
                  className="hover:-translate-y-1 transition-transform duration-300"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 rounded-[1.5rem] border border-navy-800 bg-gradient-to-br from-navy-900 via-navy-950 to-navy-900 p-6 sm:p-8 shadow-xl text-white group relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl transition-transform duration-700 group-hover:scale-110" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-6">
                      <Megaphone className="h-5 w-5 text-brand-300" />
                      <h3 className="text-sm font-bold text-white/60 uppercase tracking-widest">
                        Marketing & retention signals
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                      <div>
                        <p className="text-[11px] text-white/50 uppercase tracking-wider mb-1">Cancellation rate</p>
                        <p className="text-3xl font-bold text-red-400 tabular-nums">{overview.cancellationRate || 0}%</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-white/50 uppercase tracking-wider mb-1">Unique buyers</p>
                        <p className="text-3xl font-bold tabular-nums">{overview.totalCustomersWithOrders || 0}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-white/50 uppercase tracking-wider mb-1">Coupon orders</p>
                        <p className="text-3xl font-bold text-brand-300 tabular-nums">{overview.couponOrdersTotal || 0}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-white/50 uppercase tracking-wider mb-1">Coupon discount</p>
                        <p className="text-3xl font-bold text-brand-400 tabular-nums">
                          {formatPrice(overview.couponDiscountTotal || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-6">
                  <div className="rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow duration-300 flex-1">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                      Order source
                    </h3>
                    <ChannelSplitBar
                      onlineRevenue={overview.onlineRevenue || 0}
                      offlineRevenue={overview.offlineRevenue || 0}
                      onlineCount={overview.onlineCount || 0}
                      offlineCount={overview.offlineCount || 0}
                    />
                  </div>
                  
                  <div className="rounded-[1.5rem] border border-gray-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center gap-2 mb-4">
                      <CreditCard className="h-5 w-5 text-navy-700" />
                      <div>
                        <h2 className="font-semibold text-gray-900">Payment mix</h2>
                        <p className="text-xs text-gray-500">Share of gross checkout value</p>
                      </div>
                    </div>
                    <PaymentMethodMixPanel rows={paymentMix} grossTotal={gross} />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
