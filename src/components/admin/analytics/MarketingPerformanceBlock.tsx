"use client";

import { Instagram, Megaphone, Tag, ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { DashboardAnalytics } from "@/types";

type MarketingInsights = NonNullable<DashboardAnalytics["marketingInsights"]>;
type ChannelRow = NonNullable<MarketingInsights["marketingChannelBreakdown"]>[number];

const ICONS: Record<string, typeof Megaphone> = {
  meta_paid_ad: Megaphone,
  instagram_link_in_bio: Instagram,
  meta_ads_utm: Megaphone,
  other_utm: Tag,
};

export default function MarketingPerformanceBlock({
  marketingInsights,
}: {
  marketingInsights?: MarketingInsights;
}) {
  const channels = marketingInsights?.marketingChannelBreakdown ?? [];
  const taggedSessions =
    marketingInsights?.utmTaggedVisits ??
    channels.reduce((s, r) => s + r.visits, 0);
  const orders = marketingInsights?.attributedOrders ?? 0;
  const revenue = channels.reduce((s, r) => s + r.revenue, 0);
  const fbclidSessions = marketingInsights?.fbclidVisits ?? 0;
  const fbclidOrders = marketingInsights?.fbclidOrders ?? 0;
  const visitToOrder =
    taggedSessions > 0 ?
      Math.round((orders / taggedSessions) * 1000) / 10
    : orders > 0 ?
      100
    : 0;

  return (
    <div className='rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden'>
      <div className='px-3 py-2.5 border-b border-gray-100 bg-gray-50/60'>
        <h4 className='text-xs font-semibold text-navy-900'>
          Marketing performance
        </h4>
        <p className='text-[10px] text-gray-500 mt-0.5'>
          Last 30 days · tagged landing URL to paid order
        </p>
      </div>

      <div className='grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100'>
        <div className='px-3 py-3 text-center sm:text-left'>
          <p className='text-[10px] font-medium text-gray-500 uppercase tracking-wide'>
            Sessions
          </p>
          <p className='text-xl sm:text-2xl font-bold tabular-nums text-gray-900 mt-0.5'>
            {taggedSessions}
          </p>
          <p className='text-[9px] text-gray-400 mt-0.5'>
            UTM or fbclid on landing URL
          </p>
        </div>
        <div className='px-3 py-3 text-center sm:text-left'>
          <p className='text-[10px] font-medium text-gray-500 uppercase tracking-wide'>
            Orders
          </p>
          <p className='text-xl sm:text-2xl font-bold tabular-nums text-navy-900 mt-0.5'>
            {orders}
          </p>
          <p className='text-[9px] text-gray-400 mt-0.5'>
            Paid with saved marketing tag
          </p>
        </div>
        <div className='px-3 py-3 text-center sm:text-left'>
          <p className='text-[10px] font-medium text-gray-500 uppercase tracking-wide'>
            Revenue
          </p>
          <p className='text-xl sm:text-2xl font-bold tabular-nums text-emerald-700 mt-0.5'>
            {formatPrice(revenue)}
          </p>
          <p className='text-[9px] text-gray-400 mt-0.5'>
            Tagged orders · {visitToOrder}% session to order
          </p>
        </div>
      </div>

      {(fbclidSessions > 0 || fbclidOrders > 0 || taggedSessions > 0) && (
        <div className='px-3 py-2 bg-brand-50/50 border-b border-brand-100/60 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-gray-600'>
          <span>
            <span className='font-semibold text-gray-800'>Meta click id:</span>{" "}
            {fbclidSessions} sessions → {fbclidOrders} paid
          </span>
          <span className='text-gray-400 hidden sm:inline'>|</span>
          <span className='text-gray-500'>
            Instagram bio links use UTM; paid Meta clicks include fbclid
          </span>
        </div>
      )}

      <div className='p-3'>
        <p className='text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-2'>
          Where traffic came from
        </p>
        {channels.length === 0 ?
          <div className='rounded-lg border border-dashed border-gray-200 bg-gray-50/80 px-3 py-6 text-center'>
            <p className='text-xs font-medium text-gray-700'>
              No tagged sessions yet
            </p>
            <p className='text-[10px] text-gray-500 mt-1 max-w-md mx-auto leading-relaxed'>
              Add UTM parameters to bio or ad links (
              <code className='bg-white px-1 rounded text-[9px]'>
                utm_content=link_in_bio
              </code>
              ). Direct and untagged visits are excluded from this summary.
            </p>
          </div>
        : <ChannelList rows={channels} />}
      </div>
    </div>
  );
}

function ChannelList({ rows }: { rows: ChannelRow[] }) {
  const maxVisits = Math.max(...rows.map((r) => r.visits), 1);

  return (
    <ul className='space-y-2'>
      {rows.map((row) => {
        const Icon = ICONS[row.key] ?? Tag;
        const conv =
          row.visits > 0 ?
            Math.round((row.orders / row.visits) * 1000) / 10
          : row.orders > 0 ?
            100
          : 0;
        return (
          <li
            key={row.key}
            className='rounded-lg border border-gray-100 bg-gray-50/40 px-2.5 py-2'
          >
            <div className='flex items-center gap-2'>
              <Icon
                className={`h-4 w-4 shrink-0 ${
                  row.key === "instagram_link_in_bio" ?
                    "text-pink-600"
                  : row.key === "meta_paid_ad" ?
                    "text-navy-800"
                  : "text-brand-600"
                }`}
              />
              <div className='min-w-0 flex-1'>
                <div className='flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5'>
                  <p className='text-[11px] font-bold text-gray-900'>
                    {row.title}
                  </p>
                  <div className='flex items-center gap-1 text-[10px] tabular-nums text-gray-600'>
                    <span>
                      <strong className='text-gray-900'>{row.visits}</strong>{" "}
                      sessions
                    </span>
                    <ArrowRight className='h-3 w-3 text-gray-300' />
                    <span>
                      <strong className='text-gray-900'>{row.orders}</strong>{" "}
                      orders
                    </span>
                    {row.revenue > 0 && (
                      <span className='text-emerald-700 font-semibold ml-1'>
                        {formatPrice(row.revenue)}
                      </span>
                    )}
                    {row.visits > 0 && (
                      <span className='text-gray-400 ml-1'>({conv}%)</span>
                    )}
                  </div>
                </div>
                <div className='h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1.5'>
                  <div
                    className={`h-full rounded-full ${
                      row.key === "instagram_link_in_bio" ?
                        "bg-pink-500"
                      : row.key === "meta_paid_ad" ?
                        "bg-navy-800"
                      : row.key === "meta_ads_utm" ?
                        "bg-brand-500"
                      : "bg-gray-400"
                    }`}
                    style={{ width: `${(row.visits / maxVisits) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
