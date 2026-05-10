"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/api";
import { DashboardAnalytics } from "@/types";
import { formatPrice, cn } from "@/lib/utils";
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Eye,
  Layers,
  Package,
  Star,
  Percent,
  ArrowUpRight,
  AlertCircle,
  RefreshCw,
  IndianRupee,
} from "lucide-react";
import { LOW_STOCK_ALERT_EXCLUSIVE_MAX } from "@/lib/inventoryConstants";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminErrorState from "@/components/admin/AdminErrorState";
import { Button } from "@/components/ui/button";
import {
  RevenueTrendAreaChart,
  CategoryRevenueBarChart,
  OrdersMixPieChart,
  DailyOrdersRevenueChart,
} from "@/components/admin/charts";

export default function AnalyticsPage() {
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
        toast.error("Could not refresh analytics.");
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  if (isLoading && !analytics) {
    return (
      <div className='p-6 xl:p-8 space-y-4 animate-pulse max-w-[1600px] mx-auto'>
        <div className='h-8 w-56 bg-gray-200 rounded' />
        <div className='grid grid-cols-2 xl:grid-cols-4 gap-4'>
          {[...Array(8)].map((_, i) => (
            <div key={i} className='h-24 bg-gray-100 rounded-xl' />
          ))}
        </div>
      </div>
    );
  }
  if (!isLoading && loadError && !analytics) {
    return (
      <div className='p-6 xl:p-8 max-w-3xl mx-auto'>
        <AdminPageHeader
          title='Analytics'
          description='Sales velocity, views, and category mix — same data as the dashboard, with more merchandising detail.'
        />
        <div className='mt-8'>
          <AdminErrorState onRetry={() => load(false)} />
        </div>
      </div>
    );
  }
  if (!analytics) return null;

  const { overview, revenueByMonth } = analytics;
  const topViewed = analytics.topViewedProducts ?? [];
  const revenueByCat = analytics.revenueByCategory ?? [];
  const primaryKpis = [
    {
      label: "Total revenue",
      value: formatPrice(overview.totalRevenue),
      sub: `${formatPrice(overview.monthRevenue)} this month · gross (paid + refunded)`,
      icon: TrendingUp,
    },
    {
      label: "Total orders",
      value: overview.totalOrders.toLocaleString(),
      sub: `${overview.monthOrders} this month`,
      icon: ShoppingBag,
    },
    {
      label: "Customers",
      value: overview.totalUsers.toLocaleString(),
      sub: `${overview.newUsersThisMonth} new`,
      icon: Users,
    },
    {
      label: "Catalogue",
      value: overview.totalProducts.toLocaleString(),
      sub: `${analytics.lowStockProducts?.length ?? 0} low stock (<${LOW_STOCK_ALERT_EXCLUSIVE_MAX} units)`,
      icon: Package,
    },
  ];

  const secondaryKpis = [
    {
      label: "Avg. order value",
      value: formatPrice(overview.avgOrderValue ?? 0),
      sub: "Gross order totals (paid + refunded)",
      icon: Percent,
    },
    {
      label: "Orders today",
      value: String(overview.ordersToday ?? 0),
      sub: "Since midnight (server)",
      icon: Package,
    },
    {
      label: "Revenue today",
      value: formatPrice(overview.revenueToday ?? 0),
      sub: "Gross · paid + refunded",
      icon: IndianRupee,
    },
    {
      label: "Awaiting fulfilment",
      value: String(overview.pendingFulfillmentCount ?? 0),
      sub: "Pending · Confirmed · Processing",
      icon: Layers,
    },
    {
      label: "Reviews",
      value: String(overview.totalReviews ?? 0),
      sub: `${overview.reviewsThisMonth ?? 0} this month`,
      icon: Star,
    },
  ];

  return (
    <div className='min-h-[calc(100dvh-4rem)] bg-gradient-to-b from-slate-50/90 via-white to-white'>
      <div className='p-4 sm:p-6 xl:p-8 space-y-8 max-w-[1600px] mx-auto'>
        <AdminPageHeader
          title='Analytics & insights'
          badge='Merchandising'
          description='Traffic, conversion, and category revenue — same API as Dashboard. Category/product sales exclude refunded orders; headline revenue on Dashboard/Revenue includes gross for paid + refunded.'
          actions={
            <>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='rounded-xl border-gray-200 bg-white shadow-sm'
                onClick={() => load(true)}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Link
                href='/admin/revenue'
                className='inline-flex items-center gap-1.5 rounded-xl border border-navy-200 bg-gradient-to-br from-navy-900 to-navy-950 px-3 py-2 text-sm font-semibold text-white hover:from-navy-800 hover:to-navy-900 transition-colors shadow-md'
              >
                <IndianRupee className='h-4 w-4 text-gold-300' />
                Revenue
              </Link>
              <Link
                href='/admin/products'
                className='inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:border-brand-300 hover:bg-brand-50/50 transition-colors shadow-sm'
              >
                Products <ArrowUpRight className='h-4 w-4 text-brand-600' />
              </Link>
            </>
          }
        />

        <div className='grid grid-cols-2 xl:grid-cols-4 gap-4'>
          {primaryKpis.map((item) => (
            <div
              key={item.label}
              className={cn(
                "group rounded-2xl border border-gray-100/90 bg-gradient-to-br from-white to-brand-50/20 p-4 shadow-sm",
                "hover:shadow-lg hover:border-brand-200/60 transition-all duration-200",
              )}
            >
              <div className='h-9 w-9 rounded-xl bg-gradient-to-br from-brand-50 to-white border border-brand-100/60 flex items-center justify-center mb-2 group-hover:border-brand-200'>
                <item.icon className='h-5 w-5 text-brand-600' />
              </div>
              <p className='text-xl font-bold font-serif text-gray-900 tabular-nums tracking-tight'>
                {item.value}
              </p>
              <p className='text-[11px] text-gray-500 mt-0.5'>{item.sub}</p>
              <p className='text-xs font-semibold text-gray-800 mt-1.5'>
                {item.label}
              </p>
            </div>
          ))}
        </div>

        <div className='grid grid-cols-2 xl:grid-cols-5 gap-4'>
          {secondaryKpis.map((item) => (
            <div
              key={item.label}
              className='rounded-2xl border border-navy-800 bg-gradient-to-br from-navy-900 via-navy-950 to-navy-900 p-4 text-white shadow-xl shadow-navy-950/25'
            >
              <div className='h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center mb-2 border border-white/10'>
                <item.icon className='h-4 w-4 text-gold-300' />
              </div>
              <p className='text-lg font-bold tabular-nums tracking-tight'>
                {item.value}
              </p>
              <p className='text-[11px] text-white/45 mt-0.5'>{item.sub}</p>
              <p className='text-xs font-medium text-white/90 mt-1'>
                {item.label}
              </p>
            </div>
          ))}
        </div>

        {(analytics.revenueByDay?.length ?? 0) > 0 && (
          <div className='rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.1)]'>
            <DailyOrdersRevenueChart
              data={analytics.revenueByDay ?? []}
              height={340}
              title='Daily orders & revenue'
              subtitle='Last 30 days · Asia/Kolkata · gross order totals (paid + refunded) and order count'
              titleRight={
                <span className='text-xs text-slate-400 hidden sm:inline'>
                  Hover for detail
                </span>
              }
            />
          </div>
        )}

        <div className='rounded-2xl border border-gray-200/80 bg-white p-5 sm:p-6 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.12)]'>
          <RevenueTrendAreaChart
            data={revenueByMonth}
            height={340}
            title='Revenue & orders over time'
            subtitle='Gross order totals, paid + refunded (area) and order count (line) — last 12 months'
          />
        </div>

        <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
          <div className='rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm'>
            <div className='flex items-start justify-between gap-3 mb-4'>
              <div>
                <h2 className='font-semibold text-gray-900 flex items-center gap-2'>
                  <Eye className='h-5 w-5 text-brand-600' />
                  Most viewed products
                </h2>
                <p className='text-xs text-gray-500 mt-1'>
                  PDP views (one per session). &quot;Conv.&quot; ≈ units sold ÷
                  views — rough signal for merchandising.
                </p>
              </div>
            </div>
            {topViewed.length === 0 ?
              <p className='text-gray-400 text-sm py-8 text-center'>
                Open product pages on the store to start collecting views.
              </p>
            : <div className='overflow-x-auto -mx-2'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='text-left text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-100'>
                      <th className='pb-2 pl-2'>#</th>
                      <th className='pb-2'>Product</th>
                      <th className='pb-2 text-right'>Views</th>
                      <th className='pb-2 text-right'>Sold</th>
                      <th className='pb-2 text-right'>Conv.</th>
                      <th className='pb-2 pr-2 w-10' />
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-50'>
                    {topViewed.map((p, i) => (
                      <tr key={String(p._id)} className='hover:bg-gray-50/80'>
                        <td className='py-2.5 pl-2 text-gray-400 font-medium'>
                          {i + 1}
                        </td>
                        <td className='py-2.5'>
                          <div className='flex items-center gap-2 min-w-0'>
                            <div className='h-9 w-9 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0'>
                              {p.image ?
                                <img
                                  src={p.image}
                                  alt=''
                                  className='h-full w-full object-cover'
                                />
                              : <div className='h-full w-full bg-gray-200' />}
                            </div>
                            <div className='min-w-0'>
                              <p className='font-medium text-gray-900 truncate max-w-[200px]'>
                                {p.name}
                              </p>
                              <p className='text-[11px] text-gray-400'>
                                {p.category}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className='py-2.5 text-right tabular-nums text-gray-700'>
                          {p.views.toLocaleString()}
                        </td>
                        <td className='py-2.5 text-right tabular-nums text-gray-700'>
                          {p.sold}
                        </td>
                        <td className='py-2.5 text-right tabular-nums text-brand-700 font-medium'>
                          {p.conversionPercent}%
                        </td>
                        <td className='py-2.5 pr-2'>
                          <Link
                            href={`/shop/${encodeURIComponent(p.slug)}`}
                            target='_blank'
                            className='text-brand-600 hover:text-brand-700 p-1 inline-flex'
                            aria-label='View on store'
                          >
                            <ArrowUpRight className='h-4 w-4' />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            }
          </div>

          <div className='rounded-2xl border border-gray-200/80 bg-white p-5 sm:p-6 shadow-sm'>
            <CategoryRevenueBarChart
              data={revenueByCat}
              height={Math.min(420, 120 + revenueByCat.length * 36)}
              title='Revenue by category'
              subtitle='Paid orders · bar length = relative revenue'
            />
          </div>
        </div>

        <div className='rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4'>
            <div className='flex items-center gap-2'>
              <AlertCircle className='h-5 w-5 text-amber-500 flex-shrink-0' />
              <div>
                <h2 className='font-semibold text-gray-900'>Low stock alert</h2>
                <p className='text-xs text-gray-400'>
                  Under {LOW_STOCK_ALERT_EXCLUSIVE_MAX} units total (variants
                  combined) — same rule as dashboard
                </p>
              </div>
            </div>
          </div>
          {(analytics.lowStockProducts?.length ?? 0) === 0 ?
            <p className='text-sm text-gray-500 py-4'>
              All products are well stocked.
            </p>
          : <div className='space-y-2 divide-y divide-gray-50'>
              {analytics.lowStockProducts.map((product) => (
                <div
                  key={String(product._id)}
                  className='flex items-center justify-between gap-3 py-3 first:pt-0'
                >
                  <div className='min-w-0'>
                    <p className='text-sm font-medium text-gray-900 truncate'>
                      {product.name}
                    </p>
                    <p className='text-xs text-gray-500'>{product.category}</p>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${
                      product.totalStock === 0 ?
                        "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {product.totalStock === 0 ?
                      "Out"
                    : `${product.totalStock} left`}
                  </span>
                </div>
              ))}
            </div>
          }
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <div className='rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm'>
            <h2 className='font-serif font-bold text-gray-900 mb-5'>
              Top selling (units)
            </h2>
            {analytics.topProducts.length === 0 ?
              <p className='text-gray-400 text-sm'>No sales data yet.</p>
            : <div className='space-y-4'>
                {analytics.topProducts.map((p, i) => (
                  <div key={p._id} className='flex items-center gap-3'>
                    <span className='text-sm font-bold text-gray-300 w-5 text-right'>
                      {i + 1}
                    </span>
                    <div className='h-10 w-10 rounded-lg overflow-hidden bg-gray-50'>
                      {p.image ?
                        <img
                          src={p.image}
                          alt={p.name}
                          className='h-full w-full object-cover'
                        />
                      : null}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium text-gray-900 truncate'>
                        {p.name}
                      </p>
                      <p className='text-xs text-gray-400'>
                        {p.totalSold} units sold
                      </p>
                    </div>
                    <p className='text-sm font-bold text-gray-900 tabular-nums'>
                      {formatPrice(p.revenue)}
                    </p>
                  </div>
                ))}
              </div>
            }
          </div>

          <div className='rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-6 shadow-sm'>
            <OrdersMixPieChart
              data={analytics.ordersByStatus}
              totalOrders={overview.totalOrders}
              height={320}
              title='Order pipeline'
              subtitle='Share of all orders in your store'
            />
          </div>
        </div>
      </div>
    </div>
  );
}
