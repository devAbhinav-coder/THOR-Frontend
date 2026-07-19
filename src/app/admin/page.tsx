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
  Sparkles,
  LayoutDashboard,
  LineChart,
  Box,
} from 'lucide-react';
import { adminApi, inventoryApi } from '@/lib/api';
import { DashboardAnalytics } from '@/types';
import { formatPrice, formatDate, getOrderStatusColor, cn } from '@/lib/utils';
import { revenueGrowthBadgeValue } from '@/lib/revenueMetrics';
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
import { AdminAiBriefCard, AdminAiActionSuggestions } from '@/components/admin/ai';
import { useAuthStore } from '@/store/useAuthStore';

type Tab = 'overview' | 'analytics' | 'inventory';

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [invValuation, setInvValuation] = useState<InventoryValuationOverall | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

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

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics & Sales', icon: LineChart },
    { id: 'inventory', label: 'Inventory & Ops', icon: Box },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100dvh-4rem)] bg-[#FAF9F6]">
        <div className="p-4 sm:p-6 xl:p-8 space-y-8 max-w-[1600px] mx-auto">
          {/* Skeleton Hero */}
          <div className="h-48 rounded-3xl bg-gray-200 animate-pulse" />
          {/* Skeleton Tabs */}
          <div className="flex gap-2">
            <div className="h-10 w-28 rounded-xl bg-gray-200 animate-pulse" />
            <div className="h-10 w-36 rounded-xl bg-gray-200 animate-pulse" />
            <div className="h-10 w-36 rounded-xl bg-gray-200 animate-pulse" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-[6.5rem] rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="h-[300px] rounded-2xl bg-gray-100 animate-pulse xl:col-span-1" />
            <div className="h-[300px] rounded-2xl bg-gray-100 animate-pulse xl:col-span-2" />
          </div>
        </div>
      </div>
    );
  }

  if (!isLoading && loadError) {
    return (
      <div className="p-4 sm:p-6 xl:p-8 max-w-3xl mx-auto">
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
  
  const stockAlertCount =
    (analytics.stockHealth?.outOfStock ?? outOfStock.length) +
    (analytics.stockHealth?.lowStock ?? lowStockOnly.length);

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-[#FAF9F6] pb-12">
      <div className="p-4 sm:p-6 xl:p-8 space-y-6 sm:space-y-8 max-w-[1600px] mx-auto">
        
        {/* Premium Hero Banner */}
        <div className="relative overflow-hidden rounded-[2rem] bg-navy-950 px-6 py-8 sm:px-10 sm:py-12 shadow-2xl ring-1 ring-brand-500/20 group">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-600/20 via-navy-900/50 to-brand-800/30 mix-blend-overlay transition-opacity duration-700 group-hover:opacity-80" />
          <div className="absolute right-0 top-0 -mt-20 -mr-20 h-80 w-80 rounded-full bg-brand-400/10 blur-3xl transition-transform duration-700 group-hover:scale-110 group-hover:bg-brand-400/20" />
          <div className="absolute bottom-0 left-10 -mb-20 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl transition-transform duration-700 group-hover:scale-110 group-hover:bg-brand-500/20" />
          
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-brand-200 border border-white/10 backdrop-blur-md shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                  System Live
                </span>
                <span className="text-xs font-medium text-navy-200 bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm border border-white/5">
                  {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif text-white tracking-tight leading-tight">
                {getGreeting()}, {user?.name ? user.name.split(' ')[0] : 'Admin'} <span className="text-brand-400 inline-block animate-bounce-slow">✦</span>
              </h1>
              <p className="mt-3 text-navy-200 max-w-xl text-sm sm:text-base leading-relaxed font-medium">
                Here's your operations pulse for today. Keep an eye on your fulfillment queue and catalogue health to maintain momentum.
              </p>
            </div>
            
            <div className="flex shrink-0">
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white backdrop-blur-md shadow-lg transition-all hover:scale-105 active:scale-95 h-12 px-6"
                onClick={() => loadAnalytics(true)}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
            </div>
          </div>
        </div>

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
              {/* 4 Core Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <AdminMetricCard
                  label="Total revenue"
                  value={formatPrice(overview.totalRevenue)}
                  sub={`${formatPrice(overview.monthRevenue)} MTD · gross`}
                  icon={TrendingUp}
                  growth={revenueGrowthBadgeValue(overview.revenueGrowth)}
                  className="hover:-translate-y-1 transition-transform duration-300"
                />
                <AdminMetricCard
                  label="Total orders"
                  value={overview.totalOrders.toLocaleString()}
                  sub={`${overview.monthOrders} this month`}
                  icon={ShoppingBag}
                  className="hover:-translate-y-1 transition-transform duration-300"
                />
                <AdminMetricCard
                  label="Customers"
                  value={overview.totalUsers.toLocaleString()}
                  sub={`${overview.newUsersThisMonth} new this month`}
                  icon={Users}
                  className="hover:-translate-y-1 transition-transform duration-300"
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
                  className="hover:-translate-y-1 transition-transform duration-300"
                />
              </div>

              {/* Business Pulse */}
              <div className="hover:-translate-y-1 transition-transform duration-300">
                <BusinessPulseRow overview={overview} />
              </div>

              {/* AI Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 h-full hover:-translate-y-1 transition-transform duration-300">
                  <AdminAiBriefCard />
                </div>
                <div className="lg:col-span-2 h-full hover:-translate-y-1 transition-transform duration-300">
                  <AdminAiActionSuggestions />
                </div>
              </div>

              {/* Recent Orders Table */}
              <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 border-b border-gray-100 gap-4">
                  <div>
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5 text-brand-600" />
                      Recent Orders
                      <span className="flex h-2 w-2 relative ml-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Live feed of your most recent transactions</p>
                  </div>
                  <Link href="/admin/orders" className="inline-flex items-center justify-center rounded-xl bg-gray-50 border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors shrink-0">
                    View all orders &rarr;
                  </Link>
                </div>
                
                {/* Mobile View */}
                <div className="sm:hidden divide-y divide-gray-100">
                  {analytics.recentOrders.map((order) => {
                    const customerName = typeof order.user === 'object' && order.user != null ? order.user.name ?? 'Guest' : 'Guest';
                    const initial = customerName.charAt(0).toUpperCase();
                    return (
                      <div key={order._id} className="px-5 py-4 hover:bg-gray-50/50 transition-colors group relative">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-100 to-rose-100 flex items-center justify-center border border-white shadow-sm shrink-0">
                              <span className="text-sm font-bold text-brand-700">{initial}</span>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{customerName}</p>
                              <Link
                                href={`/admin/orders/${order._id}`}
                                className="text-xs font-mono font-medium text-brand-600 hover:text-brand-700 hover:underline inline-flex mt-0.5"
                              >
                                {order.orderNumber}
                              </Link>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${getOrderStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="mt-4 flex items-center justify-between pl-[3.25rem]">
                          <p className="text-xs text-gray-500 font-medium">{formatDate(order.createdAt)}</p>
                          <p className="text-sm font-bold font-serif text-gray-900 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">{formatPrice(order.total)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-100">
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Order</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Customer</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Date</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Amount</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {analytics.recentOrders.map((order) => {
                        const customerName = typeof order.user === 'object' && order.user != null ? order.user.name ?? 'Guest' : 'Guest';
                        const initial = customerName.charAt(0).toUpperCase();
                        return (
                          <tr key={order._id} className="group hover:bg-brand-50/30 transition-all duration-200">
                            <td className="px-6 py-4">
                              <Link 
                                className="inline-flex items-center gap-1.5 bg-gray-50 group-hover:bg-white border border-gray-200 group-hover:border-brand-200 text-xs font-mono font-medium text-gray-700 group-hover:text-brand-700 px-2.5 py-1 rounded-md transition-colors" 
                                href={`/admin/orders/${order._id}`}
                              >
                                {order.orderNumber}
                              </Link>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-100 to-rose-100 flex items-center justify-center border border-white shadow-sm group-hover:scale-105 transition-transform">
                                  <span className="text-xs font-bold text-brand-700">{initial}</span>
                                </div>
                                <span className="text-sm font-semibold text-gray-900">{customerName}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-500 group-hover:text-gray-700 transition-colors">
                              {formatDate(order.createdAt)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm font-bold font-serif text-gray-900 group-hover:text-brand-900 transition-colors">
                                {formatPrice(order.total)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm border border-black/5 ${getOrderStatusColor(order.status)}`}>
                                {order.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===================== ANALYTICS & FINANCIALS TAB ===================== */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 sm:space-y-8">
              {/* Daily Flash Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:-translate-y-1 transition-transform duration-300">
                  <p className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold">Avg. order</p>
                  <p className="text-2xl font-bold font-serif text-gray-900 mt-2">{formatPrice(overview.avgOrderValue ?? 0)}</p>
                  <p className="text-xs text-gray-400 mt-1">Paid + refunded</p>
                </div>
                <div className="bg-gradient-to-br from-brand-50 to-white rounded-2xl p-5 border border-brand-100 shadow-sm ring-1 ring-brand-100/50 hover:-translate-y-1 transition-transform duration-300">
                  <p className="text-[11px] text-brand-700 uppercase tracking-widest font-bold flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> Orders today
                  </p>
                  <p className="text-2xl font-bold font-serif text-brand-950 mt-2">{overview.ordersToday ?? 0}</p>
                  <p className="text-xs text-brand-600/70 mt-1">Since midnight</p>
                </div>
                <div className="bg-gradient-to-br from-brand-50 to-white rounded-2xl p-5 border border-brand-100 shadow-sm ring-1 ring-brand-100/50 hover:-translate-y-1 transition-transform duration-300">
                  <p className="text-[11px] text-brand-700 uppercase tracking-widest font-bold flex items-center gap-1.5">
                    <IndianRupee className="h-3.5 w-3.5" /> Revenue today
                  </p>
                  <p className="text-2xl font-bold font-serif text-brand-950 mt-2">{formatPrice(overview.revenueToday ?? 0)}</p>
                  <p className="text-xs text-brand-600/70 mt-1">Gross same window</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:-translate-y-1 transition-transform duration-300">
                  <p className="text-[11px] text-amber-600 uppercase tracking-widest font-semibold">Fulfilment queue</p>
                  <p className="text-2xl font-bold font-serif text-amber-900 mt-2">{overview.pendingFulfillmentCount ?? 0}</p>
                  <p className="text-xs text-amber-700/60 mt-1">Needs processing</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:-translate-y-1 transition-transform duration-300">
                  <p className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold">Reviews</p>
                  <p className="text-2xl font-bold font-serif text-gray-900 mt-2">{overview.totalReviews ?? 0}</p>
                  <p className="text-xs text-gray-400 mt-1">{overview.reviewsThisMonth ?? 0} this month</p>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                <div className="xl:col-span-3 rounded-[1.5rem] border border-gray-200/80 bg-white p-5 sm:p-7 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <RevenueTrendAreaChart
                    data={analytics.revenueByMonth}
                    height={320}
                    title="Revenue & order volume"
                    subtitle="Trailing 12 months — gross order totals, paid + refunded (gradient) and order count (line)"
                  />
                </div>
                <div className="xl:col-span-2 rounded-[1.5rem] border border-gray-200/80 bg-white p-5 sm:p-7 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <OrdersMixPieChart
                    data={analytics.ordersByStatus}
                    totalOrders={overview.totalOrders}
                    height={320}
                    title="Orders by status"
                    subtitle="Share of all orders in your store"
                  />
                </div>
              </div>

              {/* Refunds Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-[1.5rem] p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
                          <AlertCircle className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">Refunds overview</h3>
                          <p className="text-xs text-gray-500 mt-1 max-w-sm leading-relaxed">
                            Cash returned to customers. Gross revenue uses original order totals; net retained uses gross − refunds.
                          </p>
                        </div>
                      </div>
                      <Link
                        href="/admin/returns"
                        className="text-xs font-bold text-brand-600 hover:text-brand-700 whitespace-nowrap bg-brand-50 px-3 py-1.5 rounded-full"
                      >
                        Returns hub &rarr;
                      </Link>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-5 bg-gray-50/80 rounded-2xl gap-4 flex-wrap border border-gray-100">
                    <div>
                      <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">Total Refunded</p>
                      <p className="text-2xl font-serif font-bold text-gray-900 mt-2">{formatPrice(overview.refundedAmount ?? 0)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">Refunded Orders</p>
                      <p className="text-2xl font-serif font-bold text-gray-900 mt-2">{overview.refundedOrdersCount ?? 0}</p>
                    </div>
                    {(overview.nonRefundableFeesRetained ?? 0) > 0 && (
                      <div className="w-full sm:w-auto sm:flex-1 pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-200/80 sm:text-right">
                        <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-widest">Fees kept (shipping/COD)</p>
                        <p className="text-xl font-serif font-bold text-emerald-900 tabular-nums mt-1">
                          {formatPrice(overview.nonRefundableFeesRetained ?? 0)}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-1">On those refunds, per policy</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-[1.5rem] p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <h3 className="font-bold text-gray-900 mb-5">Return Reasons</h3>
                  <div className="space-y-4">
                    {(!analytics.refundsByReason || analytics.refundsByReason.length === 0) ? (
                      <div className="py-8 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                        <p className="text-sm font-medium text-gray-500">No return requests yet.</p>
                      </div>
                    ) : (
                      analytics.refundsByReason.map((reason, i) => (
                        <div key={i} className="flex items-center justify-between group">
                          <span className="text-sm font-semibold text-gray-700 truncate w-1/2">{reason._id}</span>
                          <div className="flex flex-1 justify-end items-center gap-4">
                            <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden hidden sm:block">
                              <div
                                className="h-full bg-red-400 rounded-full group-hover:bg-red-500 transition-colors"
                                style={{ width: `${(reason.count / returnReasonTotal) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold text-gray-900 w-6 text-right tabular-nums">{reason.count}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================== INVENTORY & OPS TAB ===================== */}
          {activeTab === 'inventory' && (
            <div className="space-y-6 sm:space-y-8">
              {/* Inventory Valuation Panel */}
              <div className="hover:shadow-md transition-shadow duration-300 rounded-[1.5rem] overflow-hidden bg-white">
                <InventorySnapshotPanel
                  valuation={invValuation}
                  stockHealth={analytics.stockHealth}
                />
              </div>

              {/* Marketing Strip */}
              {topViewed.length > 0 && (
                <div className="hover:-translate-y-1 transition-transform duration-300">
                  <MarketingPulseStrip
                    topViewed={topViewed}
                    attributedOrders={analytics.marketingInsights?.attributedOrders}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Sellers */}
                <div className="bg-white rounded-[1.5rem] p-6 border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-gray-900">Top sellers</h3>
                    <Link href="/admin/analytics" className="text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline bg-brand-50 px-3 py-1.5 rounded-full">
                      Full ranking &rarr;
                    </Link>
                  </div>
                  <div className="space-y-4">
                    {analytics.topProducts.map((product, i) => (
                      <div key={product._id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                        <span className="text-xs font-bold text-gray-400 w-4 tabular-nums text-center">{i + 1}</span>
                        <div className="h-12 w-12 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 ring-1 ring-gray-200 shadow-sm">
                          {product.image ? <img src={product.image} alt={product.name} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-gray-300"><Package className="h-5 w-5" /></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{product.name}</p>
                          <p className="text-xs font-medium text-gray-500 mt-0.5">{product.totalSold} units · paid orders</p>
                        </div>
                        <p className="text-sm font-bold font-serif text-gray-900 flex-shrink-0 tabular-nums bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                          {formatPrice(product.revenue)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stock Alerts Panel */}
                <div className="bg-white rounded-[1.5rem] overflow-hidden border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <StockAlertsPanel
                    outOfStock={outOfStock}
                    lowStockOnly={lowStockOnly}
                    stockHealth={analytics.stockHealth}
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
