"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  LayoutGrid,
  List,
  HandIcon,
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { Order, OrderStatus, DashboardAnalytics } from "@/types";
import { formatPrice, formatDate, getOrderStatusColor, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SearchField } from "@/components/ui/SearchField";
import toast from "react-hot-toast";
import Image from "next/image";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminErrorState from "@/components/admin/AdminErrorState";
import { OrdersInsightsPanel } from "@/components/admin/OrdersInsightsPanel";

const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];
const NEXT_STATUS_MAP: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled", "refunded"],
  delivered: ["refunded"],
  cancelled: ["refunded"],
  refunded: [],
};

const STATUS_META: Record<
  string,
  { icon: React.ReactNode; label: string; bg: string; text: string }
> = {
  pending: {
    icon: <Clock className='h-4 w-4' />,
    label: "Pending",
    bg: "bg-yellow-50",
    text: "text-yellow-700",
  },
  confirmed: {
    icon: <CheckCircle2 className='h-4 w-4' />,
    label: "Confirmed",
    bg: "bg-blue-50",
    text: "text-blue-700",
  },
  processing: {
    icon: <Package className='h-4 w-4' />,
    label: "Processing",
    bg: "bg-purple-50",
    text: "text-purple-700",
  },
  shipped: {
    icon: <Truck className='h-4 w-4' />,
    label: "Shipped",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
  },
  delivered: {
    icon: <CheckCircle2 className='h-4 w-4' />,
    label: "Delivered",
    bg: "bg-green-50",
    text: "text-green-700",
  },
  cancelled: {
    icon: <AlertCircle className='h-4 w-4' />,
    label: "Cancelled",
    bg: "bg-red-50",
    text: "text-red-700",
  },
  refunded: {
    icon: <RefreshCw className='h-4 w-4' />,
    label: "Refunded",
    bg: "bg-gray-50",
    text: "text-gray-700",
  },
};

