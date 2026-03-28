'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Package, ChevronRight, Clock, CheckCircle2, Truck, AlertCircle, Star, ShoppingBag, ArrowRight, Filter } from 'lucide-react';
import { orderApi } from '@/lib/api';
import { Order, OrderStatus } from '@/types';
import { formatPrice, formatDate, getOrderStatusColor, cn } from '@/lib/utils';
import { OrderCardSkeleton } from '@/components/ui/SkeletonLoader';

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

const STATUS_META: Record<string, { icon: React.ReactNode; label: string }> = {
  pending:    { icon: <Clock className="h-3.5 w-3.5" />, label: 'Pending' },
  confirmed:  { icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: 'Confirmed' },
  processing: { icon: <Package className="h-3.5 w-3.5" />, label: 'Processing' },
  shipped:    { icon: <Truck className="h-3.5 w-3.5" />, label: 'Shipped' },
  delivered:  { icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: 'Delivered' },
  cancelled:  { icon: <AlertCircle className="h-3.5 w-3.5" />, label: 'Cancelled' },
  refunded:   { icon: <AlertCircle className="h-3.5 w-3.5" />, label: 'Refunded' },
};

const FILTER_TABS: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0 });
  const [activeFilter, setActiveFilter] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const fetchOrders = async (page = 1, filter = activeFilter, append = false) => {
    if (append) setIsLoadingMore(true);
    else setIsLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 10 };
      if (filter === 'delivered') params.status = 'delivered';
      else if (filter === 'cancelled') params.status = 'cancelled';
      else if (filter === 'active') params.status = 'shipped'; // approximation
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
      { rootMargin: '220px' }
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, pagination.currentPage, activeFilter]);

  const displayOrders = activeFilter === 'active'
    ? orders.filter((o) => ['pending', 'confirmed', 'processing', 'shipped'].includes(o.status))
    : orders;

  if (!isLoading && orders.length === 0 && activeFilter === '') {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
        <div className="h-20 w-20 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
          <Package className="h-10 w-10 text-gray-300" />
        </div>
        <h3 className="font-serif font-bold text-gray-900 text-lg mb-1">No orders yet</h3>
        <p className="text-gray-500 text-sm mb-5">Your orders will appear here once you shop.</p>
        <Link href="/shop" className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm">
          <ShoppingBag className="h-4 w-4" /> Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
        <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />
        {FILTER_TABS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setActiveFilter(value)}
            className={cn(
              'flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all',
              activeFilter === value
                ? 'bg-navy-900 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            )}
          >
            {label}
          </button>
        ))}
        <span className="text-xs text-gray-400 ml-auto flex-shrink-0">{pagination.total} order{pagination.total !== 1 ? 's' : ''}</span>
      </div>

      {/* Order cards */}
      {isLoading ? (
        [...Array(3)].map((_, i) => <OrderCardSkeleton key={i} />)
      ) : displayOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <p className="text-gray-500 text-sm">No orders found for this filter.</p>
        </div>
      ) : (
        displayOrders.map((order) => {
          const isDelivered = order.status === 'delivered';
          const isCancelledOrRefunded = ['cancelled', 'refunded'].includes(order.status);
          const stepIndex = STATUS_STEPS.indexOf(order.status as OrderStatus);

          return (
            <div
              key={order._id}
              onClick={() => router.push(`/dashboard/orders/${order._id}`)}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:border-brand-200 hover:shadow-md transition-all cursor-pointer group"
            >
              {/* Card header */}
              <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-gray-50 bg-gray-50/60">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-gray-900 text-sm">{order.orderNumber}</span>
                  <span className="text-xs text-gray-400 hidden sm:block">{formatDate(order.createdAt)}</span>
                </div>
                <span className={cn('inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full capitalize', getOrderStatusColor(order.status))}>
                  {STATUS_META[order.status]?.icon}
                  {order.status}
                </span>
              </div>

              {/* Progress bar — only for active statuses */}
              {!isCancelledOrRefunded && (
                <div className="px-4 sm:px-5 pt-4 pb-3">
                  <div className="flex items-center justify-between gap-1 relative">
                    {STATUS_STEPS.map((step, i) => (
                      <div key={step} className="flex-1 flex flex-col items-center gap-1 relative">
                        {i < STATUS_STEPS.length - 1 && (
                          <div className="absolute left-1/2 right-0 top-2.5 h-0.5 -translate-y-1/2 z-0" style={{ width: 'calc(100% - 10px)', left: 'calc(50% + 5px)' }}>
                            <div className={cn('h-full w-full transition-all', i < stepIndex ? 'bg-brand-500' : 'bg-gray-200')} />
                          </div>
                        )}
                        <div className={cn(
                          'relative z-10 h-5 w-5 rounded-full flex items-center justify-center ring-2 ring-white transition-all',
                          i < stepIndex ? 'bg-brand-600' : i === stepIndex ? 'bg-brand-600' : 'bg-gray-200'
                        )}>
                          {i <= stepIndex ? (
                            <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                          )}
                        </div>
                        <span className={cn('text-[9px] font-medium capitalize hidden sm:block', i <= stepIndex ? 'text-brand-600' : 'text-gray-400')}>
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Items preview */}
              <div className="px-4 sm:px-5 pb-4">
                <div className="flex gap-2 mb-3">
                  {order.items.slice(0, 4).map((item, i) => (
                    <div key={i} className="relative h-16 w-12 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                      <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover" />
                    </div>
                  ))}
                  {order.items.length > 4 && (
                    <div className="h-16 w-12 rounded-xl bg-gray-100 border border-gray-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-[11px] font-semibold text-gray-500">+{order.items.length - 4}</span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-500 mb-3 truncate">
                  {order.items.slice(0, 2).map((i) => i.name).join(' · ')}
                  {order.items.length > 2 && ` + ${order.items.length - 2} more`}
                </p>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900">{formatPrice(order.total)}</p>
                    <p className="text-xs text-gray-400">{order.items.length} item{order.items.length > 1 ? 's' : ''} · {formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isDelivered && (
                      <Link
                        href={`/dashboard/orders/${order._id}#review`}
                        className="flex items-center gap-1.5 text-xs font-semibold text-gold-600 bg-gold-50 hover:bg-gold-100 px-3 py-1.5 rounded-xl transition-all border border-gold-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Star className="h-3.5 w-3.5 fill-gold-500 text-gold-500" />
                        Rate &amp; Review
                      </Link>
                    )}
                    <div className="h-8 w-8 rounded-xl bg-gray-100 group-hover:bg-brand-600 flex items-center justify-center transition-all flex-shrink-0">
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}

      <div ref={loadMoreRef} className="h-8" />
      {isLoadingMore && (
        <div className="flex items-center justify-center py-2">
          <span className="h-5 w-5 rounded-full border-2 border-gray-300 border-t-brand-600 animate-spin" />
        </div>
      )}

      {/* CTA if no more */}
      {!isLoading && !hasMore && orders.length > 0 && (
        <div className="text-center pt-2 pb-4">
          <p className="text-sm text-gray-400 mb-3">Looking for more styles?</p>
          <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors">
            Explore the collection <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
