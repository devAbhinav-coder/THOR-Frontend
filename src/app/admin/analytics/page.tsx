"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminErrorState from "@/components/admin/AdminErrorState";
import { Button } from "@/components/ui/button";
import {
  CategoryRevenueBarChart,
  DailyOrdersRevenueChart,
  OrdersMixPieChart,
} from "@/components/admin/charts";
import { useAdminAnalytics } from "@/hooks/useAdminAnalytics";
import {
  AdminCrossNav,
  AdminMetricCard,
  PaymentMethodMixPanel,
  StockAlertsPanel,
} from "@/components/admin/dashboard";
import {
  PeakHoursChart,
  VariantSizePanel,
  TopSellersList,
  ChannelSplitBar,
  StorefrontDemandSection,
} from "@/components/admin/analytics";

const SECTION_LINKS = [
  { id: "storefront-demand", label: "Traffic hub" },
  { id: "sales-trends", label: "Sales trends" },
  { id: "catalogue", label: "Catalogue" },
  { id: "operations", label: "Operations" },
] as const;

export default function AnalyticsPage() {
  const { analytics, isLoading, loadError, isRefreshing, load, refresh } = useAdminAnalytics();
  const [hashTarget, setHashTarget] = useState<string | null>(null);

  useEffect(() => {
    const scrollToHash = () => {
      const id = window.location.hash.replace("#", "");
      if (!id) return;
      setHashTarget(id);
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    };
    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, [analytics]);

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
      <div className="p-4 sm:p-6 xl:p-8 space-y-6 animate-pulse max-w-[1600px] mx-auto">
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
      <div className="p-6 xl:p-8 max-w-3xl mx-auto">
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

  return (
    <div className="bg-gradient-to-b from-slate-50/90 via-white to-white">
      <div className="p-4 sm:p-6 xl:p-8 space-y-6 max-w-[1600px] mx-auto pb-8">
        <AdminPageHeader
          title="Analytics & insights"
          badge="Merchandising"
          description="Traffic, conversion, categories, and peak hours. Financial depth lives on Revenue; live ops on Dashboard."
          actions={
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl border-gray-200 bg-white shadow-sm"
                onClick={refresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Link
                href="/admin/revenue"
                className="inline-flex items-center gap-1.5 rounded-xl border border-navy-200 bg-gradient-to-br from-navy-900 to-navy-950 px-3 py-2 text-sm font-semibold text-white shadow-md"
              >
                <IndianRupee className="h-4 w-4 text-gold-300" />
                Revenue
              </Link>
            </>
          }
        />

        <nav
          className="flex flex-wrap gap-2 p-1 rounded-xl border border-gray-200 bg-white shadow-sm"
          aria-label="Jump to section"
        >
          {SECTION_LINKS.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className="rounded-lg px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-brand-50 hover:text-brand-800 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <AdminCrossNav
          items={[
            {
              label: "Revenue intelligence",
              href: "/admin/revenue",
              description: "Gross, refunds, net retained, payment mix, and tax.",
              accent: "border-navy-100 bg-navy-50/30 hover:border-navy-200",
            },
            {
              label: "Operations dashboard",
              href: "/admin",
              description: "Today’s orders, fulfilment queue, and recent activity.",
              accent: "border-brand-100 bg-brand-50/30 hover:border-brand-200",
            },
          ]}
        />

        {/* Core merchandising KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <AdminMetricCard
            label="Avg. lifetime value"
            value={formatPrice(overview.avgLtv || 0)}
            sub="Per paying customer"
            icon={Users}
            variant="navy"
          />
          <AdminMetricCard
            label="Repeat rate"
            value={`${overview.repeatRate || 0}%`}
            sub={`${overview.repeatCustomers || 0} repeat buyers`}
            icon={Repeat2}
          />
          <AdminMetricCard
            label="Avg. PDP conversion"
            value={`${avgConversion}%`}
            sub="Across top viewed SKUs"
            icon={Target}
            variant="success"
          />
          <AdminMetricCard
            label="MTD gross"
            value={formatPrice(overview.monthRevenue)}
            sub={`${overview.revenueGrowth >= 0 ? "+" : ""}${overview.revenueGrowth}% vs last month`}
            icon={TrendingUp}
            growth={overview.revenueGrowth}
          />
        </div>

        {/* Secondary funnel row — uses product + order model signals already in API */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Avg. order value",
              value: formatPrice(overview.avgOrderValue),
              sub: `${overview.paidOrdersCount || 0} paid orders`,
              icon: Receipt,
            },
            {
              label: "New signups (MTD)",
              value: String(overview.newUsersThisMonth ?? 0),
              sub: `${overview.totalUsers || 0} total customers`,
              icon: UserPlus,
            },
            {
              label: "Reviews (MTD)",
              value: String(overview.reviewsThisMonth ?? 0),
              sub: `${overview.totalReviews || 0} all time`,
              icon: Star,
            },
            {
              label: "Online vs offline",
              value: formatPrice(overview.onlineRevenue || 0),
              sub: `${overview.onlineCount || 0} online · ${overview.offlineCount || 0} offline`,
              icon: ShoppingBag,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
            >
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <item.icon className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
              </div>
              <p className="text-lg font-bold text-gray-900 tabular-nums">{item.value}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{item.sub}</p>
            </div>
          ))}
        </div>

        <StorefrontDemandSection
          topViewed={topViewed}
          highlightNav={hashTarget === "storefront-demand"}
        />

        {/* Channel + retention */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
          <div className="lg:col-span-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
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

          <div className="lg:col-span-8 rounded-2xl border border-navy-800 bg-gradient-to-br from-navy-900 via-navy-950 to-navy-900 p-5 sm:p-6 shadow-xl text-white">
            <div className="flex items-center gap-2 mb-4">
              <Megaphone className="h-4 w-4 text-gold-300" />
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">
                Marketing & retention signals
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] text-white/40 uppercase">Cancellation rate</p>
                <p className="text-2xl font-bold text-red-400 tabular-nums">{overview.cancellationRate || 0}%</p>
              </div>
              <div>
                <p className="text-[10px] text-white/40 uppercase">Unique buyers</p>
                <p className="text-2xl font-bold tabular-nums">{overview.totalCustomersWithOrders || 0}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/40 uppercase">Coupon orders</p>
                <p className="text-2xl font-bold text-purple-300 tabular-nums">{overview.couponOrdersTotal || 0}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/40 uppercase">Coupon discount</p>
                <p className="text-2xl font-bold text-gold-400 tabular-nums">
                  {formatPrice(overview.couponDiscountTotal || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {(analytics.revenueByDay?.length ?? 0) > 0 && (
          <div
            id="sales-trends"
            className="scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm"
          >
            <DailyOrdersRevenueChart
              data={analytics.revenueByDay ?? []}
              height={300}
              title="Daily orders & revenue"
              subtitle="Last 30 days · Asia/Kolkata · gross (paid + refunded)"
            />
          </div>
        )}

        <div
          id="catalogue"
          className="scroll-mt-24 grid grid-cols-1 xl:grid-cols-12 gap-4 lg:gap-5 items-start"
        >
          <div className="xl:col-span-12 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
            <CategoryRevenueBarChart
              data={revenueByCat}
              height={Math.min(280, 72 + revenueByCat.length * 32)}
              title="Revenue by category"
              subtitle="Paid orders · line revenue by catalog category"
            />
            <VariantSizePanel rows={analytics.topVariantSizes ?? []} />
          </div>
        </div>

        <div
          id="operations"
          className="scroll-mt-24 rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm"
        >
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

        {/* Bottom intelligence grid — equal-height cards, no stretch gaps */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-start">
          <div className="lg:col-span-4 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
            <h2 className="font-serif font-bold text-gray-900 mb-3">Top sellers (paid)</h2>
            <TopSellersList products={analytics.topProducts} />
          </div>

          <div className="lg:col-span-4 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5 text-navy-700" />
              <div>
                <h2 className="font-semibold text-gray-900">Payment mix</h2>
                <p className="text-xs text-gray-500">Share of gross checkout value</p>
              </div>
            </div>
            <PaymentMethodMixPanel rows={paymentMix} grossTotal={gross} />
          </div>

          <div className="lg:col-span-4 rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5 shadow-sm">
            <OrdersMixPieChart
              data={analytics.ordersByStatus}
              totalOrders={overview.totalOrders}
              height={220}
              title="Order pipeline"
              subtitle="Status mix — fulfilment health"
            />
          </div>
        </div>

        <StockAlertsPanel
          outOfStock={stockLists.out}
          lowStockOnly={stockLists.low}
          stockHealth={analytics.stockHealth}
          compact
        />
      </div>
    </div>
  );
}
