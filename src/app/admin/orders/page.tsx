'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronRight, Package, Truck, CheckCircle2, Clock, AlertCircle, TrendingUp, RefreshCw, LayoutGrid, List } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { Order, OrderStatus, DashboardAnalytics } from '@/types';
import { formatPrice, formatDate, getOrderStatusColor, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SearchField } from '@/components/ui/SearchField';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminErrorState from '@/components/admin/AdminErrorState';
import { OrdersInsightsPanel } from '@/components/admin/OrdersInsightsPanel';

const ORDER_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

const STATUS_META: Record<string, { icon: React.ReactNode; label: string; bg: string; text: string }> = {
  pending:    { icon: <Clock className="h-4 w-4" />,       label: 'Pending',    bg: 'bg-yellow-50',  text: 'text-yellow-700' },
  confirmed:  { icon: <CheckCircle2 className="h-4 w-4" />, label: 'Confirmed',  bg: 'bg-blue-50',    text: 'text-blue-700' },
  processing: { icon: <Package className="h-4 w-4" />,      label: 'Processing', bg: 'bg-purple-50',  text: 'text-purple-700' },
  shipped:    { icon: <Truck className="h-4 w-4" />,        label: 'Shipped',    bg: 'bg-indigo-50',  text: 'text-indigo-700' },
  delivered:  { icon: <CheckCircle2 className="h-4 w-4" />, label: 'Delivered',  bg: 'bg-green-50',   text: 'text-green-700' },
  cancelled:  { icon: <AlertCircle className="h-4 w-4" />,  label: 'Cancelled',  bg: 'bg-red-50',     text: 'text-red-700' },
  refunded:   { icon: <RefreshCw className="h-4 w-4" />,    label: 'Refunded',   bg: 'bg-gray-50',    text: 'text-gray-700' },
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0 });
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [trackingOpenFor, setTrackingOpenFor] = useState<string | null>(null);
  const [trackingForm, setTrackingForm] = useState<{ shippingCarrier: string; trackingNumber: string; trackingUrl: string; note: string }>({
    shippingCarrier: '',
    trackingNumber: '',
    trackingUrl: '',
    note: '',
  });
  const [trackingErrors, setTrackingErrors] = useState<{ shippingCarrier?: string; trackingNumber?: string; trackingUrl?: string }>({});
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'value_high' | 'value_low'>('newest');
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [ordersLoadError, setOrdersLoadError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchOrders = useCallback(async (page = 1, append = false) => {
    if (append) setIsLoadingMore(true);
    else {
      setIsLoading(true);
      setOrdersLoadError(false);
    }
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const res = await adminApi.getOrders(params);
      const incoming = res.data.orders as Order[];
      const nextPagination = res.pagination;
      setPagination(nextPagination);
      setHasMore(nextPagination.currentPage < nextPagination.totalPages);
      setOrders((prev) => {
        if (!append) return incoming;
        const map = new Map(prev.map((o) => [o._id, o]));
        for (const o of incoming) map.set(o._id, o);
        return Array.from(map.values());
      });
      setOrdersLoadError(false);
    } catch {
      if (!append) {
        setOrders([]);
        setOrdersLoadError(true);
        setHasMore(false);
      } else {
        toast.error('Could not load more orders.');
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [statusFilter]);

  const handleRefreshList = useCallback(() => {
    setIsRefreshing(true);
    void fetchOrders(1, false).finally(() => setIsRefreshing(false));
  }, [fetchOrders]);

  useEffect(() => {
    adminApi.getAnalytics().then((res) => setAnalytics(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setOrders([]);
    setHasMore(true);
    fetchOrders(1, false);
  }, [statusFilter, fetchOrders]);

  useEffect(() => {
    if (!hasMore || isLoading || isLoadingMore || !loadMoreRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !isLoadingMore) {
          fetchOrders(pagination.currentPage + 1, true);
        }
      },
      { rootMargin: '240px' }
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, pagination.currentPage, fetchOrders]);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    if (status === 'shipped') {
      const existing = orders.find((o) => o._id === orderId);
      setTrackingForm({
        shippingCarrier: existing?.shippingCarrier || '',
        trackingNumber: existing?.trackingNumber || '',
        trackingUrl: existing?.trackingUrl || '',
        note: '',
      });
      setTrackingOpenFor(orderId);
      return;
    }
    setUpdatingOrder(orderId);
    try {
      await adminApi.updateOrderStatus(orderId, { status });
      toast.success(`Status updated to ${status}`);
      fetchOrders(pagination.currentPage);
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || 'Failed to update status');
    } finally {
      setUpdatingOrder(null);
    }
  };

  const submitShipped = async () => {
    if (!trackingOpenFor) return;
    const errs: typeof trackingErrors = {};
    if (!trackingForm.shippingCarrier.trim()) errs.shippingCarrier = 'Courier is required';
    if (!trackingForm.trackingNumber.trim()) errs.trackingNumber = 'Tracking/AWB is required';
    if (trackingForm.trackingUrl.trim() && !/^https?:\/\//i.test(trackingForm.trackingUrl.trim())) {
      errs.trackingUrl = 'Tracking URL must start with http(s)://';
    }
    setTrackingErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setUpdatingOrder(trackingOpenFor);
    try {
      await adminApi.updateOrderStatus(trackingOpenFor, {
        status: 'shipped',
        note: trackingForm.note || undefined,
        shippingCarrier: trackingForm.shippingCarrier || undefined,
        trackingNumber: trackingForm.trackingNumber || undefined,
        trackingUrl: trackingForm.trackingUrl || undefined,
      });
      toast.success('Marked as shipped');
      setTrackingOpenFor(null);
      fetchOrders(pagination.currentPage);
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Failed to update status');
    } finally {
      setUpdatingOrder(null);
    }
  };

  const filteredOrders = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => {
      if (o.orderNumber.toLowerCase().includes(q)) return true;
      if (typeof o.user !== 'object') return false;
      return (
        o.user.name.toLowerCase().includes(q) ||
        o.user.email.toLowerCase().includes(q)
      );
    });
  }, [orders, debouncedSearch]);

  const visibleOrders = useMemo(() => {
    const list = [...filteredOrders];
    switch (sortBy) {
      case 'oldest':
        list.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
        break;
      case 'value_high':
        list.sort((a, b) => b.total - a.total);
        break;
      case 'value_low':
        list.sort((a, b) => a.total - b.total);
        break;
      default:
        list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    }
    return list;
  }, [filteredOrders, sortBy]);

  // Build status counts from analytics
  const statusCounts: Record<string, number> = {};
  analytics?.ordersByStatus?.forEach(({ _id, count }) => { statusCounts[_id] = count; });

  return (
    <div className="p-4 sm:p-6 xl:p-8 space-y-6 max-w-[1600px] mx-auto">
      <AdminPageHeader
        title="Orders"
        description="Fulfil, track, and update status — row click opens the full order. Revenue tiles use gross analytics (paid + refunded), with refunds shown separately."
        badge={pagination.total ? `${pagination.total.toLocaleString()} total` : undefined}
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl border-gray-200"
              onClick={handleRefreshList}
              disabled={isRefreshing || isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link
              href="/admin/returns"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:border-brand-300 hover:bg-brand-50/50 transition-colors"
            >
              Returns
            </Link>
          </>
        }
      />

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3">
        {/* Revenue highlight */}
        <div className="col-span-2 sm:col-span-4 xl:col-span-2 bg-gradient-to-br from-navy-900 to-navy-800 rounded-2xl p-5 text-white shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-brand-300" />
            <span className="text-xs font-semibold text-navy-300 uppercase tracking-widest">This Month</span>
          </div>
          <p className="text-3xl font-bold leading-none">
            {analytics ? formatPrice(analytics.overview.monthRevenue) : '—'}
          </p>
          <p className="text-xs text-navy-400 mt-1.5">
            {analytics?.overview.monthOrders || 0} orders this month
          </p>
          {analytics && analytics.overview.revenueGrowth !== undefined && (
            <p className={cn('text-xs font-semibold mt-1', analytics.overview.revenueGrowth >= 0 ? 'text-green-400' : 'text-red-400')}>
              {analytics.overview.revenueGrowth >= 0 ? '▲' : '▼'} {Math.abs(Math.round(analytics.overview.revenueGrowth))}% vs last month
            </p>
          )}
        </div>

        {/* Status counts */}
        {(['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as OrderStatus[]).map((status) => {
          const meta = STATUS_META[status];
          const count = statusCounts[status] || 0;
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
              className={cn(
                'rounded-2xl p-4 border transition-all text-left',
                statusFilter === status ? 'border-brand-400 shadow-sm ring-1 ring-brand-300' : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
              )}
              style={statusFilter === status ? { background: 'white' } : {}}
            >
              <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center mb-2', meta.bg)}>
                <span className={meta.text}>{meta.icon}</span>
              </div>
              <p className="text-xl font-bold text-gray-900 leading-none">{count}</p>
              <p className={cn('text-xs font-semibold mt-0.5', meta.text)}>{meta.label}</p>
            </button>
          );
        })}
      </div>

      {/* Order analytics: volume trend + status mix (no revenue chart here) */}
      {analytics &&
        (analytics.revenueByMonth.length > 0 || analytics.ordersByStatus.length > 0) && (
          <OrdersInsightsPanel analytics={analytics} />
        )}

      {ordersLoadError && !isLoading && (
        <AdminErrorState
          title="Couldn’t load orders"
          message="Check your API connection and permissions, then try again."
          onRetry={() => fetchOrders(1, false)}
        />
      )}

      {/* Filters + list */}
      {!ordersLoadError && (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3">
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Order #, customer name, or email…"
            isLoading={search.trim() !== debouncedSearch}
            className="flex-1 min-w-[200px]"
            aria-label="Search orders"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white transition-all"
          >
            <option value="">All Statuses</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white transition-all"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="value_high">Order value: high to low</option>
            <option value="value_low">Order value: low to high</option>
          </select>
          <div className="flex items-center rounded-xl bg-gray-50 px-3 text-xs font-semibold text-gray-600 border border-gray-200">
            Showing {visibleOrders.length} of {orders.length} loaded
          </div>
          <div className="ml-auto flex items-center rounded-xl border border-gray-200 overflow-hidden bg-white">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`h-10 px-3 grid place-items-center ${viewMode === 'table' ? 'bg-navy-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              title="Table view"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`h-10 px-3 grid place-items-center ${viewMode === 'grid' ? 'bg-navy-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tablet / desktop table */}
        {viewMode === 'table' && (
        <div className="hidden md:block">
          <table className="w-full table-fixed">
            <thead>
              <tr className="bg-gray-50 text-[11px] text-gray-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3.5">Order</th>
                <th className="text-left px-4 py-3.5">Customer</th>
                <th className="text-left px-4 py-3.5">Date</th>
                <th className="text-left px-4 py-3.5">Items</th>
                <th className="text-left px-4 py-3.5">Total</th>
                <th className="text-left px-4 py-3.5">Payment</th>
                <th className="text-left px-4 py-3.5">Status</th>
                <th className="text-left px-4 py-3.5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-5 py-4">
                      <div className="h-4 bg-gray-100 rounded-lg animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : visibleOrders.map((order) => (
                <tr
                  key={order._id}
                  className="hover:bg-gray-50/80 transition-colors cursor-pointer"
                  onClick={() => router.push(`/admin/orders/${encodeURIComponent(order._id)}`)}
                >
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-semibold text-brand-600">{order.orderNumber}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-medium text-gray-900">{typeof order.user === 'object' ? order.user.name : '—'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{typeof order.user === 'object' ? order.user.email : ''}</p>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-gray-500">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3.5 text-sm text-gray-600">{(order.items ?? []).length}</td>
                  <td className="px-4 py-3.5 text-sm font-bold text-gray-900">{formatPrice(order.total)}</td>
                  <td className="px-4 py-3.5">
                    <span className={cn(
                      'text-xs font-semibold px-2.5 py-1 rounded-full capitalize',
                      order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                      order.paymentStatus === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    )}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full capitalize', getOrderStatusColor(order.status))}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="relative group inline-block">
                      <Button variant="outline" size="sm" disabled={updatingOrder === order._id} className="text-xs h-8 px-3 rounded-lg">
                        {updatingOrder === order._id ? (
                          <span className="h-3 w-3 rounded-full border-2 border-gray-400 border-t-gray-800 animate-spin" />
                        ) : (
                          <>Update <ChevronDown className="h-3 w-3 ml-1" /></>
                        )}
                      </Button>
                      <div className="absolute right-0 top-full mt-1 bg-white shadow-xl rounded-xl py-1.5 min-w-[140px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 border border-gray-100">
                        {ORDER_STATUSES.filter((s) => s !== order.status).map((status) => (
                          <button
                            key={status}
                            onClick={(e) => { e.stopPropagation(); updateStatus(order._id, status); }}
                            className={cn('flex items-center gap-2 w-full text-left px-3 py-2 text-xs hover:bg-gray-50 capitalize transition-colors', STATUS_META[status]?.text)}
                          >
                            {STATUS_META[status]?.icon}
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {isLoadingMore && (
                <>
                  {[...Array(3)].map((_, i) => (
                    <tr key={`load-more-table-${i}`}>
                      <td colSpan={8} className="px-5 py-3.5">
                        <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
                      </td>
                    </tr>
                  ))}
                </>
              )}
              {!isLoading && !isLoadingMore && !hasMore && orders.length > 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500">
                    You’ve reached the end of the orders list.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        )}

        {viewMode === 'grid' && (
          <div className="hidden md:grid grid-cols-2 xl:grid-cols-3 gap-4 p-4">
            {isLoading ? (
              [...Array(6)].map((_, i) => <div key={i} className="h-48 rounded-2xl bg-gray-100 animate-pulse" />)
            ) : visibleOrders.map((order) => (
              <div
                key={order._id}
                className="rounded-2xl border border-gray-200/90 bg-white p-4 shadow-sm transition-shadow hover:border-gray-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{order.orderNumber}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{typeof order.user === 'object' ? order.user.name : '—'}</p>
                  </div>
                  <span className={cn('shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full capitalize', getOrderStatusColor(order.status))}>
                    {order.status}
                  </span>
                </div>
                <div className="mt-3 text-xs text-gray-500 space-y-1">
                  <p>Date: <span className="text-gray-700">{formatDate(order.createdAt)}</span></p>
                  <p>Items: <span className="text-gray-700">{(order.items ?? []).length}</span></p>
                  <p>Total: <span className="text-gray-900 font-bold">{formatPrice(order.total)}</span></p>
                  <p>
                    Payment:{' '}
                    <span
                      className={cn(
                        'font-semibold capitalize',
                        order.paymentStatus === 'paid'
                          ? 'text-green-700'
                          : order.paymentStatus === 'failed'
                            ? 'text-red-700'
                            : 'text-amber-700',
                      )}
                    >
                      {order.paymentStatus}
                    </span>
                  </p>
                </div>
                <Link
                  href={`/admin/orders/${encodeURIComponent(order._id)}`}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50/80 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:border-brand-300 hover:bg-brand-50/60 hover:text-brand-800"
                >
                  View details
                  <ChevronRight className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                </Link>
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Change status</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ORDER_STATUSES.filter((s) => s !== order.status).map((status) => (
                      <button
                        key={status}
                        onClick={(e) => { e.stopPropagation(); updateStatus(order._id, status); }}
                        disabled={updatingOrder === order._id}
                        className={cn(
                          'px-2 py-1 rounded-lg text-[10px] font-bold border transition-all hover:shadow-sm disabled:opacity-50 uppercase tracking-tighter',
                          STATUS_META[status]?.bg || 'bg-gray-50', 
                          STATUS_META[status]?.text || 'text-gray-600',
                          'border-transparent hover:border-gray-200'
                        )}
                      >
                        {status.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {isLoadingMore &&
              [...Array(3)].map((_, i) => (
                <div key={`load-more-grid-${i}`} className="h-48 rounded-2xl bg-gray-100 animate-pulse" />
              ))}
            {!isLoading && !isLoadingMore && !hasMore && orders.length > 0 && (
              <div className="col-span-full text-center text-xs font-semibold text-gray-500 py-1">
                You’ve reached the end of the orders list.
              </div>
            )}
          </div>
        )}

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-gray-50">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="p-4 space-y-2 animate-pulse">
                <div className="flex gap-3">
                  <div className="h-14 w-11 rounded-xl bg-gray-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))
          ) : visibleOrders.map((order) => {
            const lineItems = order.items ?? [];
            const firstLine = lineItems[0];
            return (
            <div key={order._id} className="p-4">
              <div
                className="flex items-start gap-3 cursor-pointer"
                onClick={() => router.push(`/admin/orders/${encodeURIComponent(order._id)}`)}
              >
                {/* Product thumbnail */}
                {firstLine?.image && (
                  <div className="relative h-14 w-11 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                    <Image src={firstLine.image} alt={firstLine.name} fill sizes="44px" className="object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900">{order.orderNumber}</p>
                    <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full capitalize flex-shrink-0', getOrderStatusColor(order.status))}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{typeof order.user === 'object' ? order.user.name : '—'}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm font-bold text-gray-900">{formatPrice(order.total)}</p>
                    <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    {lineItems.length} item{lineItems.length !== 1 ? 's' : ''} · Payment:{' '}
                    <span className="font-semibold">{order.paymentStatus}</span>
                  </p>
                  <button
                    onClick={() => router.push(`/admin/orders/${encodeURIComponent(order._id)}`)}
                    className="text-xs font-bold text-brand-600"
                  >
                    View Details
                  </button>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Change Status</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ORDER_STATUSES.filter((s) => s !== order.status).map((status) => (
                      <button
                        key={status}
                        onClick={(e) => { e.stopPropagation(); updateStatus(order._id, status); }}
                        disabled={updatingOrder === order._id}
                        className={cn(
                          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all disabled:opacity-50 uppercase tracking-tighter',
                          STATUS_META[status]?.bg, STATUS_META[status]?.text,
                          'border-transparent'
                        )}
                      >
                        {status.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
          })}
          {isLoadingMore &&
            [...Array(2)].map((_, i) => (
              <div key={`load-more-mobile-${i}`} className="p-4 space-y-2 animate-pulse">
                <div className="flex gap-3">
                  <div className="h-14 w-11 rounded-xl bg-gray-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          {!isLoading && !isLoadingMore && !hasMore && orders.length > 0 && (
            <div className="py-3 text-center text-xs font-semibold text-gray-500">
              You’ve reached the end of the orders list.
            </div>
          )}
        </div>

        {!isLoading && visibleOrders.length === 0 && (
          <div className="py-12 text-center text-gray-400 text-sm">No orders match your filters.</div>
        )}
        <div ref={loadMoreRef} className="h-px" aria-hidden />
      </div>
      )}

      {/* Tracking modal (when marking shipped) */}
      {trackingOpenFor && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60">
          <div className="absolute inset-0" onClick={() => setTrackingOpenFor(null)} />
          <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-gray-100">
              <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Shipping</p>
              <h3 className="text-lg font-bold text-gray-900">Add tracking details</h3>
              <p className="text-xs text-gray-500 mt-1">
                Required — users will see this in their order details.
              </p>
            </div>
            <div className="p-4 sm:p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Courier
                </label>
                <input
                  value={trackingForm.shippingCarrier}
                  onChange={(e) => { setTrackingErrors((p) => ({ ...p, shippingCarrier: undefined })); setTrackingForm((p) => ({ ...p, shippingCarrier: e.target.value })); }}
                  placeholder="e.g. Delhivery, BlueDart, FedEx"
                  className={cn(
                    "w-full h-11 px-3.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300",
                    trackingErrors.shippingCarrier ? "border-red-300 bg-red-50/40" : "border-gray-200"
                  )}
                />
                {trackingErrors.shippingCarrier && <p className="text-xs text-red-600 mt-1">{trackingErrors.shippingCarrier}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Tracking / AWB number
                </label>
                <input
                  value={trackingForm.trackingNumber}
                  onChange={(e) => { setTrackingErrors((p) => ({ ...p, trackingNumber: undefined })); setTrackingForm((p) => ({ ...p, trackingNumber: e.target.value })); }}
                  placeholder="e.g. 1234567890"
                  className={cn(
                    "w-full h-11 px-3.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300",
                    trackingErrors.trackingNumber ? "border-red-300 bg-red-50/40" : "border-gray-200"
                  )}
                />
                {trackingErrors.trackingNumber && <p className="text-xs text-red-600 mt-1">{trackingErrors.trackingNumber}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Tracking URL (optional)
                </label>
                <input
                  value={trackingForm.trackingUrl}
                  onChange={(e) => { setTrackingErrors((p) => ({ ...p, trackingUrl: undefined })); setTrackingForm((p) => ({ ...p, trackingUrl: e.target.value })); }}
                  placeholder="https://..."
                  className={cn(
                    "w-full h-11 px-3.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300",
                    trackingErrors.trackingUrl ? "border-red-300 bg-red-50/40" : "border-gray-200"
                  )}
                />
                {trackingErrors.trackingUrl && <p className="text-xs text-red-600 mt-1">{trackingErrors.trackingUrl}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Note (optional)
                </label>
                <input
                  value={trackingForm.note}
                  onChange={(e) => setTrackingForm((p) => ({ ...p, note: e.target.value }))}
                  placeholder="e.g. Dispatched from warehouse"
                  className="w-full h-11 px-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                />
              </div>
            </div>
            <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50 flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setTrackingOpenFor(null)}>
                Cancel
              </Button>
              <Button
                variant="brand"
                className="flex-1 rounded-xl"
                loading={updatingOrder === trackingOpenFor}
                onClick={submitShipped}
              >
                Mark Shipped
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
