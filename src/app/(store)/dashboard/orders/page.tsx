'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Package, ShoppingBag, ArrowRight, Filter } from 'lucide-react';
import { orderApi } from '@/lib/api';
import { Order } from '@/types';
import { cn } from '@/lib/utils';
import { OrderCardSkeleton } from '@/components/ui/SkeletonLoader';
import OrderHistoryCard from '@/components/dashboard/OrderHistoryCard';
import toast from 'react-hot-toast';

const FILTER_TABS: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get('filter') ?? '';
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0 });
  const [activeFilter, setActiveFilter] = useState(initialFilter);
  const [hasMore, setHasMore] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const fetchOrders = async (page = 1, filter = activeFilter, append = false) => {
    if (append) setIsLoadingMore(true);
    else setIsLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 10 };
      if (filter === 'delivered') params.status = 'delivered';
      else if (filter === 'cancelled') params.status = 'cancelled';
      else if (filter === 'active') params.status = 'pending,confirmed,processing,shipped';

      const res = await orderApi.getMyOrders(params);
      const incoming = res.data.orders as Order[];
      const nextPagination =
        res.pagination || { currentPage: page, totalPages: 1, total: incoming.length };
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
    const filter = searchParams.get('filter') ?? '';
    setActiveFilter(filter);
  }, [searchParams]);

  useEffect(() => {
    setOrders([]);
    setHasMore(true);
    fetchOrders(1, activeFilter, false);
  }, [activeFilter]);

  useEffect(() => {
    if (!hasMore || isLoading || isLoadingMore || !loadMoreRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !isLoadingMore) {
          fetchOrders(pagination.currentPage + 1, activeFilter, true);
        }
      },
      { rootMargin: '220px' },
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, pagination.currentPage, activeFilter]);

  const handleFilterChange = (value: string) => {
    setActiveFilter(value);
    const url = value ? `/dashboard/orders?filter=${value}` : '/dashboard/orders';
    router.replace(url, { scroll: false });
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancellingId(orderId);
    try {
      await orderApi.cancel(orderId, 'Cancelled by customer');
      toast.success('Order cancelled successfully');
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: 'cancelled' } : o)),
      );
    } catch {
      toast.error('Could not cancel order. Please try from order details.');
    } finally {
      setCancellingId(null);
    }
  };

  if (!isLoading && orders.length === 0 && activeFilter === '') {
    return (
      <div>
        <header className="mb-account-stack-md">
          <h1 className="font-serif text-4xl md:text-5xl text-account-primary mb-4">Order History</h1>
          ...
        </header>
        <div className="bg-account-surface-container-lowest border border-account-outline-variant/20 shadow-account-paper p-12 text-center">
          <Package className="h-12 w-12 text-account-outline-variant mx-auto mb-4" />
          <h3 className="font-serif text-xl text-account-primary mb-1">No orders yet</h3>
          <p className="text-account-on-surface-variant text-sm mb-5">
            Your orders will appear here once you shop.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 bg-account-primary hover:bg-navy-800 text-white text-sm font-semibold px-5 py-2.5 transition-all"
          >
            <ShoppingBag className="h-4 w-4" /> Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-account-surface">
      <header className="mb-account-stack-lg">
        <h1 className="font-serif text-4xl md:text-5xl text-account-primary mb-4">Order History</h1>
        <div className="flex items-center gap-4 text-account-on-surface-variant text-sm">
          <span>Explore your past acquisitions and tracking details.</span>
          <div className="h-px flex-1 bg-account-outline-variant/30 hidden sm:block" />
        </div>
      </header>

      {/* Filter tabs */}
      <div className="flex items-center overflow-x-auto scrollbar-hide pb-6 gap-4">
        <div className="flex items-center gap-1.5 p-1.5 bg-account-surface-container border border-account-outline-variant/30 flex-shrink-0">
          <div className="px-2 flex items-center">
            <Filter className="h-4 w-4 text-account-secondary" />
          </div>
          <div className="h-6 w-px bg-account-outline-variant/40 mx-1" />
          {FILTER_TABS.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleFilterChange(value)}
              className={cn(
                'flex-shrink-0 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider transition-all',
                activeFilter === value ?
                  'bg-account-surface-container-lowest text-account-primary shadow-sm'
                : 'text-account-on-surface-variant hover:text-account-primary',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-account-on-surface-variant bg-account-surface-container-low px-3 py-2 border border-account-outline-variant/30 flex-shrink-0">
          {pagination.total} result{pagination.total !== 1 ? 's' : ''}
        </span>
      </div>

      <section className="flex flex-col gap-10">
        {isLoading ?
          [...Array(3)].map((_, i) => <OrderCardSkeleton key={i} />)
        : orders.length === 0 ?
          <div className="bg-account-surface-container-lowest border border-account-outline-variant/20 p-10 text-center">
            <p className="text-account-on-surface-variant text-sm">No orders found for this filter.</p>
          </div>
        : orders.map((order) => (
            <OrderHistoryCard
              key={order._id}
              order={order}
              onCancelClick={
                cancellingId === order._id ? undefined : handleCancelOrder
              }
            />
          ))
        }
      </section>

      <div ref={loadMoreRef} className="h-8" />
      {isLoadingMore && (
        <div className="flex items-center justify-center py-2">
          <span className="h-5 w-5 rounded-full border-2 border-account-outline-variant border-t-account-secondary animate-spin" />
        </div>
      )}

      {!isLoading && !hasMore && orders.length > 0 && (
        <div className="text-center pt-4 pb-2">
          <p className="text-sm text-account-on-surface-variant mb-3">Looking for more styles?</p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-sm font-semibold text-account-secondary hover:underline"
          >
            Explore the collection <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
