'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TrendingUp, ShoppingBag, Users, Package, AlertCircle, ArrowUp, ArrowDown, Eye, BarChart3 } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { DashboardAnalytics } from '@/types';
import { formatPrice, formatDate, getOrderStatusColor } from '@/lib/utils';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await adminApi.getAnalytics();
        setAnalytics(res.data);
      } catch {
        // silent fail
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="grid grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const { overview } = analytics;
  const revenueGrowthPositive = overview.revenueGrowth >= 0;
  const topViewed = analytics.topViewedProducts ?? [];

  const statCards = [
    {
      label: 'Total Revenue',
      value: formatPrice(overview.totalRevenue),
      sub: `${formatPrice(overview.monthRevenue)} this month`,
      icon: TrendingUp,
      growth: overview.revenueGrowth,
      color: 'bg-brand-50 text-brand-600',
    },
    {
      label: 'Total Orders',
      value: overview.totalOrders.toLocaleString(),
      sub: `${overview.monthOrders} this month`,
      icon: ShoppingBag,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Total Users',
      value: overview.totalUsers.toLocaleString(),
      sub: `${overview.newUsersThisMonth} new this month`,
      icon: Users,
      color: 'bg-green-50 text-green-600',
    },
    {
      label: 'Active Products',
      value: overview.totalProducts.toLocaleString(),
      sub: `${analytics.lowStockProducts.length} low stock`,
      icon: Package,
      color: 'bg-amber-50 text-amber-600',
    },
  ];

  return (
    <div className="p-6 xl:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-serif font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back, here&apos;s what&apos;s happening today</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-5 border border-gray-100">
            <div className="flex items-start justify-between mb-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </div>
              {card.growth !== undefined && (
                <span className={`flex items-center gap-1 text-xs font-medium ${card.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {card.growth >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  {Math.abs(card.growth)}%
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500 mt-1">{card.sub}</p>
            <p className="text-sm font-medium text-gray-600 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Revenue by Month</h3>
            <p className="text-xs text-gray-400">Last 12 months</p>
          </div>
          {analytics.revenueByMonth.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">No data available</div>
          ) : (
            <div className="rounded-xl bg-gradient-to-b from-brand-50/40 to-transparent p-3">
              {(() => {
                const maxRevenue = Math.max(...analytics.revenueByMonth.map((d) => d.revenue), 1);
                const chartPx = 180;
                return (
                  <div className="flex items-end gap-2 justify-around pt-1" style={{ minHeight: chartPx + 24 }}>
                    {analytics.revenueByMonth.map((data) => {
                      const barPx = Math.max(Math.round((data.revenue / maxRevenue) * chartPx), 6);
                      return (
                        <div key={`${data._id.year}-${data._id.month}`} className="flex flex-col items-center gap-1 flex-1 min-w-0 max-w-[48px]">
                          <div
                            className="w-full bg-gradient-to-t from-brand-700 via-brand-500 to-brand-300 hover:from-brand-800 hover:to-brand-400 rounded-t transition-colors cursor-default relative group shadow-[0_8px_20px_rgba(232,96,76,0.25)] flex-shrink-0"
                            style={{ height: barPx }}
                            title={formatPrice(data.revenue)}
                          >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 shadow-lg">
                              {formatPrice(data.revenue)}
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">{MONTHS[data._id.month - 1]}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">Orders by Status</h3>
          <div className="space-y-3">
            {analytics.ordersByStatus.map((item) => (
              <div key={item._id} className="flex items-center justify-between">
                <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${getOrderStatusColor(item._id)}`}>
                  {item._id}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full"
                      style={{ width: `${(item.count / overview.totalOrders) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-[11px] text-gray-500 uppercase tracking-wide">Avg. order</p>
          <p className="text-lg font-bold text-gray-900 mt-1">{formatPrice(overview.avgOrderValue ?? 0)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Paid orders</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-[11px] text-gray-500 uppercase tracking-wide">Orders today</p>
          <p className="text-lg font-bold text-gray-900 mt-1">{overview.ordersToday ?? 0}</p>
          <p className="text-xs text-gray-400 mt-0.5">Since midnight</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-[11px] text-gray-500 uppercase tracking-wide">Fulfilment queue</p>
          <p className="text-lg font-bold text-amber-800 mt-1">{overview.pendingFulfillmentCount ?? 0}</p>
          <p className="text-xs text-gray-400 mt-0.5">Pending · Confirmed · Processing</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-[11px] text-gray-500 uppercase tracking-wide">Reviews</p>
          <p className="text-lg font-bold text-gray-900 mt-1">{overview.totalReviews ?? 0}</p>
          <p className="text-xs text-gray-400 mt-0.5">{overview.reviewsThisMonth ?? 0} this month</p>
        </div>
      </div>

      {topViewed.length > 0 && (
        <div className="bg-gradient-to-br from-navy-900 to-navy-950 rounded-xl p-5 border border-navy-800 text-white">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-gold-300" />
              <h3 className="font-semibold">Most viewed on storefront</h3>
            </div>
            <Link href="/admin/analytics" className="text-xs font-medium text-gold-300 hover:text-gold-200 inline-flex items-center gap-1">
              Full analytics <BarChart3 className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {topViewed.slice(0, 5).map((p, i) => (
              <Link
                key={String(p._id)}
                href={`/shop/${p.slug}`}
                target="_blank"
                className="flex items-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 p-2 transition-colors"
              >
                <span className="text-xs text-white/40 w-4">{i + 1}</span>
                <div className="h-10 w-10 rounded-md overflow-hidden bg-navy-800 flex-shrink-0">
                  {p.image ? <img src={p.image} alt="" className="h-full w-full object-cover" /> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{p.name}</p>
                  <p className="text-[10px] text-white/50">{p.views.toLocaleString()} views</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">Top Products</h3>
          <div className="space-y-3">
            {analytics.topProducts.map((product, i) => (
              <div key={product._id} className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-400 w-5">{i + 1}</span>
                <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                  <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.totalSold} sold</p>
                </div>
                <p className="text-sm font-semibold text-gray-900 flex-shrink-0">{formatPrice(product.revenue)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <h3 className="font-semibold text-gray-900">Low Stock Alert</h3>
          </div>
          {analytics.lowStockProducts.length === 0 ? (
            <p className="text-sm text-gray-500">All products are well stocked!</p>
          ) : (
            <div className="space-y-2">
              {analytics.lowStockProducts.map((product) => (
                <div key={product._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.category}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${product.totalStock === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    {product.totalStock === 0 ? 'Out' : `${product.totalStock} left`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <h3 className="font-semibold text-gray-900 px-5 py-4 border-b border-gray-100">Recent Orders</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-medium">Order</th>
                <th className="text-left px-5 py-3 font-medium">Customer</th>
                <th className="text-left px-5 py-3 font-medium">Date</th>
                <th className="text-left px-5 py-3 font-medium">Amount</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {analytics.recentOrders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium text-brand-600">{order.orderNumber}</td>
                  <td className="px-5 py-3 text-sm text-gray-700">
                    {typeof order.user === 'object' ? order.user.name : '—'}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500">{formatDate(order.createdAt)}</td>
                  <td className="px-5 py-3 text-sm font-semibold text-gray-900">{formatPrice(order.total)}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${getOrderStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
