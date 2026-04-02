'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Package, Heart, MapPin, ShoppingBag, ArrowRight,
  Clock, CheckCircle2, Truck, AlertCircle, User, Lock, Gift, ChevronRight
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useWishlistStore } from '@/store/useWishlistStore';
import { orderApi } from '@/lib/api';
import { Order } from '@/types';
import { formatPrice, formatDate, getOrderStatusColor } from '@/lib/utils';
import { cn } from '@/lib/utils';

const STATUS_ICON: Record<string, React.ReactNode> = {
  pending:    <Clock className="h-3.5 w-3.5" />,
  confirmed:  <CheckCircle2 className="h-3.5 w-3.5" />,
  processing: <Package className="h-3.5 w-3.5" />,
  shipped:    <Truck className="h-3.5 w-3.5" />,
  delivered:  <CheckCircle2 className="h-3.5 w-3.5" />,
  cancelled:  <AlertCircle className="h-3.5 w-3.5" />,
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { products: wishlistProducts } = useWishlistStore();
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [allOrdersCount, setAllOrdersCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await orderApi.getMyOrders({ limit: 5 });
        setRecentOrders(res.data.orders);
        setAllOrdersCount(res.pagination?.total || res.data.orders.length);
      } catch {
        // silent fail
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const deliveredCount = recentOrders.filter((o) => o.status === 'delivered').length;
  const pendingCount = recentOrders.filter((o) => ['pending', 'confirmed', 'processing', 'shipped'].includes(o.status)).length;

  return (
    <div className="space-y-6 sm:space-y-5">
      {/* Mobile Navigation Menu - ONLY visible on mobile root dashboard */}
      <div className="sm:hidden bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="px-5 pt-5 pb-3 bg-gray-50/50 border-b border-gray-100">
          <h2 className="text-sm font-black text-navy-900 tracking-tight uppercase">Your Account</h2>
          <p className="text-[11px] text-gray-500 font-medium mt-0.5">Manage orders, wishlist & settings</p>
        </div>
        <div className="divide-y divide-gray-50">
          {[
            { label: 'My Orders', href: '/dashboard/orders', icon: Package, color: 'text-brand-600', bg: 'bg-brand-50' },
            { label: 'Bespoke Gifting', href: '/dashboard/gifting', icon: Gift, color: 'text-emerald-500', bg: 'bg-emerald-50' },
            { label: 'Wishlist', href: '/dashboard/wishlist', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50' },
            { label: 'Saved Addresses', href: '/dashboard/addresses', icon: MapPin, color: 'text-navy-600', bg: 'bg-navy-50' },
            { label: 'Profile Settings', href: '/dashboard/profile', icon: User, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Security', href: '/dashboard/security', icon: Lock, color: 'text-slate-600', bg: 'bg-slate-50' },
          ].map(({ label, href, icon: Icon, color, bg }) => (
            <Link key={href} href={href} className="flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors group">
              <div className="flex items-center gap-3.5">
                <div className={cn("h-11 w-11 rounded-2xl flex items-center justify-center transition-transform group-active:scale-95 shadow-sm", bg, color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-bold text-gray-900">{label}</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-brand-400 group-active:translate-x-1 transition-all" />
            </Link>
          ))}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Package, label: 'Total Orders', value: isLoading ? '—' : String(allOrdersCount), href: '/dashboard/orders', color: 'text-navy-600', bg: 'bg-navy-50' },
          { icon: CheckCircle2, label: 'Delivered', value: isLoading ? '—' : String(deliveredCount), href: '/dashboard/orders', color: 'text-green-600', bg: 'bg-green-50' },
          { icon: Clock, label: 'In Progress', value: isLoading ? '—' : String(pendingCount), href: '/dashboard/orders', color: 'text-amber-600', bg: 'bg-amber-50' },
          { icon: Heart, label: 'Wishlist', value: String(wishlistProducts.length), href: '/dashboard/wishlist', color: 'text-brand-600', bg: 'bg-brand-50' },
        ].map(({ icon: Icon, label, value, href, color, bg }) => (
          <Link
            key={label}
            href={href}
            className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group"
          >
            <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center mb-3', bg)}>
              <Icon className={cn('h-5 w-5', color)} />
            </div>
            <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Package className="h-4 w-4 text-brand-600" />
            Recent Orders
          </h3>
          <Link href="/dashboard/orders" className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1 font-medium transition-colors">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="divide-y divide-gray-50">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="px-5 py-4 flex gap-4 animate-pulse">
                <div className="flex gap-1.5">
                  {[...Array(2)].map((_, j) => <div key={j} className="h-14 w-11 rounded-xl bg-gray-100" />)}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="p-10 text-center">
            <div className="h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <ShoppingBag className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-gray-600 font-medium">No orders yet</p>
            <p className="text-sm text-gray-400 mt-1">Your orders will show up here</p>
            <Link href="/shop" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors">
              Start Shopping <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentOrders.map((order) => (
              <Link
                key={order._id}
                href={`/dashboard/orders/${encodeURIComponent(order._id)}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/80 transition-colors group"
              >
                {/* Product thumbnails */}
                <div className="flex gap-1.5 flex-shrink-0">
                  {order.items.slice(0, 2).map((item, i) => (
                    <div key={i} className="relative h-14 w-11 rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
                      <Image src={item.image} alt={item.name} fill sizes="44px" className="object-cover" />
                    </div>
                  ))}
                  {order.items.length > 2 && (
                    <div className="h-14 w-11 rounded-xl bg-gray-100 border border-gray-100 flex items-center justify-center">
                      <span className="text-[11px] font-semibold text-gray-500">+{order.items.length - 2}</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900">{order.orderNumber}</p>
                    <span className={cn('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full capitalize', getOrderStatusColor(order.status))}>
                      {STATUS_ICON[order.status]}
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {order.items.slice(0, 2).map((i) => i.name).join(' · ')}
                    {order.items.length > 2 && ` +${order.items.length - 2} more`}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.createdAt)}</p>
                </div>

                {/* Price */}
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900">{formatPrice(order.total)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{order.items.length} item{order.items.length > 1 ? 's' : ''}</p>
                </div>

                <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-brand-500 transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/shop"
          className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl p-5 text-white hover:from-brand-700 hover:to-brand-800 transition-all group shadow-sm"
        >
          <ShoppingBag className="h-6 w-6 mb-3 opacity-80" />
          <p className="font-semibold text-sm">Continue Shopping</p>
          <p className="text-xs text-brand-200 mt-0.5">Discover new arrivals</p>
        </Link>
        <Link
          href="/dashboard/addresses"
          className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group"
        >
          <MapPin className="h-6 w-6 mb-3 text-navy-600" />
          <p className="font-semibold text-sm text-gray-900">Manage Addresses</p>
          <p className="text-xs text-gray-400 mt-0.5">{user?.addresses?.length || 0} saved address{(user?.addresses?.length || 0) !== 1 ? 'es' : ''}</p>
        </Link>
      </div>
    </div>
  );
}
