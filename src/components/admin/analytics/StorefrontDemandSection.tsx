'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Eye, TrendingUp, ShoppingCart, ExternalLink } from 'lucide-react';
import type { DashboardAnalytics } from '@/types';
import TopViewedTable from './TopViewedTable';
import ViewsConversionChart from './ViewsConversionChart';
import ConversionRateChart from './ConversionRateChart';

type StorefrontDemandSectionProps = {
  topViewed: DashboardAnalytics['topViewedProducts'];
  totalPdpViews?: number;
  productsWithViews?: number;
};

export default function StorefrontDemandSection({
  topViewed,
  totalPdpViews,
  productsWithViews,
}: StorefrontDemandSectionProps) {
  const stats = useMemo(() => {
    const rows = topViewed ?? [];
    const listedViews = rows.reduce((s, p) => s + p.views, 0);
    const totalViews = totalPdpViews ?? listedViews;
    const totalSold = rows.reduce((s, p) => s + p.sold, 0);
    const avgConv =
      rows.length > 0 ?
        Math.round((rows.reduce((s, p) => s + p.conversionPercent, 0) / rows.length) * 10) / 10
      : 0;
    const highConv = rows.filter((p) => p.conversionPercent >= avgConv && p.views >= 5);
    const lowConv = rows.filter((p) => p.conversionPercent < avgConv && p.views >= 10);
    return {
      totalViews,
      totalSold,
      avgConv,
      highConv,
      lowConv,
      trackedSkus: productsWithViews ?? rows.length,
    };
  }, [topViewed, totalPdpViews, productsWithViews]);

  if (!topViewed?.length) {
    return (
      <section
        id="storefront-demand"
        className="scroll-mt-20 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center"
      >
        <Eye className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm font-medium text-gray-700">No storefront traffic yet</p>
        <p className="text-xs text-gray-500 mt-1">Views appear when customers open product pages (1 per session per SKU).</p>
      </section>
    );
  }

  return (
    <section
      id="storefront-demand"
      className="scroll-mt-20 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/80">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-navy-900 flex items-center justify-center shrink-0">
            <Eye className="h-4 w-4 text-gold-300" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-gray-900">Traffic & conversion</h2>
            <p className="text-[10px] text-gray-500 truncate">
              Session-unique PDP views · {stats.trackedSkus} SKUs with traffic
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {[
            { label: 'Views', value: stats.totalViews.toLocaleString(), icon: Eye },
            { label: 'Sold', value: stats.totalSold.toLocaleString(), icon: ShoppingCart },
            { label: 'Avg conv.', value: `${stats.avgConv}%`, icon: TrendingUp },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-center min-w-[4.5rem]">
              <p className="text-sm font-bold tabular-nums text-gray-900">{s.value}</p>
              <p className="text-[9px] text-gray-400 uppercase">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 sm:p-4 space-y-3">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="rounded-lg border border-gray-100 bg-white p-3">
            <h3 className="text-xs font-bold text-gray-900">Views vs sold</h3>
            <p className="text-[10px] text-gray-500 mb-2">Top 8 by views</p>
            <ViewsConversionChart rows={topViewed} />
          </div>
          <div className="rounded-lg border border-gray-100 bg-white p-3">
            <h3 className="text-xs font-bold text-gray-900">Conversion ranking</h3>
            <p className="text-[10px] text-gray-500 mb-2">Avg {stats.avgConv}%</p>
            <ConversionRateChart rows={topViewed} avgConversion={stats.avgConv} />
          </div>
        </div>

        {(stats.highConv.length > 0 || stats.lowConv.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <InsightList
              title="Merchandising wins"
              tone="emerald"
              items={stats.highConv.slice(0, 5)}
              hint="High conversion — feature on homepage"
            />
            <InsightList
              title="Needs attention"
              tone="amber"
              items={stats.lowConv.slice(0, 5)}
              hint="Many views, weak conversion"
            />
          </div>
        )}

        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="text-xs font-semibold text-gray-900">Product traffic</h3>
            <span className="text-[10px] font-medium text-gray-500">{topViewed.length} SKUs</span>
          </div>
          <TopViewedTable rows={topViewed} compact />
        </div>
      </div>
    </section>
  );
}

function InsightList({
  title,
  tone,
  items,
  hint,
}: {
  title: string;
  tone: 'emerald' | 'amber';
  items: DashboardAnalytics['topViewedProducts'];
  hint: string;
}) {
  const border = tone === 'emerald' ? 'border-emerald-100 bg-emerald-50/40' : 'border-amber-100 bg-amber-50/40';
  return (
    <div className={`rounded-lg border p-3 ${border}`}>
      <h4 className="text-[10px] font-bold uppercase tracking-wide text-gray-800">{title}</h4>
      <p className="text-[9px] text-gray-500 mb-2">{hint}</p>
      <ul className="space-y-1">
        {items.map((p) => (
          <li key={String(p._id)} className="flex items-center justify-between gap-2 text-[11px]">
            <Link
              href={`/shop/${encodeURIComponent(p.slug)}`}
              target="_blank"
              className="font-medium text-gray-800 truncate hover:text-brand-700 flex items-center gap-1 min-w-0"
            >
              <span className="truncate">{p.name}</span>
              <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-50" />
            </Link>
            <span className="tabular-nums font-bold text-gray-700 shrink-0">{p.conversionPercent}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
