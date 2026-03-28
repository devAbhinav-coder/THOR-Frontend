'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Package, Truck, CheckCircle2, Clock, AlertCircle, TrendingUp, RefreshCw, LayoutGrid, List } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { Order, OrderStatus, DashboardAnalytics } from '@/types';
import { formatPrice, formatDate, getOrderStatusColor, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SearchField } from '@/components/ui/SearchField';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

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
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const fetchOrders = async (page = 1, append = false) => {
    if (append) setIsLoadingMore(true);
    else setIsLoading(true);
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
    } catch {
      // silent fail
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    adminApi.getAnalytics().then((res) => setAnalytics(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setOrders([]);
    setHasMore(true);
    fetchOrders(1, false);
  }, [statusFilter]);

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
  }, [hasMore, isLoading, isLoadingMore, pagination.currentPage, statusFilter]);

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

  // Build status counts from analytics
  const statusCounts: Record<string, number> = {};
  analytics?.ordersByStatus?.forEach(({ _id, count }) => { statusCounts[_id] = count; });

  return (
    <div className="p-4 sm:p-6 xl:p-8 space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500 text-sm mt-0.5">{pagination.total} orders total</p>
      </div>

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

      {/* Revenue bar chart */}
      {analytics?.revenueByMonth && analytics.revenueByMonth.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Revenue — Last 6 months</h3>
            <div className="text-xs text-gray-400">Hover bars for details</div>
          </div>
          <div className="flex items-end gap-2 h-28">
            {analytics.revenueByMonth.slice(-6).map((d, i) => {
              const maxR = Math.max(...analytics.revenueByMonth.slice(-6).map((x) => x.revenue), 1);
              const pct = (d.revenue / maxR) * 100;
              const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {formatPrice(d.revenue)} · {d.orders} orders
                  </div>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-brand-700 via-brand-500 to-brand-300 transition-all duration-500 min-h-[4px] shadow-[0_6px_20px_rgba(232,96,76,0.35)]"
                    style={{ height: `${Math.max(pct, 4)}%` }}
                  />
                  <span className="text-[10px] text-gray-400 font-medium">
                    {MONTHS[d._id.month - 1]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
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

        {/* Desktop table */}
        {viewMode === 'table' && <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
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
              ) : filteredOrders.map((order) => (
                <tr
                  key={order._id}
                  className="hover:bg-gray-50/80 transition-colors cursor-pointer"
                  onClick={() => router.push(`/admin/orders/${order._id}`)}
                >
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-semibold text-brand-600">{order.orderNumber}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-medium text-gray-900">{typeof order.user === 'object' ? order.user.name : '—'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{typeof order.user === 'object' ? order.user.email : ''}</p>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-gray-500">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3.5 text-sm text-gray-600">{order.items.length}</td>
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
            </tbody>
          </table>
        </div>}

        {viewMode === 'grid' && (
          <div className="hidden md:grid grid-cols-2 xl:grid-cols-3 gap-4 p-4">
            {isLoading ? (
              [...Array(6)].map((_, i) => <div key={i} className="h-48 rounded-2xl bg-gray-100 animate-pulse" />)
            ) : filteredOrders.map((order) => (
              <div key={order._id} className="rounded-2xl border border-gray-100 bg-white p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-brand-600">{order.orderNumber}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{typeof order.user === 'object' ? order.user.name : '—'}</p>
                  </div>
                  <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full capitalize', getOrderStatusColor(order.status))}>
                    {order.status}
                  </span>
                </div>
                <div className="mt-3 text-xs text-gray-500 space-y-1">
                  <p>Date: <span className="text-gray-700">{formatDate(order.createdAt)}</span></p>
                  <p>Items: <span className="text-gray-700">{order.items.length}</span></p>
                  <p>Total: <span className="text-gray-900 font-bold">{formatPrice(order.total)}</span></p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <button
                    onClick={() => router.push(`/admin/orders/${order._id}`)}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                  >
                    View details
                  </button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 px-3 rounded-lg"
                    onClick={() => updateStatus(order._id, 'processing')}
                  >
                    Mark Processing
                  </Button>
                </div>
              </div>
            ))}
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
          ) : filteredOrders.map((order) => (
            <div key={order._id} className="p-4">
              <div
                className="flex items-start gap-3 cursor-pointer"
                onClick={() => router.push(`/admin/orders/${order._id}`)}
              >
                {/* Product thumbnail */}
                {order.items[0]?.image && (
                  <div className="relative h-14 w-11 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                    <Image src={order.items[0].image} alt={order.items[0].name} fill sizes="44px" className="object-cover" />
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

              {expandedOrder === order._id && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 animate-fadeIn">
                  <p className="text-xs text-gray-500">{order.items.length} item{order.items.length > 1 ? 's' : ''} · Payment: <span className="font-semibold">{order.paymentStatus}</span></p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {ORDER_STATUSES.filter((s) => s !== order.status).map((status) => (
                      <button
                        key={status}
                        onClick={(e) => { e.stopPropagation(); updateStatus(order._id, status); }}
                        disabled={updatingOrder === order._id}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50',
                          STATUS_META[status]?.bg, STATUS_META[status]?.text
                        )}
                      >
                        {STATUS_META[status]?.icon} {status}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {!isLoading && filteredOrders.length === 0 && (
          <div className="py-12 text-center text-gray-400 text-sm">No orders found.</div>
        )}
      </div>

      <div ref={loadMoreRef} className="h-8" />
      {isLoadingMore && (
        <div className="flex items-center justify-center pb-2">
          <span className="h-5 w-5 rounded-full border-2 border-gray-300 border-t-brand-600 animate-spin" />
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
