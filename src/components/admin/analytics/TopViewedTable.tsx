'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Star } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { DashboardAnalytics } from '@/types';

type Row = DashboardAnalytics['topViewedProducts'][number];

export default function TopViewedTable({ rows }: { rows: Row[] }) {
  if (!rows.length) {
    return (
      <p className="text-gray-400 text-sm py-10 text-center">
        No view data yet — traffic builds as customers browse PDPs.
      </p>
    );
  }

  const maxViews = Math.max(...rows.map((p) => p.views), 1);

  return (
    <div className="divide-y divide-gray-50">
      {rows.map((p, i) => {
        const viewPct = (p.views / maxViews) * 100;
        return (
          <div
            key={String(p._id)}
            className="group relative flex items-center gap-3 py-3 first:pt-0 last:pb-0"
          >
            <span className="text-xs font-bold text-gray-300 w-5 tabular-nums shrink-0">{i + 1}</span>
            <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 ring-1 ring-gray-100">
              {p.image ?
                <Image src={p.image} alt="" fill sizes="40px" className="object-cover" />
              : null}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                  <p className="text-[11px] text-gray-400 truncate">
                    {p.category} · {formatPrice(p.price)}
                    {p.ratingAvg > 0 ?
                      <span className="inline-flex items-center gap-0.5 ml-1 text-amber-600">
                        <Star className="h-3 w-3 fill-amber-400" />
                        {p.ratingAvg.toFixed(1)}
                      </span>
                    : null}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-brand-700 tabular-nums">{p.conversionPercent}%</p>
                  <p className="text-[10px] text-gray-400 tabular-nums">conv.</p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full"
                    style={{ width: `${viewPct}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-500 tabular-nums shrink-0 w-[72px] text-right">
                  {p.views.toLocaleString()} v · {p.sold} sold
                </span>
              </div>
            </div>
            <Link
              href={`/shop/${encodeURIComponent(p.slug)}`}
              target="_blank"
              className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="View on store"
            >
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        );
      })}
    </div>
  );
}
