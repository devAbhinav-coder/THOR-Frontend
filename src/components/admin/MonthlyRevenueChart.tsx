'use client';

import { formatPrice, cn } from '@/lib/utils';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export type MonthPoint = { _id: { year: number; month: number }; revenue: number; orders: number };

type Props = {
  data: MonthPoint[];
  title?: string;
  subtitle?: string;
  /** Chart bar area height in px */
  chartHeight?: number;
  className?: string;
  /** Highlight last month in series */
  highlightLatest?: boolean;
};

/**
 * Bar chart with grid, gradient bars, and hover tooltips — shared by Revenue, Analytics, Dashboard.
 */
export default function MonthlyRevenueChart({
  data,
  title = 'Monthly revenue',
  subtitle = 'Last 12 months · paid orders',
  chartHeight = 200,
  className,
  highlightLatest = true,
}: Props) {
  if (!data.length) {
    return (
      <div className={cn('rounded-2xl border border-gray-100 bg-white p-8 shadow-sm', className)}>
        <h2 className="font-semibold text-gray-900">{title}</h2>
        <p className="text-xs text-gray-500 mt-0.5 mb-6">{subtitle}</p>
        <div className="h-52 flex items-center justify-center rounded-xl bg-slate-50 text-gray-400 text-sm border border-dashed border-gray-200">
          No revenue in this period yet
        </div>
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  const lastIdx = data.length - 1;

  return (
    <div className={cn('rounded-2xl border border-gray-100 bg-white p-5 sm:p-7 shadow-sm', className)}>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-6">
        <div>
          <h2 className="font-serif text-lg font-bold text-gray-900 tracking-tight">{title}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">Peak month</p>
          <p className="text-sm font-semibold text-brand-700 tabular-nums">
            {formatPrice(maxRevenue)}
          </p>
        </div>
      </div>

      <div className="relative rounded-xl bg-gradient-to-b from-slate-50/90 via-white to-white border border-gray-100/80 px-2 sm:px-4 pt-4 pb-2 overflow-visible">
        {/* Horizontal grid */}
        <div
          className="absolute left-2 right-2 sm:left-4 sm:right-4 top-4 pointer-events-none flex flex-col justify-between opacity-[0.35] z-0"
          style={{ height: chartHeight }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="border-t border-dashed border-gray-200 w-full" />
          ))}
        </div>

        <div
          className="relative z-10 flex items-end gap-1 sm:gap-2 justify-between overflow-visible"
          style={{ minHeight: chartHeight + 36 }}
        >
          {data.map((row, index) => {
            const barPx = Math.max(Math.round((row.revenue / maxRevenue) * chartHeight), row.revenue > 0 ? 8 : 4);
            const monthLabel = MONTHS[row._id.month - 1];
            const isLatest = highlightLatest && index === lastIdx;
            const isHigh = row.revenue === maxRevenue && maxRevenue > 0;
            const tipTitle = `${formatPrice(row.revenue)} · ${row.orders} orders · ${monthLabel} ${row._id.year}`;

            return (
              <div
                key={`${row._id.year}-${row._id.month}`}
                className="flex flex-col items-center gap-2 flex-1 min-w-0 max-w-[52px] sm:max-w-[56px] group/col"
              >
                <div className="relative w-full flex justify-center overflow-visible" style={{ height: chartHeight }}>
                  <div
                    className="pointer-events-none absolute left-1/2 z-30 w-max max-w-[min(220px,calc(100vw-2rem))] -translate-x-1/2 opacity-0 transition-opacity duration-150 group-hover/col:opacity-100"
                    style={{ bottom: barPx + 8 }}
                    role="tooltip"
                  >
                    <div className="rounded-lg border border-gray-600 bg-gray-900 px-2.5 py-2 text-left shadow-2xl ring-1 ring-black/20">
                      <p className="text-[11px] font-bold tabular-nums text-white">{formatPrice(row.revenue)}</p>
                      <p className="text-[11px] text-gray-300">{row.orders} orders</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {monthLabel} {row._id.year}
                      </p>
                    </div>
                  </div>
                  <div
                    title={tipTitle}
                    className={cn(
                      'absolute bottom-0 left-1/2 w-full max-w-[40px] sm:max-w-[44px] -translate-x-1/2 rounded-t-lg transition-transform duration-200 group-hover/col:brightness-110',
                      isLatest
                        ? 'bg-gradient-to-t from-brand-800 via-brand-500 to-amber-300 shadow-[0_8px_24px_rgba(232,96,76,0.35)] ring-2 ring-brand-400/40'
                        : isHigh
                          ? 'bg-gradient-to-t from-navy-800 via-brand-600 to-brand-400 shadow-lg shadow-brand-500/20'
                          : 'bg-gradient-to-t from-brand-800/90 via-brand-600 to-brand-400/95 shadow-md shadow-brand-900/10',
                    )}
                    style={{ height: barPx }}
                    aria-hidden
                  >
                    <span className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent rounded-t-lg" />
                  </div>
                </div>
                <span
                  className={cn(
                    'text-[10px] sm:text-[11px] truncate w-full text-center font-medium leading-tight',
                    isLatest ? 'text-brand-700' : 'text-gray-500',
                  )}
                >
                  {monthLabel}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between text-[10px] text-gray-400 px-1">
          <span>Older</span>
          <span className="hidden sm:inline">Hover bars for details</span>
          <span>Recent</span>
        </div>
      </div>
    </div>
  );
}
