'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Eye, BarChart3, ArrowUpRight } from 'lucide-react';
import type { DashboardAnalytics } from '@/types';

type MarketingPulseStripProps = {
  topViewed: DashboardAnalytics['topViewedProducts'];
};

export default function MarketingPulseStrip({
  topViewed,
  attributedOrders,
}: MarketingPulseStripProps & { attributedOrders?: number }) {
  if (!topViewed?.length) return null;

  const items = topViewed.slice(0, 5);

  return (
    <section className="rounded-2xl border border-navy-800 bg-gradient-to-br from-navy-900 via-navy-950 to-navy-900 text-white shadow-xl overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-gold-300" />
          <div>
            <h3 className="font-semibold text-sm sm:text-base">Storefront demand</h3>
            <p className="text-[11px] text-white/50 mt-0.5">
              Most viewed products
              {typeof attributedOrders === 'number' ?
                ` · ${attributedOrders} ad orders (30d)`
              : ''}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Link
            href="/admin/analytics#meta-ads"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 border border-white/15 px-3 py-2 text-xs font-bold text-white/90 hover:bg-white/15 transition-colors"
          >
            Meta ads
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/admin/analytics#storefront-demand"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gold-400/20 border border-gold-400/30 px-3 py-2 text-xs font-bold text-gold-200 hover:bg-gold-400/30 hover:text-white transition-colors"
          >
            Traffic hub
            <BarChart3 className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 p-4">
        {items.map((p, i) => (
          <div
            key={String(p._id)}
            className="group flex items-center gap-2.5 rounded-xl bg-white/5 border border-white/10 p-2.5"
          >
            <span className="text-xs font-bold text-white/30 w-4 tabular-nums">{i + 1}</span>
            <div className="relative h-11 w-11 rounded-lg overflow-hidden bg-navy-800 shrink-0 ring-1 ring-white/10">
              {p.image ?
                <Image src={p.image} alt="" fill sizes="44px" className="object-cover" />
              : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate group-hover:text-gold-100">{p.name}</p>
              <p className="text-[10px] text-white/45 tabular-nums">
                {p.views.toLocaleString()} views · {p.conversionPercent}% conv.
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
