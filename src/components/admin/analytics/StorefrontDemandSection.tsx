'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Eye, TrendingUp, ShoppingCart, Sparkles, ExternalLink } from 'lucide-react';
import type { DashboardAnalytics } from '@/types';
import TopViewedTable from './TopViewedTable';
import ViewsConversionChart from './ViewsConversionChart';
import ConversionRateChart from './ConversionRateChart';

type StorefrontDemandSectionProps = {
  topViewed: DashboardAnalytics['topViewedProducts'];
  /** When true, show compact “you navigated here” banner */
  highlightNav?: boolean;
};

export default function StorefrontDemandSection({
  topViewed,
  highlightNav = false,
}: StorefrontDemandSectionProps) {
  const stats = useMemo(() => {
    const rows = topViewed ?? [];
    const totalViews = rows.reduce((s, p) => s + p.views, 0);
    const totalSold = rows.reduce((s, p) => s + p.sold, 0);
    const avgConv =
      rows.length > 0 ?
        Math.round((rows.reduce((s, p) => s + p.conversionPercent, 0) / rows.length) * 10) / 10
      : 0;
    const highConv = rows.filter((p) => p.conversionPercent >= avgConv && p.views >= 5);
    const lowConv = rows.filter((p) => p.conversionPercent < avgConv && p.views >= 10);
    return { totalViews, totalSold, avgConv, highConv, lowConv };
  }, [topViewed]);

  if (!topViewed?.length) {
    return (
      <section
        id="storefront-demand"
        className="scroll-mt-24 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center"
      >
        <Eye className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-700">No storefront traffic yet</p>
        <p className="text-xs text-gray-500 mt-1">Views appear when customers open product pages.</p>
      </section>
    );
  }

  return (
    <section
      id="storefront-demand"
      className="scroll-mt-24 rounded-2xl border-2 border-brand-200/80 bg-white shadow-[0_24px_64px_-36px_rgba(190,18,60,0.25)] overflow-hidden"
    >
      {highlightNav && (
        <div className="bg-brand-50 border-b border-brand-100 px-4 py-2.5 text-xs text-brand-900 font-medium flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          Traffic hub — charts and full product list below (not the dashboard preview).
        </div>
      )}

      <div className="bg-gradient-to-r from-navy-900 via-navy-950 to-navy-900 text-white px-5 sm:px-6 py-5 border-b border-white/10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
              <Eye className="h-5 w-5 text-gold-300" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gold-300/90">
                Storefront demand hub
              </p>
              <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight mt-0.5">
                Traffic & conversion intelligence
              </h2>
              <p className="text-sm text-white/55 mt-1 max-w-xl">
                Which PDPs attract eyes, which convert, and where to feature on homepage or ads.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:max-w-md w-full">
            {[
              { label: 'Tracked views', value: stats.totalViews.toLocaleString(), icon: Eye },
              { label: 'Units sold', value: stats.totalSold.toLocaleString(), icon: ShoppingCart },
              { label: 'Avg conversion', value: `${stats.avgConv}%`, icon: TrendingUp },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-center"
              >
                <s.icon className="h-3.5 w-3.5 text-gold-300 mx-auto mb-1" />
                <p className="text-lg font-bold tabular-nums">{s.value}</p>
                <p className="text-[9px] text-white/45 uppercase tracking-wide">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6 bg-gradient-to-b from-slate-50/50 to-white">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-1">Views vs units sold</h3>
            <p className="text-xs text-gray-500 mb-3">Top 8 products by PDP views</p>
            <ViewsConversionChart rows={topViewed} />
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-1">Conversion rate ranking</h3>
            <p className="text-xs text-gray-500 mb-3">Orange line = catalog average ({stats.avgConv}%)</p>
            <ConversionRateChart rows={topViewed} avgConversion={stats.avgConv} />
          </div>
        </div>

        {(stats.highConv.length > 0 || stats.lowConv.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InsightList
              title="Merchandising wins"
              tone="emerald"
              items={stats.highConv.slice(0, 4)}
              hint="High conversion vs average — feature on homepage"
            />
            <InsightList
              title="Needs attention"
              tone="amber"
              items={stats.lowConv.slice(0, 4)}
              hint="Many views, weak conversion — check price, images, stock"
            />
          </div>
        )}

        <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Full product traffic table</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                All tracked SKUs · hover row for store link
              </p>
            </div>
            <span className="text-xs font-semibold text-gray-500">{topViewed.length} products</span>
          </div>
          <TopViewedTable rows={topViewed} />
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
    <div className={`rounded-xl border p-4 ${border}`}>
      <h4 className="text-xs font-bold uppercase tracking-wide text-gray-800">{title}</h4>
      <p className="text-[10px] text-gray-500 mt-0.5 mb-3">{hint}</p>
      <ul className="space-y-2">
        {items.map((p) => (
          <li key={String(p._id)} className="flex items-center justify-between gap-2 text-xs">
            <Link
              href={`/shop/${encodeURIComponent(p.slug)}`}
              target="_blank"
              className="font-medium text-gray-800 truncate hover:text-brand-600 flex items-center gap-1 min-w-0"
            >
              <span className="truncate">{p.name}</span>
              <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
            </Link>
            <span className="tabular-nums font-bold text-gray-700 shrink-0">{p.conversionPercent}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
