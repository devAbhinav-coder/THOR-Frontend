'use client';

import { useMemo, useState } from 'react';
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
  UserPlus,
  Receipt,
  CreditCard,
  Target,
  Package,
  LineChart,
  Eye,
} from 'lucide-react';
import { formatPrice, cn } from '@/lib/utils';
import { formatRevenueGrowthSub, revenueGrowthBadgeValue } from '@/lib/revenueMetrics';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminErrorState from '@/components/admin/AdminErrorState';
import { Button } from '@/components/ui/button';
import {
  CategoryRevenueBarChart,
  DailyOrdersRevenueChart,
  DailySiteVisitsChart,
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
  VisitInsightsPanel,
  MarketingInsightsPanel,
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
      <div className="p-4 sm:p-6 space-y-4 animate-pulse max-w-[1600px] mx-auto min-h-[calc(100dvh-4rem)] bg-[#FAF9F6]">
        <div className="h-7 w-48 bg-gray-200 rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl" />
          ))}
        </div>
        <div className="h-[200px] bg-gray-100 rounded-xl" />
      </div>
    );
  }

  if (!isLoading && loadError && !analytics) {
    return (
      <div className="p-6 max-w-3xl mx-auto min-h-[calc(100dvh-4rem)] bg-[#FAF9F6]">
        <AdminPageHeader
          title="Analytics"
          description="Merchandising, traffic, and category performance."
        />
        <div className="mt-6">
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

  const tabs: { id: Tab; label: string; icon: typeof LineChart }[] = [
    { id: 'sales', label: 'Sales & Traffic', icon: LineChart },
    { id: 'catalogue', label: 'Catalogue', icon: Package },
    { id: 'customers', label: 'Customers', icon: Users },
  ];

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-[#FAF9F6]">
      <div className="p-4 sm:p-5 space-y-3 max-w-[1600px] mx-auto pb-8">
        <AdminPageHeader
          title="Analytics & insights"
          badge="Merchandising"
          description="Traffic, conversion, categories, and peak hours — live from your store data."
          actions={
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-lg border-gray-200 bg-white"
                onClick={refresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Link
                href="/admin/revenue"
                className="inline-flex items-center gap-1.5 rounded-lg border border-navy-200 bg-navy-900 px-3 py-2 text-sm font-semibold text-white"
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

        <div className="sticky -top-2 z-40 bg-[#FAF9F6]/95 backdrop-blur-xl pt-1 -mt-1 border-b border-gray-200/60">
          <div className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 rounded-t-xl text-xs font-bold transition-all border-b-2',
                    isActive
                      ? 'bg-white text-navy-900 border-brand-600'
                      : 'text-gray-500 border-transparent hover:text-navy-700 hover:bg-white/60',
                  )}
                >
                  <Icon className={cn('h-3.5 w-3.5', isActive ? 'text-brand-600' : 'text-gray-400')} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="animate-in fade-in duration-300">
          {activeTab === 'sales' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <AdminMetricCard
                  compact
                  label="MTD gross"
                  value={formatPrice(overview.monthRevenue)}
                  sub={formatRevenueGrowthSub(overview.revenueGrowth, overview.monthRevenue)}
                  icon={TrendingUp}
                  growth={revenueGrowthBadgeValue(overview.revenueGrowth)}
                />
                <AdminMetricCard
                  compact
                  label="Website visits"
                  value={(overview.totalSiteVisits ?? 0).toLocaleString()}
                  sub={`${overview.siteVisitsToday ?? 0} today · ${overview.siteVisitsMtd ?? 0} MTD`}
                  icon={Eye}
                />
                <AdminMetricCard
                  compact
                  label="Avg. order value"
                  value={formatPrice(overview.avgOrderValue)}
                  sub={`${overview.paidOrdersCount || 0} paid orders`}
                  icon={Receipt}
                />
                <AdminMetricCard
                  compact
                  label="Avg. PDP conversion"
                  value={`${avgConversion}%`}
                  sub={`${overview.totalPdpViews ?? 0} product page views`}
                  icon={Target}
                  variant="success"
                />
              </div>

              {(analytics.visitsByDay?.length ?? 0) > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                  <DailySiteVisitsChart
                    data={analytics.visitsByDay ?? []}
                    height={150}
                    title="Daily website visits"
                    subtitle="Unique browser sessions · IST · 1 per tab session per day"
                  />
                </div>
              )}

              <VisitInsightsPanel insights={analytics.visitInsights} />
              <div id="meta-ads">
                <MarketingInsightsPanel
                  marketingInsights={analytics.marketingInsights}
                  visitCampaigns={analytics.visitInsights?.byCampaign}
                />
              </div>

              {(analytics.revenueByDay?.length ?? 0) > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                  <DailyOrdersRevenueChart
                    data={analytics.revenueByDay ?? []}
                    height={170}
                    title="Daily orders & revenue"
                    subtitle="Last 30 days · IST · gross"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 items-start">
                <div className="lg:col-span-8 rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                  <h2 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5 mb-2">
                    <Clock className="h-3.5 w-3.5 text-brand-600" />
                    Peak order times (IST)
                  </h2>
                  <PeakHoursChart data={analytics.ordersByHour ?? []} />
                </div>
                <div className="lg:col-span-4 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                  <OrdersMixPieChart
                    data={analytics.ordersByStatus}
                    totalOrders={overview.totalOrders}
                    height={160}
                    title="Order pipeline"
                    subtitle="Status mix"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'catalogue' && (
            <div className="space-y-3">
              <StorefrontDemandSection
                topViewed={topViewed}
                totalPdpViews={overview.totalPdpViews}
                productsWithViews={overview.productsWithViews}
              />

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-start">
                <div className="xl:col-span-8 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                  <CategoryRevenueBarChart
                    data={revenueByCat}
                    height={Math.min(220, 56 + revenueByCat.length * 24)}
                    title="Revenue by category"
                    subtitle="Paid orders · line revenue"
                  />
                </div>
                <div className="xl:col-span-4 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                  <h2 className="text-sm font-bold text-gray-900 mb-2">Top sellers (paid)</h2>
                  <TopSellersList products={analytics.topProducts} />
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 items-start">
                <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                  <VariantSizePanel rows={analytics.topVariantSizes ?? []} />
                </div>
                <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
                  <StockAlertsPanel
                    outOfStock={stockLists.out}
                    lowStockOnly={stockLists.low}
                    stockHealth={analytics.stockHealth}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'customers' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <AdminMetricCard
                  compact
                  label="Avg. lifetime value"
                  value={formatPrice(overview.avgLtv || 0)}
                  sub="Per paying customer"
                  icon={Users}
                  variant="navy"
                />
                <AdminMetricCard
                  compact
                  label="Repeat buyers"
                  value={`${overview.repeatRate || 0}%`}
                  sub={`${overview.repeatCustomers || 0} returned · ${overview.firstTimeBuyers ?? 0} first-time`}
                  icon={Repeat2}
                />
                <AdminMetricCard
                  compact
                  label="New signups (MTD)"
                  value={String(overview.newUsersThisMonth ?? 0)}
                  sub={`${overview.totalUsers || 0} registered accounts`}
                  icon={UserPlus}
                />
                <AdminMetricCard
                  compact
                  label="Unique buyers"
                  value={String(overview.totalCustomersWithOrders || 0)}
                  sub="Paid orders · login required"
                  icon={ShoppingBag}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
                <div className="lg:col-span-8 rounded-xl border border-navy-800 bg-gradient-to-br from-navy-900 to-navy-950 p-3 shadow-lg text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Megaphone className="h-4 w-4 text-brand-300" />
                    <h3 className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
                      Retention signals
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { label: 'Cancellation', value: `${overview.cancellationRate || 0}%`, tone: 'text-red-400' },
                      { label: 'Coupon orders', value: String(overview.couponOrdersTotal || 0), tone: 'text-brand-300' },
                      { label: 'Coupon discount', value: formatPrice(overview.couponDiscountTotal || 0), tone: 'text-brand-400' },
                      { label: 'Reviews MTD', value: String(overview.reviewsThisMonth ?? 0), tone: 'text-white' },
                    ].map((item) => (
                      <div key={item.label}>
                        <p className="text-[9px] text-white/50 uppercase mb-0.5">{item.label}</p>
                        <p className={`text-lg font-bold tabular-nums ${item.tone}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] text-white/40 mt-2 border-t border-white/10 pt-1.5">
                    Website visits = anyone browsing the store · Buyers = logged-in paid orders only.
                  </p>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-2">
                  <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm flex-1">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                      Order source
                    </h3>
                    <ChannelSplitBar
                      onlineRevenue={overview.onlineRevenue || 0}
                      offlineRevenue={overview.offlineRevenue || 0}
                      onlineCount={overview.onlineCount || 0}
                      offlineCount={overview.offlineCount || 0}
                    />
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="h-4 w-4 text-navy-700" />
                      <div>
                        <h2 className="text-sm font-semibold text-gray-900">Payment mix</h2>
                        <p className="text-[10px] text-gray-500">Share of gross checkout</p>
                      </div>
                    </div>
                    <PaymentMethodMixPanel rows={paymentMix} grossTotal={gross} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <AdminMetricCard
                  compact
                  label="Website visits today"
                  value={String(overview.siteVisitsToday ?? 0)}
                  sub={`${overview.siteVisitsMtd ?? 0} MTD · ${overview.totalSiteVisits ?? 0} all time`}
                  icon={Eye}
                />
                <AdminMetricCard
                  compact
                  label="Online vs offline"
                  value={formatPrice(overview.onlineRevenue || 0)}
                  sub={`${overview.onlineCount || 0} online · ${overview.offlineCount || 0} offline`}
                  icon={ShoppingBag}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