export default function AdminOrdersPage() {
  const getNextStatuses = (status: OrderStatus) =>
    NEXT_STATUS_MAP[status] || [];

  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const [statusFilter, setStatusFilter] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
  });
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [trackingOpenFor, setTrackingOpenFor] = useState<string | null>(null);
  const [trackingForm, setTrackingForm] = useState<{
    shippingCarrier: string;
    trackingNumber: string;
    trackingUrl: string;
    note: string;
  }>({
    shippingCarrier: "",
    trackingNumber: "",
    trackingUrl: "",
    note: "",
  });
  const [trackingErrors, setTrackingErrors] = useState<{
    shippingCarrier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
  }>({});
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "value_high" | "value_low"
  >("newest");
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [ordersLoadError, setOrdersLoadError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  const fetchOrders = useCallback(
    async (page = 1, append = false) => {
      if (append) setIsLoadingMore(true);
      else {
        setIsLoading(true);
        setOrdersLoadError(false);
      }
      try {
        const params: Record<string, string | number> = { page, limit: 20 };
        if (statusFilter) params.status = statusFilter;
        if (debouncedSearch) params.search = debouncedSearch;
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
          toast.error("Could not load more orders.");
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [statusFilter, debouncedSearch],
  );

  const handleRefreshList = useCallback(() => {
    setIsRefreshing(true);
    void Promise.all([
      fetchOrders(1, false),
      adminApi
        .getAnalytics()
        .then((res) => setAnalytics(res.data))
        .catch(() => {}),
    ]).finally(() => setIsRefreshing(false));
  }, [fetchOrders]);

  useEffect(() => {
    adminApi
      .getAnalytics()
      .then((res) => setAnalytics(res.data))
      .catch(() => {});
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
      { rootMargin: "240px" },
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, pagination.currentPage, fetchOrders]);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    if (status === "shipped") {
      const existing = orders.find((o) => o._id === orderId);
      setTrackingForm({
        shippingCarrier: existing?.shippingCarrier || "",
        trackingNumber: existing?.trackingNumber || "",
        trackingUrl: existing?.trackingUrl || "",
        note: "",
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
      toast.error(error.message || "Failed to update status");
    } finally {
      setUpdatingOrder(null);
    }
  };

  const submitShipped = async () => {
    if (!trackingOpenFor) return;
    const errs: typeof trackingErrors = {};
    if (!trackingForm.shippingCarrier.trim())
      errs.shippingCarrier = "Courier is required";
    if (!trackingForm.trackingNumber.trim())
      errs.trackingNumber = "Tracking/AWB is required";
    if (
      trackingForm.trackingUrl.trim() &&
      !/^https?:\/\//i.test(trackingForm.trackingUrl.trim())
    ) {
      errs.trackingUrl = "Tracking URL must start with http(s)://";
    }
    setTrackingErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setUpdatingOrder(trackingOpenFor);
    try {
      await adminApi.updateOrderStatus(trackingOpenFor, {
        status: "shipped",
        note: trackingForm.note || undefined,
        shippingCarrier: trackingForm.shippingCarrier || undefined,
        trackingNumber: trackingForm.trackingNumber || undefined,
        trackingUrl: trackingForm.trackingUrl || undefined,
      });
      toast.success("Marked as shipped");
      setTrackingOpenFor(null);
      fetchOrders(pagination.currentPage);
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message || "Failed to update status",
      );
    } finally {
      setUpdatingOrder(null);
    }
  };

  const visibleOrders = useMemo(() => {
    const list = [...orders];
    switch (sortBy) {
      case "oldest":
        list.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
        break;
      case "value_high":
        list.sort((a, b) => b.total - a.total);
        break;
      case "value_low":
        list.sort((a, b) => a.total - b.total);
        break;
      default:
        list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    }
    return list;
  }, [orders, sortBy]);

  // Build status counts from analytics
  const statusCounts: Record<string, number> = {};
  analytics?.ordersByStatus?.forEach(({ _id, count }) => {
    statusCounts[_id] = count;
  });

  return (
    <div className='min-h-[calc(100dvh-4rem)] bg-gradient-to-b from-slate-50/90 via-white to-white'>
      <div className='p-4 sm:p-6 xl:p-8 max-w-[1600px] mx-auto space-y-8'>
        <AdminPageHeader
          title='Orders'
          badge={pagination.total > 0 ? `${pagination.total.toLocaleString()} total` : undefined}
          description='Fulfil, track, and update status — click any row for the full order.'
          actions={
            <>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='rounded-xl border-gray-200 bg-white shadow-sm'
                onClick={handleRefreshList}
                disabled={isRefreshing || isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Link
                href='/admin/orders/offline'
                className='inline-flex items-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:border-brand-300 hover:bg-brand-50/50 transition-colors shadow-sm gap-2'
              >
                <HandIcon className='h-4 w-4 text-brand-600' />
                Offline order
              </Link>
              <Link
                href='/admin/returns'
                className='inline-flex items-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition'
              >
                Returns
              </Link>
            </>
          }
        />

        {/* Stats: today pulse + month + pipeline */}
        <div className='grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4'>
          {/* Revenue highlight — month */}
          <div className='col-span-2 sm:col-span-2 xl:col-span-2 relative overflow-hidden rounded-2xl border p-4 shadow-sm transition-shadow hover:shadow-md bg-gradient-to-br from-navy-900 to-navy-800 border-navy-700 text-white'>
            <div className='flex items-start justify-between gap-2'>
              <div>
                <p className='text-[11px] font-semibold uppercase tracking-wide text-navy-300'>
                  This Month
                </p>
                <p className='mt-1.5 text-2xl font-bold tabular-nums tracking-tight text-white'>
                  {analytics ? formatPrice(analytics.overview.monthRevenue) : "—"}
                </p>
                <p className='mt-0.5 text-[11px] text-navy-400'>
                  {analytics?.overview.monthOrders || 0} orders
                  {analytics && analytics.overview.revenueGrowth !== undefined && (
                    <span className={cn('ml-1 font-semibold', analytics.overview.revenueGrowth >= 0 ? "text-emerald-400" : "text-amber-300")}>
                      ({analytics.overview.revenueGrowth >= 0 ? "▲" : "▼"} {Math.abs(Math.round(analytics.overview.revenueGrowth))}%)
                    </span>
                  )}
                </p>
              </div>
              <div className='h-10 w-10 rounded-xl flex items-center justify-center shrink-0 bg-navy-800 text-brand-300 ring-1 ring-white/10'>
                <TrendingUp className='h-5 w-5' />
              </div>
            </div>
          </div>

          {/* Today */}
          <div className='col-span-2 sm:col-span-1 xl:col-span-1 relative overflow-hidden rounded-2xl border p-4 shadow-sm transition-shadow hover:shadow-md bg-gradient-to-br from-blue-50 to-white border-blue-100/80'>
            <div className='flex items-start justify-between gap-2'>
              <div>
                <p className='text-[11px] font-semibold uppercase tracking-wide text-gray-500'>
                  Today
                </p>
                <p className='mt-1.5 text-2xl font-bold text-gray-900 tabular-nums tracking-tight'>
                  {analytics != null ? formatPrice(analytics.overview.revenueToday ?? 0) : '—'}
                </p>
                <p className='mt-0.5 text-[11px] text-gray-500'>
                  {analytics != null ? (analytics.overview.ordersToday ?? 0).toLocaleString() : '—'} orders today
                </p>
              </div>
              <div className='h-10 w-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-100 text-blue-700'>
                <Calendar className='h-5 w-5' />
              </div>
            </div>
          </div>

          {/* Status counts mapped similar to user stat cards */}
          {(
            [
              "pending",
              "processing",
              "shipped",
              "delivered",
              "cancelled",
            ] as OrderStatus[]
          ).map((status) => {
            const meta = STATUS_META[status];
            const count = statusCounts[status] || 0;
            const isSelected = statusFilter === status;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(isSelected ? "" : status)}
                className={cn(
                  "relative overflow-hidden rounded-2xl border p-4 text-left transition-all hover:shadow-md",
                  isSelected ? "bg-white shadow-md ring-2 ring-brand-400 border-transparent scale-[1.02]" : "bg-gradient-to-br from-slate-50 to-white border-slate-200/80 shadow-sm",
                )}
              >
                <div className='flex items-start justify-between gap-2'>
                  <div>
                    <p className='text-[11px] font-semibold uppercase tracking-wide text-gray-500'>
                      {meta.label}
                    </p>
                    <p className='mt-1.5 text-2xl font-bold text-gray-900 tabular-nums tracking-tight'>
                      {count}
                    </p>
                  </div>
                  <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", meta.bg, meta.text)}>
                    {meta.icon}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

      {/* Order analytics: volume trend + status mix (no revenue chart here) */}
      {analytics &&
        (analytics.revenueByMonth.length > 0 ||
          analytics.ordersByStatus.length > 0) && (
          <OrdersInsightsPanel analytics={analytics} />
        )}

      {ordersLoadError && !isLoading && (
        <AdminErrorState
          title='Couldn’t load orders'
          message='Check your API connection and permissions, then try again.'
          onRetry={() => fetchOrders(1, false)}
        />
      )}

      {/* Filters + list */}
      {!ordersLoadError && (
        <section className='rounded-2xl border border-gray-200/80 bg-white shadow-[0_20px_50px_-28px_rgba(15,23,42,0.18)] flex flex-col'>
          <div className='sticky top-0 z-20 px-4 sm:px-6 py-4 border-b border-gray-100 bg-white/95 backdrop-blur-md flex flex-wrap items-center gap-3 shadow-sm rounded-t-2xl'>
            <SearchField
              value={search}
              onChange={setSearch}
              placeholder='Search order #, name or email…'
              isLoading={search.trim() !== debouncedSearch}
              className='flex-1 min-w-[200px]'
              aria-label='Search orders'
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className='h-10 px-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 font-medium text-gray-700'
            >
              <option value=''>All Statuses</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s} className='capitalize'>{s}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className='h-10 px-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 font-medium text-gray-700'
            >
              <option value='newest'>Newest first</option>
              <option value='oldest'>Oldest first</option>
              <option value='value_high'>High → Low value</option>
              <option value='value_low'>Low → High value</option>
            </select>
            <span className='hidden sm:flex items-center rounded-lg bg-white border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-500'>
              {visibleOrders.length} / {pagination.total || orders.length} shown
            </span>
            <div className='ml-auto flex items-center rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm'>
              <button type='button' onClick={() => setViewMode('table')}
                className={`h-9 w-9 grid place-items-center transition-colors ${viewMode === 'table' ? 'bg-navy-900 text-white' : 'text-gray-400 hover:bg-gray-50'}`}
                title='Table view'><List className='h-4 w-4' /></button>
              <button type='button' onClick={() => setViewMode('grid')}
                className={`h-9 w-9 grid place-items-center transition-colors ${viewMode === 'grid' ? 'bg-navy-900 text-white' : 'text-gray-400 hover:bg-gray-50'}`}
                title='Grid view'><LayoutGrid className='h-4 w-4' /></button>
            </div>
          </div>

          {/* Tablet / desktop table */}
          {viewMode === 'table' && (
            <div className='hidden md:block overflow-x-auto overflow-y-hidden [scrollbar-width:thin]'>
              <table className='w-full text-sm border-collapse min-w-[700px]'>
                <thead>
                  <tr className='bg-gradient-to-r from-gray-50/80 to-white text-[11px] text-gray-500 uppercase tracking-widest border-b border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)]'>
                    <th className='text-left px-5 py-4 font-bold'>Order #</th>
                    <th className='text-left px-4 py-4 font-bold'>Customer</th>
                    <th className='text-left px-4 py-4 font-bold'>Date</th>
                    <th className='text-left px-4 py-4 font-bold'>Items</th>
                    <th className='text-left px-4 py-4 font-bold'>Total</th>
                    <th className='text-left px-4 py-4 font-bold'>Payment</th>
                    <th className='text-left px-4 py-4 font-bold'>Status</th>
                    <th className='text-left px-4 py-4 font-bold'>Action</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-50 bg-white'>
                  {isLoading ?
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td colSpan={8} className='px-5 py-4'>
                          <div className='h-4 bg-gray-100 rounded-lg animate-pulse' />
                        </td>
                      </tr>
                    ))
                  : visibleOrders.map((order) => (
                      <tr
                        key={order._id}
                        className='group hover:bg-brand-50/40 transition-all cursor-pointer hover:shadow-[inset_4px_0_0_0_#0284c7] hover:bg-gradient-to-r hover:from-brand-50/50 hover:to-transparent'
                        onClick={() => {
                          if (navigatingTo === order._id) return;
                          setNavigatingTo(order._id);
                          router.push(`/admin/orders/${encodeURIComponent(order._id)}`);
                        }}
                      >
                        <td className='px-5 py-4'>
                          <div className='flex items-center gap-2'>
                            {navigatingTo === order._id && (
                              <span className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
                            )}
                            <p className='text-sm font-bold text-brand-600 group-hover:text-brand-700 transition-colors'>{order.orderNumber}</p>
                          </div>
                        </td>
                        <td className='px-4 py-4'>
                          <p className='text-sm font-semibold text-gray-900 leading-tight'>
                            {typeof order.user === 'object' ? (order.user?.name ?? '—') : '—'}
                          </p>
                          <p className='text-[11px] text-gray-400 mt-0.5 truncate max-w-[160px]'>
                            {typeof order.user === 'object' ? order.user?.email : ''}
                          </p>
                        </td>
                        <td className='px-4 py-4 text-sm text-gray-500 whitespace-nowrap'>{formatDate(order.createdAt)}</td>
                        <td className='px-4 py-4'>
                          <span className='inline-flex items-center justify-center h-6 min-w-[1.5rem] rounded-lg bg-gray-100 text-xs font-bold text-gray-600 px-2'>
                            {(order.items ?? []).length}
                          </span>
                        </td>
                        <td className='px-4 py-4 text-sm font-bold text-gray-900'>{formatPrice(order.total)}</td>
                        <td className='px-4 py-4'>
                          <span className={cn('inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full capitalize ring-1 ring-inset',
                            order.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                            : order.paymentStatus === 'failed' ? 'bg-red-50 text-red-700 ring-red-200'
                            : 'bg-amber-50 text-amber-700 ring-amber-200')}>
                            {order.paymentStatus === 'paid' ? '✓' : order.paymentStatus === 'failed' ? '✕' : '○'} {order.paymentStatus}
                          </span>
                        </td>
                        <td className='px-4 py-4'>
                          <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full capitalize shadow-sm', getOrderStatusColor(order.status))}>
                            {STATUS_META[order.status]?.icon}
                            {order.status}
                          </span>
                        </td>
                        <td className='px-4 py-4' onClick={(e) => e.stopPropagation()}>
                          <div className='relative group/btn inline-block'>
                            <Button variant='outline' size='sm' disabled={updatingOrder === order._id}
                              className='text-xs h-8 px-3 rounded-lg border-gray-200 hover:border-brand-300 hover:bg-brand-50'>
                              {updatingOrder === order._id
                                ? <span className='h-3 w-3 rounded-full border-2 border-gray-400 border-t-gray-800 animate-spin' />
                                : <><span>Update</span><ChevronDown className='h-3 w-3 ml-1' /></>}
                            </Button>
                            <div className='absolute right-0 top-full mt-1 bg-white shadow-2xl rounded-xl py-1.5 min-w-[150px] opacity-0 invisible group-hover/btn:opacity-100 group-hover/btn:visible transition-all z-20 border border-gray-100'>
                              {getNextStatuses(order.status).map((status) => (
                                <button key={status}
                                  onClick={(e) => { e.stopPropagation(); updateStatus(order._id, status); }}
                                  className={cn('flex items-center gap-2 w-full text-left px-3 py-2 text-xs hover:bg-gray-50 capitalize transition-colors rounded-lg mx-1 w-[calc(100%-8px)]', STATUS_META[status]?.text)}>
                                  {STATUS_META[status]?.icon}{status}
                                </button>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  }
                  {isLoadingMore && (
                    <>
                      {[...Array(3)].map((_, i) => (
                        <tr key={`load-more-table-${i}`}>
                          <td colSpan={8} className='px-5 py-4'>
                            <div className='h-4 w-full animate-pulse rounded bg-gray-100' />
                          </td>
                        </tr>
                      ))}
                    </>
                  )}
                  {!isLoading &&
                    !isLoadingMore &&
                    !hasMore &&
                    orders.length > 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className='px-5 py-6 text-center text-xs font-semibold text-gray-500'
                        >
                          You’ve reached the end of the orders list.
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>
          )}

          {viewMode === "grid" && (
            <div className='hidden md:grid grid-cols-2 xl:grid-cols-3 gap-4 p-4'>
              {isLoading ?
                [...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className='h-48 rounded-2xl bg-gray-100 animate-pulse'
                  />
                ))
              : visibleOrders.map((order) => (
                  <div
                    key={order._id}
                    className='rounded-2xl border border-gray-200/80 bg-white shadow-sm transition-all hover:shadow-xl hover:-translate-y-0.5 hover:border-brand-300 overflow-hidden group flex flex-col'
                  >
                    <div className='p-4 border-b border-gray-50 flex items-start justify-between gap-2 bg-gradient-to-r from-gray-50/40 to-white'>
                      <div className='min-w-0'>
                        <div className='flex items-center gap-2'>
                          {navigatingTo === order._id && (
                            <span className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
                          )}
                          <p className='text-sm font-bold text-gray-900 group-hover:text-brand-600 transition-colors'>
                            {order.orderNumber}
                          </p>
                        </div>
                        <p className='text-xs text-gray-500 mt-0.5 truncate'>
                          {typeof order.user === "object" ?
                            (order.user?.name ?? "—")
                          : "—"}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-lg capitalize shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)]",
                          getOrderStatusColor(order.status),
                        )}
                      >
                        {order.status}
                      </span>
                    </div>
                    <div className='p-4 text-xs text-gray-500 space-y-2 flex-1'>
                      <div className="flex justify-between items-center">
                        <span>Date</span>
                        <span className='text-gray-900 font-medium'>
                          {formatDate(order.createdAt)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Items</span>
                        <span className='text-gray-900 font-medium'>
                          {(order.items ?? []).length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Total</span>
                        <span className='text-gray-900 font-bold'>
                          {formatPrice(order.total)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Payment</span>
                        <span
                          className={cn(
                            "font-bold capitalize",
                            order.paymentStatus === "paid" ? "text-green-700"
                            : order.paymentStatus === "failed" ? "text-red-700"
                            : "text-amber-700",
                          )}
                        >
                          {order.paymentStatus}
                        </span>
                      </div>
                    </div>
                    
                    <div className="px-4 pb-4 mt-auto space-y-3">
                      <Link
                        href={`/admin/orders/${encodeURIComponent(order._id)}`}
                        onClick={() => setNavigatingTo(order._id)}
                        className='flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-2 text-sm font-bold text-gray-900 transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800 shadow-sm hover:shadow'
                      >
                        {navigatingTo === order._id ? (
                          <span className="h-4 w-4 shrink-0 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
                        ) : (
                          <>
                            View details
                            <ChevronRight
                              className='h-4 w-4 shrink-0 opacity-70'
                              aria-hidden
                            />
                          </>
                        )}
                      </Link>
                      <div className='pt-3 border-t border-gray-100'>
                        <p className='text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2'>
                          Change status
                        </p>
                        <div className='flex flex-wrap gap-1.5'>
                          {getNextStatuses(order.status).map((status) => (
                            <button
                              key={status}
                              onClick={(e) => {
                                e.stopPropagation();
                                updateStatus(order._id, status);
                              }}
                              disabled={updatingOrder === order._id}
                              className={cn(
                                "px-2 py-1 rounded-lg text-[10px] font-bold border transition-all hover:shadow-sm disabled:opacity-50 uppercase tracking-tighter",
                                STATUS_META[status]?.bg || "bg-gray-50",
                                STATUS_META[status]?.text || "text-gray-600",
                                "border-transparent hover:border-gray-200",
                              )}
                            >
                              {status.replace(/_/g, " ")}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              }
              {isLoadingMore &&
                [...Array(3)].map((_, i) => (
                  <div
                    key={`load-more-grid-${i}`}
                    className='h-48 rounded-2xl bg-gray-100 animate-pulse'
                  />
                ))}
              {!isLoading &&
                !isLoadingMore &&
                !hasMore &&
                orders.length > 0 && (
                  <div className='col-span-full text-center text-xs font-semibold text-gray-500 py-1'>
                    You’ve reached the end of the orders list.
                  </div>
                )}
            </div>
          )}

          {/* Mobile cards */}
          <div className='md:hidden divide-y divide-gray-50'>
            {isLoading ?
              [...Array(4)].map((_, i) => (
                <div key={i} className='p-4 space-y-2 animate-pulse'>
                  <div className='flex gap-3'>
                    <div className='h-14 w-11 rounded-xl bg-gray-100' />
                    <div className='flex-1 space-y-2'>
                      <div className='h-4 bg-gray-100 rounded w-2/3' />
                      <div className='h-3 bg-gray-100 rounded w-1/2' />
                    </div>
                  </div>
                </div>
              ))
            : visibleOrders.map((order) => {
                const lineItems = order.items ?? [];
                const firstLine = lineItems[0];
                return (
                  <div key={order._id} className='p-4'>
                    <div
                      className='flex items-start gap-3 cursor-pointer'
                      onClick={() =>
                        router.push(
                          `/admin/orders/${encodeURIComponent(order._id)}`,
                        )
                      }
                    >
                      {/* Product thumbnail */}
                      {firstLine?.image && (
                        <div className='relative h-14 w-11 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0'>
                          <Image
                            src={firstLine.image}
                            alt={firstLine.name}
                            fill
                            sizes='44px'
                            className='object-cover'
                          />
                        </div>
                      )}
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center justify-between gap-2'>
                          <p className='text-sm font-semibold text-gray-900'>
                            {order.orderNumber}
                          </p>
                          <span
                            className={cn(
                              "text-xs font-semibold px-2.5 py-1 rounded-full capitalize flex-shrink-0",
                              getOrderStatusColor(order.status),
                            )}
                          >
                            {order.status}
                          </span>
                        </div>
                        <p className='text-xs text-gray-500 mt-0.5'>
                          {typeof order.user === "object" ?
                            order.user?.name
                          : "—"}
                        </p>
                        <div className='flex items-center justify-between mt-1'>
                          <p className='text-sm font-bold text-gray-900'>
                            {formatPrice(order.total)}
                          </p>
                          <p className='text-xs text-gray-400'>
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className='mt-3 pt-3 border-t border-gray-100 space-y-3'>
                      <div className='flex items-center justify-between'>
                        <p className='text-xs text-gray-500'>
                          {lineItems.length} item
                          {lineItems.length !== 1 ? "s" : ""} · Payment:{" "}
                          <span className='font-semibold'>
                            {order.paymentStatus}
                          </span>
                        </p>
                        <button
                          onClick={() =>
                            router.push(
                              `/admin/orders/${encodeURIComponent(order._id)}`,
                            )
                          }
                          className='text-xs font-bold text-brand-600'
                        >
                          View Details
                        </button>
                      </div>
                      <div>
                        <p className='text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5'>
                          Change Status
                        </p>
                        <div className='flex flex-wrap gap-1.5'>
                          {getNextStatuses(order.status).map((status) => (
                            <button
                              key={status}
                              onClick={(e) => {
                                e.stopPropagation();
                                updateStatus(order._id, status);
                              }}
                              disabled={updatingOrder === order._id}
                              className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all disabled:opacity-50 uppercase tracking-tighter",
                                STATUS_META[status]?.bg,
                                STATUS_META[status]?.text,
                                "border-transparent",
                              )}
                            >
                              {status.replace(/_/g, " ")}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            }
            {isLoadingMore &&
              [...Array(2)].map((_, i) => (
                <div
                  key={`load-more-mobile-${i}`}
                  className='p-4 space-y-2 animate-pulse'
                >
                  <div className='flex gap-3'>
                    <div className='h-14 w-11 rounded-xl bg-gray-100' />
                    <div className='flex-1 space-y-2'>
                      <div className='h-4 bg-gray-100 rounded w-2/3' />
                      <div className='h-3 bg-gray-100 rounded w-1/2' />
                    </div>
                  </div>
                </div>
              ))}
            {!isLoading && !isLoadingMore && !hasMore && orders.length > 0 && (
              <div className='py-3 text-center text-xs font-semibold text-gray-500'>
                You’ve reached the end of the orders list.
              </div>
            )}
          </div>

          {!isLoading && visibleOrders.length === 0 && (
            <div className='py-16 flex flex-col items-center gap-3 text-center'>
              <div className='h-14 w-14 rounded-2xl bg-gray-100 flex items-center justify-center'>
                <Package className='h-7 w-7 text-gray-300' />
              </div>
              <p className='text-sm font-semibold text-gray-500'>No orders match your filters</p>
              <p className='text-xs text-gray-400'>Try adjusting the status filter or search query</p>
              {statusFilter && (
                <button onClick={() => setStatusFilter('')} className='mt-1 text-xs font-bold text-brand-600 hover:underline'>Clear filter</button>
              )}
            </div>
          )}
          <div ref={loadMoreRef} className='h-px' aria-hidden />
        </section>
      )}

      {/* Tracking modal */}
      {trackingOpenFor && (
        <div className='fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm'>
          <div className='absolute inset-0' onClick={() => setTrackingOpenFor(null)} />
          <div className='relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden'>
            <div className='bg-gradient-to-br from-indigo-600 to-indigo-800 p-5 sm:p-6'>
              <div className='flex items-center gap-3'>
                <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15'>
                  <Truck className='h-5 w-5 text-white' />
                </div>
                <div>
                  <p className='text-[10px] font-bold uppercase tracking-widest text-indigo-200'>Shipping</p>
                  <h3 className='text-lg font-bold text-white leading-tight'>Add tracking details</h3>
                </div>
              </div>
              <p className='text-xs text-indigo-200 mt-2 ml-[52px]'>Customers will see this in their order details page.</p>
            </div>
            <div className='p-4 sm:p-5 space-y-3'>
              <div>
                <label className='block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5'>
                  Courier
                </label>
                <input
                  value={trackingForm.shippingCarrier}
                  onChange={(e) => {
                    setTrackingErrors((p) => ({
                      ...p,
                      shippingCarrier: undefined,
                    }));
                    setTrackingForm((p) => ({
                      ...p,
                      shippingCarrier: e.target.value,
                    }));
                  }}
                  placeholder='e.g. Delhivery, BlueDart, FedEx'
                  className={cn(
                    "w-full h-11 px-3.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300",
                    trackingErrors.shippingCarrier ?
                      "border-red-300 bg-red-50/40"
                    : "border-gray-200",
                  )}
                />
                {trackingErrors.shippingCarrier && (
                  <p className='text-xs text-red-600 mt-1'>
                    {trackingErrors.shippingCarrier}
                  </p>
                )}
              </div>
              <div>
                <label className='block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5'>
                  Tracking / AWB number
                </label>
                <input
                  value={trackingForm.trackingNumber}
                  onChange={(e) => {
                    setTrackingErrors((p) => ({
                      ...p,
                      trackingNumber: undefined,
                    }));
                    setTrackingForm((p) => ({
                      ...p,
                      trackingNumber: e.target.value,
                    }));
                  }}
                  placeholder='e.g. 1234567890'
                  className={cn(
                    "w-full h-11 px-3.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300",
                    trackingErrors.trackingNumber ?
                      "border-red-300 bg-red-50/40"
                    : "border-gray-200",
                  )}
                />
                {trackingErrors.trackingNumber && (
                  <p className='text-xs text-red-600 mt-1'>
                    {trackingErrors.trackingNumber}
                  </p>
                )}
              </div>
              <div>
                <label className='block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5'>
                  Tracking URL (optional)
                </label>
                <input
                  value={trackingForm.trackingUrl}
                  onChange={(e) => {
                    setTrackingErrors((p) => ({
                      ...p,
                      trackingUrl: undefined,
                    }));
                    setTrackingForm((p) => ({
                      ...p,
                      trackingUrl: e.target.value,
                    }));
                  }}
                  placeholder='https://...'
                  className={cn(
                    "w-full h-11 px-3.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300",
                    trackingErrors.trackingUrl ?
                      "border-red-300 bg-red-50/40"
                    : "border-gray-200",
                  )}
                />
                {trackingErrors.trackingUrl && (
                  <p className='text-xs text-red-600 mt-1'>
                    {trackingErrors.trackingUrl}
                  </p>
                )}
              </div>
              <div>
                <label className='block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5'>
                  Note (optional)
                </label>
                <input
                  value={trackingForm.note}
                  onChange={(e) =>
                    setTrackingForm((p) => ({ ...p, note: e.target.value }))
                  }
                  placeholder='e.g. Dispatched from warehouse'
                  className='w-full h-11 px-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300'
                />
              </div>
            </div>
            <div className='p-4 sm:p-5 border-t border-gray-100 bg-gray-50 flex gap-3'>
              <Button
                variant='outline'
                className='flex-1 rounded-xl'
                onClick={() => setTrackingOpenFor(null)}
              >
                Cancel
              </Button>
              <Button
                variant='brand'
                className='flex-1 rounded-xl'
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
    </div>
  );
}
