"use client";

import Link from "next/link";
import {
  ShoppingCart,
  Heart,
  LogOut,
  ArrowRight,
  Clock,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import type { DashboardAnalytics } from "@/types";
import AnalyticsSectionHeader from "./AnalyticsSectionHeader";
import { adminProductStoreHref } from "@/lib/adminProductStoreLink";

type Activity = NonNullable<
  DashboardAnalytics["commerceInsights"]
>["commerceActivity"];

const SOURCE_LABEL: Record<string, string> = {
  pdp: "Product page",
  wishlist: "Wishlist",
  card: "Shop card",
  cart: "Cart",
  gifting: "Gifting",
  search: "Search",
  checkout: "Checkout",
  premium: "Premium PDP",
  api: "App / API",
  unknown: "Unknown",
};

const EVENT_LABEL: Record<string, string> = {
  add_to_cart: "Add to cart",
  remove_from_cart: "Removed from cart",
  cart_view: "Cart opened",
  wishlist_add: "Wishlist add",
  wishlist_remove: "Wishlist remove",
  checkout_page_open: "Checkout page",
  checkout_start: "Checkout started",
  cart_cleared: "Cart cleared",
  search: "Search",
  purchase: "Purchase",
  session_exit: "Left site",
};

function MetricTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: number;
  sub?: string;
}) {
  return (
    <div className='rounded-lg border border-gray-100 bg-gray-50/80 p-3'>
      <p className='text-[10px] font-bold uppercase tracking-wide text-gray-500'>
        {label}
      </p>
      <p className='text-xl font-bold tabular-nums text-navy-900 mt-1'>
        {value.toLocaleString()}
      </p>
      {sub ?
        <p className='text-[9px] text-gray-400 mt-0.5'>{sub}</p>
      : null}
    </div>
  );
}

