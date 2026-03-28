'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import { DashboardAnalytics } from '@/types';
import { formatPrice } from '@/lib/utils';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  BarChart3,
  Eye,
  Layers,
  Package,
  Star,
  Percent,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminApi
      .getAnalytics()
      .then((res) => setAnalytics(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="p-8 space-y-4 animate-pulse">
        <div className="h-8 w-56 bg-gray-200 rounded" />
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }
  if (!analytics) return <div className="p-8 text-gray-500">Could not load analytics.</div>;

  const { overview, revenueByMonth } = analytics;
  const maxRevenue = Math.max(...revenueByMonth.map((d) => d.revenue), 1);
  /** Fixed chart height (px) — % heights inside nested flex were collapsing to 0 */
  const CHART_INNER_PX = 200;
  const topViewed = analytics.topViewedProducts ?? [];
  const revenueByCat = analytics.revenueByCategory ?? [];
  const maxCatRev = Math.max(...revenueByCat.map((c) => c.revenue), 1);

  const primaryKpis = [
    { label: 'Total revenue', value: formatPrice(overview.totalRevenue), sub: `${formatPrice(overview.monthRevenue)} this month`, icon: TrendingUp },
    { label: 'Total orders', value: overview.totalOrders.toLocaleString(), sub: `${overview.monthOrders} this month`, icon: ShoppingBag },
    { label: 'Customers', value: overview.totalUsers.toLocaleString(), sub: `${overview.newUsersThisMonth} new`, icon: Users },
    { label: 'Catalogue', value: overview.totalProducts.toLocaleString(), sub: 'Active products', icon: BarChart3 },
  ];

  const secondaryKpis = [
    { label: 'Avg. order value', value: formatPrice(overview.avgOrderValue ?? 0), sub: 'Paid orders', icon: Percent },
    { label: 'Orders today', value: String(overview.ordersToday ?? 0), sub: 'Since midnight', icon: Package },
    { label: 'Awaiting fulfilment', value: String(overview.pendingFulfillmentCount ?? 0), sub: 'Pending · Confirmed · Processing', icon: Layers },
    { label: 'Reviews', value: String(overview.totalReviews ?? 0), sub: `${overview.reviewsThisMonth ?? 0} this month`, icon: Star },
  ];

  return (
    <div className="p-6 xl:p-8 space-y-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Analytics &amp; insights</h1>
          <p className="text-gray-500 text-sm mt-1">
            Sales, traffic-style product views, and category performance — use this to spot what to promote or restock.
          </p>
        </div>
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
        >
          Manage products <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {primaryKpis.map((item) => (
          <div key={item.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="h-9 w-9 rounded-lg bg-brand-50 flex items-center justify-center mb-2">
              <item.icon className="h-5 w-5 text-brand-600" />
            </div>
            <p className="text-xl font-bold text-gray-900 tabular-nums">{item.value}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{item.sub}</p>
            <p className="text-xs font-medium text-gray-600 mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {secondaryKpis.map((item) => (
          <div key={item.label} className="bg-gradient-to-br from-navy-900 to-navy-950 rounded-xl p-4 text-white border border-navy-800">
            <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center mb-2">
              <item.icon className="h-4 w-4 text-gold-300" />
            </div>
            <p className="text-lg font-bold tabular-nums">{item.value}</p>
            <p className="text-[11px] text-white/50 mt-0.5">{item.sub}</p>
            <p className="text-xs font-medium text-white/80 mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-1">Monthly revenue</h2>
        <p className="text-xs text-gray-500 mb-6">Last 12 months · paid orders</p>
        {revenueByMonth.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No revenue data yet</div>
        ) : (
          <div className="flex items-end gap-2 sm:gap-3 justify-between sm:justify-around pt-2" style={{ minHeight: CHART_INNER_PX + 28 }}>
            {revenueByMonth.map((data) => {
              const barPx = Math.max(Math.round((data.revenue / maxRevenue) * CHART_INNER_PX), 6);
              return (
                <div
                  key={`${data._id.year}-${data._id.month}`}
                  className="flex flex-col items-center gap-2 flex-1 min-w-0 max-w-[56px]"
                >
                  <div
                    className="w-full max-w-[44px] bg-gradient-to-t from-brand-700 to-brand-400 hover:opacity-90 rounded-t-md transition-opacity cursor-default relative group shadow-md flex-shrink-0"
                    style={{ height: barPx }}
                    title={`${formatPrice(data.revenue)} · ${data.orders} orders`}
                  >
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none shadow-lg">
                      {formatPrice(data.revenue)}
                      <br />
                      <span className="text-gray-400">{data.orders} orders</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-500 truncate w-full text-center leading-tight">
                    {MONTHS[data._id.month - 1]}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Eye className="h-5 w-5 text-brand-600" />
                Most viewed products
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                PDP views (one per session). &quot;Conv.&quot; ≈ units sold ÷ views — rough signal for merchandising.
              </p>
            </div>
          </div>
          {topViewed.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">Open product pages on the store to start collecting views.</p>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-100">
                    <th className="pb-2 pl-2">#</th>
                    <th className="pb-2">Product</th>
                    <th className="pb-2 text-right">Views</th>
                    <th className="pb-2 text-right">Sold</th>
                    <th className="pb-2 text-right">Conv.</th>
                    <th className="pb-2 pr-2 w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {topViewed.map((p, i) => (
                    <tr key={String(p._id)} className="hover:bg-gray-50/80">
                      <td className="py-2.5 pl-2 text-gray-400 font-medium">{i + 1}</td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-9 w-9 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {p.image ? (
                              <img src={p.image} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full bg-gray-200" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate max-w-[200px]">{p.name}</p>
                            <p className="text-[11px] text-gray-400">{p.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-gray-700">{p.views.toLocaleString()}</td>
                      <td className="py-2.5 text-right tabular-nums text-gray-700">{p.sold}</td>
                      <td className="py-2.5 text-right tabular-nums text-brand-700 font-medium">{p.conversionPercent}%</td>
                      <td className="py-2.5 pr-2">
                        <Link
                          href={`/shop/${p.slug}`}
                          target="_blank"
                          className="text-brand-600 hover:text-brand-700 p-1 inline-flex"
                          aria-label="View on store"
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-gold-500" />
            Revenue by category
          </h2>
          <p className="text-xs text-gray-500 mb-5">From paid orders · units × line prices</p>
          {revenueByCat.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">No category revenue yet.</p>
          ) : (
            <div className="space-y-3">
              {revenueByCat.map((row) => (
                <div key={row._id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium truncate pr-2">{row._id}</span>
                    <span className="text-gray-900 font-semibold tabular-nums">{formatPrice(row.revenue)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-navy-700 to-brand-500 rounded-full"
                      style={{ width: `${(row.revenue / maxCatRev) * 100}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">{row.units} units</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-5">Top selling (units)</h2>
          {analytics.topProducts.length === 0 ? (
            <p className="text-gray-400 text-sm">No sales data yet.</p>
          ) : (
            <div className="space-y-4">
              {analytics.topProducts.map((p, i) => (
                <div key={p._id} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-300 w-5 text-right">{i + 1}</span>
                  <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-50">
                    <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.totalSold} units sold</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900 tabular-nums">{formatPrice(p.revenue)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-5">Order status mix</h2>
          {analytics.ordersByStatus.length === 0 ? (
            <p className="text-gray-400 text-sm">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {analytics.ordersByStatus.map((item) => (
                <div key={item._id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize text-gray-700">{item._id}</span>
                    <span className="font-medium text-gray-900 tabular-nums">
                      {item.count}{' '}
                      <span className="text-gray-400 text-xs">
                        (
                        {overview.totalOrders > 0
                          ? Math.round((item.count / overview.totalOrders) * 100)
                          : 0}
                        %)
                      </span>
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${overview.totalOrders > 0 ? (item.count / overview.totalOrders) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
