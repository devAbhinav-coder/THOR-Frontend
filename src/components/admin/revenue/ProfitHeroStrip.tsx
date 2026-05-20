'use client';

import { TrendingUp, Package, Percent, IndianRupee, Info } from 'lucide-react';
import { formatPrice, cn } from '@/lib/utils';
import type { DashboardAnalytics } from '@/types';

type ProfitHeroStripProps = {
  overview: DashboardAnalytics['overview'];
  netRetained: number;
  grossOrderRevenue: number;
};

export default function ProfitHeroStrip({
  overview,
  netRetained,
  grossOrderRevenue,
}: ProfitHeroStripProps) {
  const productRevenue = overview.productRevenue ?? 0;
  const productCogs = overview.productCogs ?? 0;
  const grossProfit = overview.grossProfit ?? 0;
  const margin = overview.grossMarginPercent ?? 0;
  const mtdProfit = overview.monthGrossProfit ?? 0;
  const mtdMargin = overview.monthGrossMarginPercent ?? 0;
  const missingCost = overview.profitLinesMissingCost ?? 0;
  const totalLines = overview.profitOrderLines ?? 0;
  const costCoverage =
    totalLines > 0 ? Math.round(((totalLines - missingCost) / totalLines) * 100) : 100;

  const cards = [
    {
      label: 'Gross product profit',
      value: formatPrice(grossProfit),
      sub: `${margin}% margin on ${formatPrice(productRevenue)} line sales`,
      icon: TrendingUp,
      accent: 'from-emerald-600 to-teal-700 text-white border-emerald-700',
      valueClass: 'text-white',
      subClass: 'text-emerald-100/90',
    },
    {
      label: 'Product COGS',
      value: formatPrice(productCogs),
      sub: `Cost of units sold (paid orders)`,
      icon: Package,
      accent: 'from-slate-800 to-slate-900 text-white border-slate-700',
      valueClass: 'text-white',
      subClass: 'text-slate-300/90',
    },
    {
      label: 'Line-item revenue',
      value: formatPrice(productRevenue),
      sub: `Vs ${formatPrice(grossOrderRevenue)} order gross (incl. shipping/tax)`,
      icon: IndianRupee,
      accent: 'from-navy-800 to-navy-950 text-white border-navy-700',
      valueClass: 'text-white',
      subClass: 'text-white/50',
    },
    {
      label: 'Net cash retained',
      value: formatPrice(netRetained),
      sub: 'Order gross minus refunds',
      icon: Percent,
      accent: 'from-brand-600 to-brand-800 text-white border-brand-700',
      valueClass: 'text-white',
      subClass: 'text-brand-100/90',
    },
  ];

  return (
    <section className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
            Actual profit intelligence
          </h2>
          <p className="text-xs text-gray-500 mt-0.5 max-w-xl">
            Profit = paid line revenue − variant cost (SKU match). Uses catalog cost today — add cost on variants in Inventory for accuracy.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 px-2.5 py-1 font-semibold">
            MTD profit {formatPrice(mtdProfit)} · {mtdMargin}%
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-semibold',
              costCoverage >= 90 ?
                'bg-gray-50 text-gray-600 border-gray-200'
              : 'bg-amber-50 text-amber-900 border-amber-200',
            )}
          >
            <Info className="h-3 w-3" />
            Cost data on {costCoverage}% of lines
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {cards.map((c) => (
          <article
            key={c.label}
            className={cn(
              'rounded-2xl border p-4 sm:p-5 shadow-lg bg-gradient-to-br',
              c.accent,
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{c.label}</p>
              <c.icon className="h-4 w-4 opacity-70 shrink-0" />
            </div>
            <p className={cn('text-2xl font-bold font-serif tabular-nums mt-2 tracking-tight', c.valueClass)}>
              {c.value}
            </p>
            <p className={cn('text-[11px] mt-1.5 leading-snug', c.subClass)}>{c.sub}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