export default function CommerceActivitySection({
  activity,
}: {
  activity?: Activity;
}) {
  if (!activity) {
    return (
      <div className='rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center'>
        <ShoppingCart className='h-8 w-8 text-gray-300 mx-auto mb-2' />
        <p className='text-sm font-medium text-gray-700'>
          Shop activity tracking is rolling out
        </p>
        <p className='text-xs text-gray-500 mt-1 max-w-md mx-auto'>
          Cart, wishlist, and checkout steps will populate here as customers use
          the storefront (last 30 days · IST).
        </p>
      </div>
    );
  }

  const { counts, engagementFunnel, addsByHour, periodDays } = activity;
  const peakHour = addsByHour.reduce(
    (best, h) => (h.adds > best.adds ? h : best),
    addsByHour[0] ?? { hour: 0, adds: 0 },
  );
  const maxHourAdds = Math.max(...addsByHour.map((h) => h.adds), 1);

  return (
    <div className='space-y-4'>
      <AnalyticsSectionHeader
        title='Shop activity journey'
        description={`Cart, wishlist, checkout, and exit signals · last ${periodDays} days. Meta Pixel events still go to Events Manager; this is your first-party admin log.`}
      />

      <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2'>
        <MetricTile label='Add to cart' value={counts.addToCart} />
        <MetricTile label='Wishlist adds' value={counts.wishlistAdd} />
        <MetricTile label='Cart views' value={counts.cartView} />
        <MetricTile
          label='Checkout page'
          value={counts.checkoutPageOpen ?? 0}
        />
        <MetricTile label='Checkout API' value={counts.checkoutStart} />
        <MetricTile label='Purchases' value={counts.purchases ?? 0} />
        <MetricTile label='Removals' value={counts.removeFromCart} />
        <MetricTile label='Cart cleared' value={counts.cartCleared ?? 0} />
        <MetricTile label='Searches' value={counts.searches ?? 0} />
        <MetricTile
          label='Session exits'
          value={counts.sessionExit}
          sub='Tab close / navigate away'
        />
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-3'>
        <div className='rounded-xl border border-gray-200 bg-white p-4 shadow-sm'>
          <div className='flex items-center gap-2 mb-3'>
            <ArrowRight className='h-4 w-4 text-brand-600' />
            <h3 className='text-sm font-semibold text-navy-900'>
              Cart → checkout
            </h3>
          </div>
          <p className='text-2xl font-bold tabular-nums text-navy-900'>
            {engagementFunnel.cartToCheckoutPercent}%
          </p>
          <p className='text-xs text-gray-500 mt-1'>
            {engagementFunnel.checkoutStart.toLocaleString()} checkout API
            starts ·{" "}
            {(engagementFunnel.checkoutPageOpen ?? 0).toLocaleString()} checkout
            page opens · {(engagementFunnel.purchases ?? 0).toLocaleString()}{" "}
            purchases after {engagementFunnel.addToCart.toLocaleString()}{" "}
            add-to-cart events
          </p>
        </div>

        <div className='rounded-xl border border-gray-200 bg-white p-4 shadow-sm'>
          <div className='flex items-center gap-2 mb-2'>
            <Clock className='h-4 w-4 text-navy-800' />
            <h3 className='text-sm font-semibold text-navy-900'>
              Best time to add to cart (IST)
            </h3>
          </div>
          {counts.addToCart === 0 ?
            <p className='text-xs text-gray-500 py-4 text-center'>
              Hourly pattern appears after add-to-cart events.
            </p>
          : <>
              <p className='text-[10px] text-gray-500 mb-2'>
                Peak:{" "}
                <span className='font-bold text-gray-800'>
                  {peakHour.hour}:00 · {peakHour.adds} adds
                </span>
              </p>
              <div
                className='grid gap-0.5 items-end h-14'
                style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}
              >
                {addsByHour.map((h) => (
                  <div
                    key={h.hour}
                    className={`rounded-t-sm w-full ${
                      h.hour === peakHour.hour && h.adds > 0 ?
                        "bg-navy-800"
                      : h.adds > 0 ?
                        "bg-brand-400"
                      : "bg-gray-100"
                    }`}
                    style={{
                      height:
                        h.adds > 0 ?
                          `${Math.max(12, Math.round((h.adds / maxHourAdds) * 100))}%`
                        : "4px",
                    }}
                    title={`${h.hour}:00 · ${h.adds}`}
                  />
                ))}
              </div>
            </>
          }
        </div>
      </div>

      <div className='grid grid-cols-1 xl:grid-cols-2 gap-3'>
        <div className='rounded-xl border border-gray-200 bg-white p-3 shadow-sm'>
          <div className='flex items-center gap-2 mb-2'>
            <ShoppingCart className='h-4 w-4 text-emerald-600' />
            <h3 className='text-sm font-bold text-gray-900'>
              Top add-to-cart products
            </h3>
          </div>
          {!activity.topCartProducts.length ?
            <p className='text-xs text-gray-500 py-4 text-center'>No data yet</p>
          : <ul className='space-y-2'>
              {activity.topCartProducts.map((p) => (
                <li
                  key={p.productId}
                  className='flex justify-between gap-2 text-[11px]'
                >
                  <Link
                    href={adminProductStoreHref({ slug: p.slug })}
                    className='text-brand-700 hover:underline truncate'
                  >
                    {p.name}
                  </Link>
                  <span className='font-bold tabular-nums shrink-0'>
                    {p.adds} · {p.units} units
                  </span>
                </li>
              ))}
            </ul>
          }
        </div>

        <div className='rounded-xl border border-gray-200 bg-white p-3 shadow-sm'>
          <div className='flex items-center gap-2 mb-2'>
            <Heart className='h-4 w-4 text-rose-500' />
            <h3 className='text-sm font-bold text-gray-900'>
              Top wishlist adds
            </h3>
          </div>
          {!activity.topWishlistProducts.length ?
            <p className='text-xs text-gray-500 py-4 text-center'>No data yet</p>
          : <ul className='space-y-2'>
              {activity.topWishlistProducts.map((p) => (
                <li
                  key={p.productId}
                  className='flex justify-between gap-2 text-[11px]'
                >
                  <Link
                    href={adminProductStoreHref({ slug: p.slug })}
                    className='text-brand-700 hover:underline truncate'
                  >
                    {p.name}
                  </Link>
                  <span className='font-bold tabular-nums shrink-0'>
                    {p.adds}
                  </span>
                </li>
              ))}
            </ul>
          }
        </div>
      </div>

      <div className='grid grid-cols-1 xl:grid-cols-2 gap-3'>
        <div className='rounded-xl border border-gray-200 bg-white p-3 shadow-sm'>
          <div className='flex items-center gap-2 mb-2'>
            <LogOut className='h-4 w-4 text-amber-600' />
            <h3 className='text-sm font-bold text-gray-900'>
              Last page before drop-off
            </h3>
          </div>
          <p className='text-[10px] text-gray-500 mb-2'>
            Sessions with add-to-cart but no checkout start (approx. exit page).
          </p>
          {!activity.cartDropoffPages.length ?
            <p className='text-xs text-gray-500 py-4 text-center'>
              Builds when carts abandon without checkout.
            </p>
          : <ul className='space-y-1.5'>
              {activity.cartDropoffPages.map((row) => (
                <li
                  key={row.path}
                  className='flex justify-between text-[11px] gap-2'
                >
                  <span className='text-gray-700 truncate'>{row.path}</span>
                  <span className='font-bold tabular-nums shrink-0'>
                    {row.sessions}
                  </span>
                </li>
              ))}
            </ul>
          }
        </div>

        <div className='rounded-xl border border-gray-200 bg-white p-3 shadow-sm'>
          <h3 className='text-sm font-bold text-gray-900 mb-2'>
            Add-to-cart by source
          </h3>
          {!activity.addsBySource.length ?
            <p className='text-xs text-gray-500 py-4 text-center'>No data yet</p>
          : <ul className='space-y-1.5'>
              {activity.addsBySource.map((row) => (
                <li
                  key={row.source}
                  className='flex justify-between text-[11px]'
                >
                  <span className='text-gray-700'>
                    {SOURCE_LABEL[row.source] ?? row.source}
                  </span>
                  <span className='font-bold tabular-nums'>{row.adds}</span>
                </li>
              ))}
            </ul>
          }
        </div>
      </div>

      <div className='rounded-xl border border-gray-200 bg-white p-3 shadow-sm'>
        <h3 className='text-sm font-bold text-gray-900 mb-2'>Live activity</h3>
        {!activity.recentEvents.length ?
          <p className='text-xs text-gray-500 py-4 text-center'>
            Recent events appear here.
          </p>
        : <div className='overflow-x-auto'>
            <table className='w-full text-[10px]'>
              <thead>
                <tr className='text-left text-gray-400 border-b border-gray-100'>
                  <th className='py-1.5 pr-2'>When</th>
                  <th className='py-1.5 pr-2'>Event</th>
                  <th className='py-1.5 pr-2'>Product / page</th>
                  <th className='py-1.5 pr-2'>Source</th>
                  <th className='py-1.5'>User</th>
                </tr>
              </thead>
              <tbody>
                {activity.recentEvents.slice(0, 20).map((ev, i) => (
                  <tr key={`${ev.at}-${i}`} className='border-b border-gray-50'>
                    <td className='py-1.5 pr-2 tabular-nums text-gray-500 whitespace-nowrap'>
                      {formatDateTime(
                        ev.at instanceof Date ?
                          ev.at.toISOString()
                        : String(ev.at),
                      )}
                    </td>
                    <td className='py-1.5 pr-2 font-medium text-gray-800'>
                      {EVENT_LABEL[ev.type] ?? ev.type}
                    </td>
                    <td className='py-1.5 pr-2 text-gray-600 truncate max-w-[140px]'>
                      {ev.productName || ev.path || "—"}
                    </td>
                    <td className='py-1.5 pr-2 text-gray-500'>
                      {SOURCE_LABEL[ev.source] ?? ev.source}
                    </td>
                    <td className='py-1.5 text-gray-500'>{ev.userLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  );
}
