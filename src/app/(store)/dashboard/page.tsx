'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, ArrowRight, Pencil } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useWishlistStore } from '@/store/useWishlistStore';
import { orderApi } from '@/lib/api';
import { Order } from '@/types';
import { formatPrice, formatDate, cn } from '@/lib/utils';
import {
  getOrderStatusLabel,
  getOrderStatusBadgeClass,
  getPrimaryProductName,
} from '@/lib/accountOrderStyles';
function memberSinceLabel(createdAt?: string): string {
  if (!createdAt) return 'Valued Patron';
  const date = new Date(createdAt);
  const month = date.toLocaleDateString('en-IN', { month: 'long' });
  const year = date.getFullYear();
  return `Member since ${month} ${year}`;
}

function defaultAddress(user: ReturnType<typeof useAuthStore.getState>['user']): string {
  const addr = user?.addresses?.[0];
  if (!addr) return 'No address saved yet';
  const parts = [addr.street, addr.city, addr.state].filter(Boolean);
  return parts.join(', ') || addr.label;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { products: wishlistProducts } = useWishlistStore();
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({ total: 0, delivered: 0, inProgress: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recentRes, allRes, deliveredRes, activeRes] = await Promise.all([
          orderApi.getMyOrders({ limit: 5 }),
          orderApi.getMyOrders({ limit: 1 }),
          orderApi.getMyOrders({ limit: 1, status: 'delivered' }),
          orderApi.getMyOrders({ limit: 1, status: 'pending,confirmed,processing,shipped' }),
        ]);
        setRecentOrders(recentRes.data.orders);
        setStats({
          total: allRes.pagination?.total ?? recentRes.data.orders.length,
          delivered: deliveredRes.pagination?.total ?? 0,
          inProgress: activeRes.pagination?.total ?? 0,
        });
      } catch {
        // silent fail
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { label: 'Total Orders', value: stats.total, href: '/dashboard/orders' },
    { label: 'Delivered', value: stats.delivered, href: '/dashboard/orders?filter=delivered' },
    { label: 'In Progress', value: stats.inProgress, href: '/dashboard/orders?filter=active' },
    { label: 'Wishlist', value: wishlistProducts.length, href: '/wishlist' },
  ];

  return (
    <div className="flex flex-col gap-account-stack-lg">
      {/* Hero greeting */}
      <section className="account-hero-gradient p-account-gutter relative overflow-hidden flex flex-col md:flex-row items-center gap-account-gutter border border-account-outline-variant/20">
        <div className="relative group shrink-0">
          <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-2 border-account-secondary overflow-hidden bg-account-surface-container">
            {user?.avatar ? (
              <Image
                src={user.avatar}
                alt={user.name}
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-account-primary-container text-account-on-primary-container text-3xl font-serif">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <Link
            href="/dashboard/profile"
            className="absolute bottom-0 right-0 bg-account-primary text-white p-2 rounded-full shadow-lg hover:scale-105 transition-transform"
            aria-label="Edit profile"
          >
            <Pencil className="h-4 w-4" />
          </Link>
        </div>
        <div className="text-center md:text-left">
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-account-primary mb-2">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-lg text-account-on-surface-variant italic">
            {memberSinceLabel(user?.createdAt)} | Platinum Patron
          </p>
        </div>
      </section>

      {/* Statistics */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-account-gutter">
        {statCards.map(({ label, value, href }) => (
          <Link
            key={label}
            href={href}
            className="bg-account-surface-container-lowest p-account-stack-md border border-account-outline-variant/30 hover:border-account-secondary transition-colors group"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-account-on-surface-variant mb-2">
              {label}
            </p>
            <h3 className="font-serif text-3xl md:text-4xl text-account-primary group-hover:text-account-secondary transition-colors">
              {isLoading && label !== 'Wishlist' ? '—' : value}
            </h3>
          </Link>
        ))}
      </section>

      {/* Recent orders + profile details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-account-gutter">
        {/* Recent Orders */}
        <section className="lg:col-span-8 flex flex-col gap-account-gutter">
          <div className="flex justify-between items-end account-border-elegant pb-4">
            <h2 className="font-serif text-xl text-account-primary uppercase tracking-widest">
              Recent Orders
            </h2>
            <Link
              href="/dashboard/orders"
              className="text-[11px] font-semibold text-account-secondary hover:underline underline-offset-4 uppercase tracking-widest"
            >
              View All Orders
            </Link>
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-40 bg-account-surface-container animate-pulse border border-account-outline-variant/20" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="bg-account-surface-container-lowest border border-account-outline-variant/30 p-10 text-center">
              <ShoppingBag className="h-10 w-10 text-account-outline-variant mx-auto mb-3" />
              <p className="text-account-on-surface-variant font-medium">No orders yet</p>
              <Link href="/shop" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-account-secondary hover:underline">
                Start Shopping <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {recentOrders.map((order) => {
                const primaryItem = order.items[0];
                const isDelivered = order.status === 'delivered';
                const isTrackable = ['pending', 'confirmed', 'processing', 'shipped'].includes(order.status);
                const orderHref = `/dashboard/orders/${encodeURIComponent(order._id)}`;

                return (
                  <div
                    key={order._id}
                    className="bg-account-surface-container-lowest border border-account-outline-variant/30 p-4 flex flex-col md:flex-row gap-6 hover:shadow-sm transition-shadow"
                  >
                    <div className="w-full md:w-32 h-40 shrink-0 bg-account-surface-container overflow-hidden relative">
                      {primaryItem?.image && (
                        <Image src={primaryItem.image} alt={primaryItem.name} fill sizes="128px" className="object-cover" />
                      )}
                    </div>
                    <div className="flex-grow flex flex-col justify-between py-1 min-w-0">
                      <div className="flex justify-between items-start gap-4">
                        <div className="min-w-0">
                          <h4 className="font-serif text-lg text-account-primary mb-1 truncate">
                            {getPrimaryProductName(order.items)}
                          </h4>
                          <p className="text-[11px] font-semibold text-account-on-surface-variant uppercase tracking-widest">
                            ID: {order.orderNumber}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={cn(
                            'inline-block px-3 py-1 text-[11px] font-semibold uppercase tracking-widest',
                            getOrderStatusBadgeClass(order.status),
                          )}>
                            {getOrderStatusLabel(order.status)}
                          </span>
                          <p className="text-sm text-account-on-surface-variant mt-2">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-between items-end mt-4 gap-4 flex-wrap">
                        <p className="font-serif text-xl text-account-primary">
                          {formatPrice(order.total)}
                        </p>
                        <div className="flex items-center gap-2">
                          {isDelivered && (
                            <Link
                              href={`${orderHref}#review`}
                              className="text-[11px] font-semibold border border-account-secondary px-4 py-2 text-account-secondary hover:bg-account-secondary-container/20 uppercase tracking-widest transition-colors"
                            >
                              Write Review
                            </Link>
                          )}
                          <Link
                            href={orderHref}
                            className="text-[11px] font-semibold border border-account-primary px-6 py-2 text-account-primary hover:bg-account-primary hover:text-white uppercase tracking-widest transition-colors"
                          >
                            {isTrackable ? 'Track Order' : 'Order Details'}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Profile details */}
        <section className="lg:col-span-4 flex flex-col gap-account-gutter">
          <div className="account-border-elegant pb-4">
            <h2 className="font-serif text-xl text-account-primary uppercase tracking-widest">
              My Details
            </h2>
          </div>
          <div className="bg-account-surface-container p-account-gutter flex flex-col gap-account-stack-md">
            {[
              { label: 'Full Name', value: user?.name },
              { label: 'Email Address', value: user?.email },
              { label: 'Phone Number', value: user?.phone || 'Not added' },
              { label: 'Address', value: defaultAddress(user) },
            ].map(({ label, value }) => (
              <div key={label} className="space-y-1">
                <label className="text-[11px] font-semibold text-account-on-surface-variant uppercase tracking-[0.2em]">
                  {label}
                </label>
                <p className="text-base text-account-primary border-b border-account-outline-variant/30 pb-2 break-words">
                  {value}
                </p>
              </div>
            ))}
            <Link
              href="/dashboard/profile"
              className="w-full mt-2 bg-account-primary text-white text-[11px] font-semibold uppercase tracking-[0.3em] py-4 text-center hover:opacity-90 transition-opacity"
            >
              Edit Profile
            </Link>
          </div>

          {/* Journal promo */}
          <div className="relative h-64 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-account-primary-container via-account-primary to-navy-900" />
            <div className="absolute inset-0 bg-account-primary/40 flex flex-col justify-center items-center text-center p-6 text-white">
              <h3 className="font-serif text-xl mb-2">The Journal</h3>
              <p className="text-sm mb-4 italic opacity-90">
                Discover the stories behind our latest Atelier collection.
              </p>
              <Link
                href="/blog"
                className="text-[11px] font-semibold border-b border-white pb-1 uppercase tracking-widest hover:opacity-80"
              >
                Read More
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
