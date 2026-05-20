'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Package,
  AlertCircle,
  BarChart3,
  RefreshCw,
  Tag,
  Megaphone,
  Store,
  RotateCcw,
  IndianRupee,
  Calendar,
  Warehouse,
} from 'lucide-react';
import { adminApi, inventoryApi } from '@/lib/api';
import { DashboardAnalytics } from '@/types';
import { formatPrice, formatDate, getOrderStatusColor, cn } from '@/lib/utils';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminErrorState from '@/components/admin/AdminErrorState';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { RevenueTrendAreaChart, OrdersMixPieChart } from '@/components/admin/charts';
import {
  AdminMetricCard,
  AdminQuickActionsGrid,
  BusinessPulseRow,
  InventorySnapshotPanel,
  MarketingPulseStrip,
  StockAlertsPanel,
  type AdminQuickLink,
  type InventoryValuationOverall,
} from '@/components/admin/dashboard';

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [invValuation, setInvValuation] = useState<InventoryValuationOverall | null>(null);

  const loadAnalytics = useCallback(async (silent = false) => {
    if (silent) setIsRefreshing(true);
    else {
      setIsLoading(true);
      setLoadError(false);
    }
    try {
      const [res, valRes] = await Promise.allSettled([
        adminApi.getAnalytics(),
        inventoryApi.getValuation(),
      ]);
      if (res.status === 'fulfilled') {
        setAnalytics(res.value.data);
        setLoadError(false);
      } else {
        if (!silent) { setAnalytics(null); setLoadError(true); }
        else toast.error('Could not refresh dashboard data.');
      }
      if (valRes.status === 'fulfilled') {
        const overall = (valRes.value.data as { overall?: InventoryValuationOverall }).overall;
        setInvValuation(overall ?? null);
      }
    } catch {
      if (!silent) { setAnalytics(null); setLoadError(true); }
      else toast.error('Could not refresh dashboard data.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics(false);
  }, [loadAnalytics]);

  if (isLoading) {
    return (
      <div className='min-h-[calc(100dvh-4rem)] bg-gradient-to-b from-slate-50/90 via-white to-white'>
        <div className='p-4 sm:p-6 xl:p-8 space-y-8 max-w-[1600px] mx-auto'>
          <div className='animate-pulse space-y-3'>
            <div className='h-8 w-48 rounded-lg bg-gray-200' />
            <div className='h-4 w-full max-w-xl rounded bg-gray-100' />
            <div className='flex flex-wrap gap-2 pt-2'>
              <div className='h-9 w-24 rounded-xl bg-gray-200' />
              <div className='h-9 w-28 rounded-xl bg-gray-200' />
              <div className='h-9 w-28 rounded-xl bg-gray-200' />
            </div>
          </div>
          <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3'>
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className='h-[4.5rem] rounded-2xl border border-gray-100 bg-gray-100/80 sm:h-[4.75rem]'
              />
            ))}
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className='h-40 rounded-2xl border border-gray-100 bg-gray-100/80 sm:h-44'
              />
            ))}
          </div>
          <div className='grid grid-cols-1 xl:grid-cols-5 gap-6'>
            <div className='xl:col-span-3 h-[320px] rounded-2xl border border-gray-100 bg-gray-100/80' />
            <div className='xl:col-span-2 h-[320px] rounded-2xl border border-gray-100 bg-gray-100/80' />
          </div>
          <div className='grid grid-cols-2 lg:grid-cols-5 gap-4'>
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className='h-24 rounded-2xl border border-gray-100 bg-gray-100/80 sm:h-28'
              />
            ))}
          </div>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <div className='min-h-[280px] rounded-xl border border-gray-100 bg-gray-100/80' />
            <div className='min-h-[280px] rounded-xl border border-gray-100 bg-gray-100/80' />
          </div>
          <div className='min-h-[11rem] rounded-xl border border-gray-100 bg-gray-100/80' />
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <div className='min-h-[220px] rounded-xl border border-gray-100 bg-gray-100/80' />
            <div className='min-h-[220px] rounded-xl border border-gray-100 bg-gray-100/80' />
          </div>
          <div className='min-h-[14rem] rounded-xl border border-gray-100 bg-gray-100/80' />
        </div>
      </div>
    );
  }

  if (!isLoading && loadError) {
    return (
      <div className="p-4 sm:p-6 xl:p-8 max-w-3xl mx-auto">
        <AdminPageHeader
          title="Dashboard"
          description="Business snapshot — sales, stock, and recent activity."
        />
        <div className="mt-8">
          <AdminErrorState onRetry={loadAnalytics} />
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const { overview } = analytics;
  const returnReasonTotal =
    (analytics.refundsByReason || []).reduce((s, r) => s + (r.count || 0), 0) || 1;
  const topViewed = analytics.topViewedProducts ?? [];
  const outOfStock = analytics.outOfStockProducts ?? analytics.lowStockProducts.filter((p) => p.totalStock === 0);
  const lowStockOnly =
    analytics.lowStockOnlyProducts ?? analytics.lowStockProducts.filter((p) => p.totalStock > 0);
  const quickActions: AdminQuickLink[] = [
    { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
    { label: 'Returns', href: '/admin/returns', icon: RotateCcw },
    { label: 'Products', href: '/admin/products', icon: Package },
    { label: 'Inventory', href: '/admin/inventory', icon: Warehouse },
    { label: 'Coupons', href: '/admin/coupons', icon: Tag },
    { label: 'Revenue', href: '/admin/revenue', icon: IndianRupee },
    { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { label: 'Email campaigns', href: '/admin/emails', icon: Megaphone },
    { label: 'Storefront', href: '/admin/storefront', icon: Store },
  ];

  const stockAlertCount =
    (analytics.stockHealth?.outOfStock ?? outOfStock.length) +
    (analytics.stockHealth?.lowStock ?? lowStockOnly.length);

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-gradient-to-b from-slate-50/90 via-white to-white">
      <div className="p-4 sm:p-6 xl:p-8 space-y-8 max-w-[1600px] mx-auto">
        <AdminPageHeader
          title="Dashboard"
          badge="Live"
          description="Operations command center — today’s sales, stock health, fulfilment queue, and storefront demand. Deep dives live under Analytics and Revenue."
          actions={
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl border-gray-200 bg-white shadow-sm"
                onClick={() => loadAnalytics(true)}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Link
                href="/admin/revenue"
                className="inline-flex items-center justify-center rounded-xl border border-navy-200 bg-gradient-to-br from-navy-900 to-navy-950 px-4 py-2.5 text-sm font-semibold text-white hover:from-navy-800 hover:to-navy-900 transition-colors shadow-md"
              >
                Revenue
              </Link>
              <Link
                href="/admin/orders"
                className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors shadow-md"
              >
                All orders
              </Link>
            </>
          }
        />

        <AdminQuickActionsGrid links={quickActions} />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <AdminMetricCard
            label="Total revenue"
            value={formatPrice(overview.totalRevenue)}
            sub={`${formatPrice(overview.monthRevenue)} MTD · gross (paid + refunded)`}
            icon={TrendingUp}
            growth={overview.revenueGrowth}
          />
          <AdminMetricCard
            label="Total orders"
            value={overview.totalOrders.toLocaleString()}
            sub={`${overview.monthOrders} this month`}
            icon={ShoppingBag}
          />
          <AdminMetricCard
            label="Customers"
            value={overview.totalUsers.toLocaleString()}
            sub={`${overview.newUsersThisMonth} new this month`}
            icon={Users}
          />
          <AdminMetricCard
            label="Catalogue health"
            value={overview.totalProducts.toLocaleString()}
            sub={
              stockAlertCount > 0 ?
                `${stockAlertCount} stock alert${stockAlertCount === 1 ? '' : 's'}`
              : 'All SKUs stocked'
            }
            icon={Package}
            variant={stockAlertCount > 0 ? 'danger' : 'success'}
          />
        </div>

        <BusinessPulseRow overview={overview} />

        <InventorySnapshotPanel
          valuation={invValuation}
          stockHealth={analytics.stockHealth}
        />

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <div className="xl:col-span-3 rounded-2xl border border-gray-200/80 bg-white p-5 sm:p-6 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.12)]">
            <RevenueTrendAreaChart
              data={analytics.revenueByMonth}
              height={320}
              title="Revenue & order volume"
              subtitle="Trailing 12 months — gross order totals, paid + refunded (gradient) and order count (line)"
            />
          </div>
          <div className="xl:col-span-2 rounded-2xl border border-gray-200/80 bg-white p-5 sm:p-6 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.12)]">
            <OrdersMixPieChart
              data={analytics.ordersByStatus}
              totalOrders={overview.totalOrders}
              height={320}
              title="Orders by status"
              subtitle="Share of all orders in your store"
            />
          </div>
        </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100/90 shadow-sm">
          <p className="text-[11px] text-gray-500 uppercase tracking-wide">Avg. order</p>
          <p className="text-lg font-bold text-gray-900 mt-1">{formatPrice(overview.avgOrderValue ?? 0)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Paid + refunded</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100/90 shadow-sm ring-1 ring-blue-100/80">
          <p className="text-[11px] text-gray-500 uppercase tracking-wide flex items-center gap-1">
            <Calendar className="h-3 w-3 text-blue-600 shrink-0" aria-hidden />
            Orders today
          </p>
          <p className="text-lg font-bold text-gray-900 mt-1">{overview.ordersToday ?? 0}</p>
          <p className="text-xs text-gray-400 mt-0.5">Since midnight</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100/90 shadow-sm ring-1 ring-blue-100/80">
          <p className="text-[11px] text-gray-500 uppercase tracking-wide flex items-center gap-1">
            <IndianRupee className="h-3 w-3 text-blue-600 shrink-0" aria-hidden />
            Revenue today
          </p>
          <p className="text-lg font-bold text-gray-900 mt-1">{formatPrice(overview.revenueToday ?? 0)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Gross · same window</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100/90 shadow-sm">
          <p className="text-[11px] text-gray-500 uppercase tracking-wide">Fulfilment queue</p>
          <p className="text-lg font-bold text-amber-800 mt-1">{overview.pendingFulfillmentCount ?? 0}</p>
          <p className="text-xs text-gray-400 mt-0.5">Pending · Confirmed · Processing</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100/90 shadow-sm">
          <p className="text-[11px] text-gray-500 uppercase tracking-wide">Reviews</p>
          <p className="text-lg font-bold text-gray-900 mt-1">{overview.totalReviews ?? 0}</p>
          <p className="text-xs text-gray-400 mt-0.5">{overview.reviewsThisMonth ?? 0} this month</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <AlertCircle className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Refunds overview</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Cash returned to customers (product portion). Gross revenue above includes original order totals; net retained uses gross − refunds.
                </p>
              </div>
            </div>
            <Link
              href="/admin/returns"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 whitespace-nowrap"
            >
              Returns hub →
            </Link>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl gap-4 flex-wrap">
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Amount Refunded</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{formatPrice(overview.refundedAmount ?? 0)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 font-medium">Refunded Orders</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{overview.refundedOrdersCount ?? 0}</p>
            </div>
            {(overview.nonRefundableFeesRetained ?? 0) > 0 && (
              <div className="w-full sm:w-auto sm:flex-1 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200/80 sm:text-right">
                <p className="text-xs text-emerald-800 font-medium">Fees kept (shipping / COD)</p>
                <p className="text-lg font-bold text-emerald-900 tabular-nums mt-0.5">
                  {formatPrice(overview.nonRefundableFeesRetained ?? 0)}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">On those refunds, per policy</p>
              </div>
            )}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">Return Reasons</h3>
          <div className="space-y-3">
            {(!analytics.refundsByReason || analytics.refundsByReason.length === 0) ? (
              <p className="text-sm text-gray-500 text-center py-4">No return requests yet.</p>
            ) : (
              analytics.refundsByReason.map((reason, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 truncate w-1/2">{reason._id}</span>
                  <div className="flex flex-1 justify-end items-center gap-3">
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden hidden sm:block">
                      <div
                        className="h-full bg-red-400 rounded-full"
                        style={{ width: `${(reason.count / returnReasonTotal) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-900 w-4 text-right">{reason.count}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {topViewed.length > 0 && <MarketingPulseStrip topViewed={topViewed} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Top sellers</h3>
            <Link href="/admin/analytics" className="text-xs font-semibold text-brand-600 hover:underline">
              Full ranking →
            </Link>
          </div>
          <div className="space-y-3">
            {analytics.topProducts.map((product, i) => (
              <div key={product._id} className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-300 w-5 tabular-nums">{i + 1}</span>
                <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0 ring-1 ring-gray-100">
                  {product.image ? <img src={product.image} alt={product.name} className="h-full w-full object-cover" /> : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.totalSold} units · paid orders</p>
                </div>
                <p className="text-sm font-bold text-gray-900 flex-shrink-0 tabular-nums">{formatPrice(product.revenue)}</p>
              </div>
            ))}
          </div>
        </div>

        <StockAlertsPanel
          outOfStock={outOfStock}
          lowStockOnly={lowStockOnly}
          stockHealth={analytics.stockHealth}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <h3 className="font-semibold text-gray-900 px-4 sm:px-5 py-4 border-b border-gray-100">Recent Orders</h3>
        <div className="sm:hidden divide-y divide-gray-100">
          {analytics.recentOrders.map((order) => (
            <div key={order._id} className="px-4 py-3.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/admin/orders/${order._id}`}
                    className="text-sm font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                  >
                    {order.orderNumber}
                  </Link>
                  <p className="text-xs text-gray-500 mt-1">{formatDate(order.createdAt)}</p>
                </div>
                <span className={`text-[11px] font-medium px-2 py-1 rounded-full capitalize ${getOrderStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <p className="text-xs text-gray-600 truncate pr-2">
                  {typeof order.user === 'object' && order.user != null ? order.user.name ?? '—' : '—'}
                </p>
                <p className="text-sm font-bold text-gray-900">{formatPrice(order.total)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="hidden sm:block overflow-x-auto">
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
                  <td className="px-5 py-3 text-sm font-medium">
                    <Link className="text-brand-600 hover:text-brand-700 hover:underline" href={`/admin/orders/${order._id}`}>
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-700">
                    {typeof order.user === 'object' && order.user != null ? order.user.name ?? '—' : '—'}
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
    </div>
  );
}
