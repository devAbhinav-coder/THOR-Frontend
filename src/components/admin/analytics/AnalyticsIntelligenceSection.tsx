"use client";

import Link from "next/link";
import {
  Filter,
  MapPinned,
  FileText,
  Gift,
  UserRound,
  ArrowRight,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { DashboardAnalytics } from "@/types";
import AnalyticsSectionHeader from "./AnalyticsSectionHeader";

type Props = {
  analytics: DashboardAnalytics;
};

function FunnelStep({
  label,
  value,
  sub,
  widthPct,
}: {
  label: string;
  value: string;
  sub: string;
  widthPct: number;
}) {
  return (
    <div className='space-y-1'>
      <div className='flex justify-between text-[11px]'>
        <span className='font-semibold text-gray-700'>{label}</span>
        <span className='font-bold tabular-nums text-gray-900'>{value}</span>
      </div>
      <div className='h-2 bg-gray-100 rounded-full overflow-hidden'>
        <div
          className='h-full bg-gradient-to-r from-brand-500 to-navy-800 rounded-full transition-all'
          style={{ width: `${Math.max(4, Math.min(100, widthPct))}%` }}
        />
      </div>
      <p className='text-[9px] text-gray-400'>{sub}</p>
    </div>
  );
}

export default function AnalyticsIntelligenceSection({ analytics }: Props) {
  const funnel = analytics.commerceInsights?.trafficFunnel;
  const orderStates = analytics.commerceInsights?.ordersByIndiaState ?? [];
  const blog = analytics.contentInsights?.blog;
  const offer = analytics.offerAttributionMtd;
  const browsers = analytics.visitInsights?.topLoggedInBrowsers ?? [];
  const utmMedium = analytics.visitInsights?.byUtmMedium ?? [];

  const maxFunnel = Math.max(
    funnel?.sessions ?? 0,
    funnel?.productPageViewsLifetime ?? 0,
    funnel?.paidOrders ?? 0,
    1,
  );

  return (
    <div className='space-y-5'>
      <AnalyticsSectionHeader
        title='Commerce & engagement'
        description='Funnel, shipping geography, offers, blog, and signed-in browsing.'
      />
      {funnel && (
        <div className='rounded-xl border border-gray-200 bg-white p-4 shadow-sm'>
          <div className='flex items-center gap-2 mb-3'>
            <Filter className='h-4 w-4 text-navy-800' />
            <div>
              <h3 className='text-sm font-semibold text-navy-900 tracking-tight'>
                Conversion funnel
              </h3>
              <p className='text-xs text-gray-500 mt-0.5'>
                Sessions and paid orders: last {funnel.periodDays} days. Product
                page views and units sold: lifetime catalogue counters (mixed
                windows).
              </p>
            </div>
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
            <FunnelStep
              label='Unique sessions'
              value={funnel.sessions.toLocaleString()}
              sub='One per browser tab per IST day'
              widthPct={(funnel.sessions / maxFunnel) * 100}
            />
            <FunnelStep
              label='Product page views'
              value={funnel.productPageViewsLifetime.toLocaleString()}
              sub='Sum of product viewCount · all time'
              widthPct={(funnel.productPageViewsLifetime / maxFunnel) * 100}
            />
            <FunnelStep
              label='Paid orders'
              value={funnel.paidOrders.toLocaleString()}
              sub={`Session to paid ${funnel.sessionToPaidPercent}%`}
              widthPct={(funnel.paidOrders / maxFunnel) * 100}
            />
            <FunnelStep
              label='Catalog units sold'
              value={funnel.catalogUnitsSoldLifetime.toLocaleString()}
              sub={`PDP view to paid ${funnel.pdpViewsToPaidPercent}% (approx.)`}
              widthPct={
                (funnel.catalogUnitsSoldLifetime / maxFunnel) * 100
              }
            />
          </div>
        </div>
      )}

      <div className='grid grid-cols-1 xl:grid-cols-2 gap-3'>
        <div className='rounded-xl border border-gray-200 bg-white p-3 shadow-sm'>
          <div className='flex items-center gap-2 mb-2'>
            <MapPinned className='h-4 w-4 text-emerald-600' />
            <div>
              <h3 className='text-sm font-bold text-gray-900'>
                Paid orders by state (shipping)
              </h3>
              <p className='text-[10px] text-gray-500'>
                Shipping state on paid orders · last 30 days
              </p>
            </div>
          </div>
          {orderStates.length === 0 ?
            <p className='text-xs text-gray-500 py-4 text-center'>
              No paid orders in window yet.
            </p>
          : <ul className='space-y-1.5 max-h-[220px] overflow-y-auto'>
              {orderStates.map((row) => {
                const max = orderStates[0]?.revenue ?? 1;
                return (
                  <li key={row.state}>
                    <div className='flex justify-between text-[11px] mb-0.5 gap-2'>
                      <span className='text-gray-800 font-medium truncate'>
                        {row.state}
                      </span>
                      <span className='shrink-0 tabular-nums'>
                        <span className='font-bold'>{row.orders}</span>
                        <span className='text-gray-400 mx-1'>·</span>
                        <span className='text-emerald-700 font-semibold'>
                          {formatPrice(row.revenue)}
                        </span>
                      </span>
                    </div>
                    <div className='h-1 bg-gray-100 rounded-full overflow-hidden'>
                      <div
                        className='h-full bg-emerald-500 rounded-full'
                        style={{
                          width: `${(row.revenue / max) * 100}%`,
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          }
        </div>

        <div className='rounded-xl border border-gray-200 bg-white p-3 shadow-sm'>
          <div className='flex items-center gap-2 mb-2'>
            <Gift className='h-4 w-4 text-brand-600' />
            <div>
              <h3 className='text-sm font-bold text-gray-900'>
                Offers & visit popup (MTD)
              </h3>
              <p className='text-[10px] text-gray-500'>
                Coupons · auto promos · modal events from your store
              </p>
            </div>
          </div>
          {offer ?
            <div className='space-y-2'>
              <div className='grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]'>
                <div className='rounded-lg bg-gray-50 p-2 border border-gray-100'>
                  <p className='text-gray-500'>Popup opens</p>
                  <p className='text-lg font-bold tabular-nums'>
                    {offer.popup.impressions}
                  </p>
                </div>
                <div className='rounded-lg bg-gray-50 p-2 border border-gray-100'>
                  <p className='text-gray-500'>Popup CTA clicks</p>
                  <p className='text-lg font-bold tabular-nums'>
                    {offer.popup.ctaClicks}
                  </p>
                </div>
                <div className='rounded-lg bg-gray-50 p-2 border border-gray-100'>
                  <p className='text-gray-500'>Dismissals</p>
                  <p className='text-lg font-bold tabular-nums'>
                    {offer.popup.dismisses ?? 0}
                  </p>
                </div>
                <div className='rounded-lg bg-gray-50 p-2 border border-gray-100'>
                  <p className='text-gray-500'>Orders after popup</p>
                  <p className='text-lg font-bold tabular-nums'>
                    {offer.popup.ordersAfterPopup}
                  </p>
                  <p className='text-[9px] text-emerald-700 font-semibold'>
                    {formatPrice(offer.popup.revenueAfterPopup)}
                  </p>
                </div>
              </div>
              {(offer.promotions.top?.length ?? 0) > 0 && (
                <div>
                  <p className='text-[10px] font-bold uppercase text-gray-400 mb-1'>
                    Top auto promotions
                  </p>
                  <ul className='text-[11px] space-y-0.5'>
                    {offer.promotions.top!.slice(0, 4).map((p) => (
                      <li
                        key={p.id}
                        className='flex justify-between gap-2 text-gray-700'
                      >
                        <span className='truncate'>{p.name}</span>
                        <span className='shrink-0 tabular-nums font-medium'>
                          {p.ordersCount} · {formatPrice(p.discountTotal)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(offer.coupons.top?.length ?? 0) > 0 && (
                <div>
                  <p className='text-[10px] font-bold uppercase text-gray-400 mb-1'>
                    Top coupons
                  </p>
                  <ul className='text-[11px] space-y-0.5'>
                    {offer.coupons.top!.slice(0, 4).map((c) => (
                      <li
                        key={c.id}
                        className='flex justify-between gap-2 text-gray-700'
                      >
                        <span className='font-mono'>{c.code}</span>
                        <span className='shrink-0 tabular-nums font-medium'>
                          {c.ordersCount} · {formatPrice(c.discountTotal)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          : <p className='text-xs text-gray-500 py-4 text-center'>
              Offer data loads with dashboard analytics.
            </p>
          }
        </div>
      </div>

      <div className='grid grid-cols-1 xl:grid-cols-2 gap-3'>
        {blog && (
          <div className='rounded-xl border border-gray-200 bg-white p-3 shadow-sm'>
            <div className='flex items-center justify-between gap-2 mb-2'>
              <div className='flex items-center gap-2'>
                <FileText className='h-4 w-4 text-navy-700' />
                <div>
                  <h3 className='text-sm font-bold text-gray-900'>
                    Blog to shop
                  </h3>
                  <p className='text-[10px] text-gray-500'>
                    Views & shop clicks on stories · all time
                  </p>
                </div>
              </div>
              <Link
                href='/admin/blogs'
                className='text-[10px] font-bold text-brand-700 hover:underline shrink-0'
              >
                Manage blogs
              </Link>
            </div>
            <div className='grid grid-cols-3 gap-2 mb-2 text-[10px]'>
              <div className='rounded-lg bg-gray-50 p-2 border border-gray-100'>
                <p className='text-gray-500'>Published</p>
                <p className='text-base font-bold'>{blog.summary.published}</p>
              </div>
              <div className='rounded-lg bg-gray-50 p-2 border border-gray-100'>
                <p className='text-gray-500'>Total views</p>
                <p className='text-base font-bold tabular-nums'>
                  {blog.summary.totalViews.toLocaleString()}
                </p>
              </div>
              <div className='rounded-lg bg-gray-50 p-2 border border-gray-100'>
                <p className='text-gray-500'>Shop CTR</p>
                <p className='text-base font-bold tabular-nums'>
                  {blog.summary.clickThroughRate}%
                </p>
              </div>
            </div>
            {blog.topPosts.length > 0 && (
              <ul className='space-y-1 text-[11px] max-h-[140px] overflow-y-auto'>
                {blog.topPosts.map((post) => (
                  <li
                    key={post.slug}
                    className='flex justify-between gap-2 text-gray-700'
                  >
                    <span className='truncate'>{post.title}</span>
                    <span className='shrink-0 tabular-nums text-gray-500'>
                      {post.views} views · {post.shopClicks} shop
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className='rounded-xl border border-gray-200 bg-white p-3 shadow-sm'>
          <div className='flex items-center gap-2 mb-2'>
            <UserRound className='h-4 w-4 text-brand-600' />
            <div>
              <h3 className='text-sm font-bold text-gray-900'>
                Logged-in shoppers browsing
              </h3>
              <p className='text-[10px] text-gray-500'>
                Page opens while signed in · last 30 days
              </p>
            </div>
          </div>
          {browsers.length === 0 ?
            <p className='text-xs text-gray-500 py-4 text-center'>
              No logged-in page views yet this month window.
            </p>
          : <ul className='space-y-1.5'>
              {browsers.map((b) => (
                <li
                  key={b.userId}
                  className='flex items-center justify-between gap-2 text-[11px]'
                >
                  <div className='min-w-0'>
                    <p className='font-semibold text-gray-800 truncate'>
                      {b.name ?? "Account"}
                    </p>
                    <p className='text-[9px] text-gray-400 truncate'>
                      {b.email ?? b.userId}
                    </p>
                  </div>
                  <div className='flex items-center gap-2 shrink-0'>
                    <span className='font-bold tabular-nums'>
                      {b.pageViews} pages
                    </span>
                    <Link
                      href={`/admin/users?highlight=${b.userId}`}
                      className='text-brand-700 hover:text-brand-900'
                      title='Open in Users'
                    >
                      <ArrowRight className='h-3.5 w-3.5' />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          }
          {utmMedium.length > 0 && (
            <div className='mt-3 pt-2 border-t border-gray-100'>
              <p className='text-[10px] font-bold uppercase text-gray-400 mb-1'>
                UTM medium (sessions)
              </p>
              <div className='flex flex-wrap gap-1.5'>
                {utmMedium.map((m) => (
                  <span
                    key={m.medium}
                    className='inline-flex items-center gap-1 rounded-full bg-brand-50 text-brand-900 px-2 py-0.5 text-[10px] font-semibold'
                  >
                    {m.medium}
                    <span className='tabular-nums text-brand-600'>
                      {m.visits}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
