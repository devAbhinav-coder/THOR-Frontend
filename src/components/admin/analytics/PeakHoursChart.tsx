'use client';

import { formatPrice } from '@/lib/utils';

type HourRow = { hour: number; orders: number; revenue: number };

const BAR_MAX_PX = 112;

export default function PeakHoursChart({ data }: { data: HourRow[] }) {
  if (!data.length) {
    return (
      <p className="text-sm text-gray-500 py-6 text-center">No order timing data yet.</p>
    );
  }

  const maxOrders = Math.max(...data.map((x) => x.orders), 1);
  const peakHour = data.reduce((best, h) => (h.orders > best.orders ? h : best), data[0]);
  const quietHours = data.filter((h) => h.orders === 0).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="rounded-full bg-brand-50 text-brand-800 border border-brand-100 px-3 py-1 font-semibold tabular-nums">
          Peak: {peakHour.hour}:00 · {peakHour.orders} orders
        </span>
        <span className="rounded-full bg-gray-50 text-gray-600 border border-gray-100 px-3 py-1 tabular-nums">
          {quietHours} quiet hour{quietHours === 1 ? '' : 's'} (0 orders)
        </span>
      </div>

      <div className="relative rounded-xl border border-gray-100 bg-gradient-to-b from-slate-50/80 to-white px-2 sm:px-4 pt-3 pb-2">
        <div
          className="grid gap-1 sm:gap-1.5 items-end"
          style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}
        >
          {data.map((h) => {
            const barPx = h.orders > 0 ? Math.max(10, Math.round((h.orders / maxOrders) * BAR_MAX_PX)) : 4;
            const isPeak = h.hour === peakHour.hour && h.orders > 0;
            return (
              <div key={h.hour} className="group relative flex flex-col items-center gap-1.5 min-w-0">
                <div
                  className="w-full flex items-end justify-center"
                  style={{ height: BAR_MAX_PX }}
                >
                  <div
                    className={`w-[85%] max-w-[28px] rounded-t-md transition-all ${
                      isPeak ?
                        'bg-gradient-to-t from-navy-800 via-brand-600 to-brand-400 shadow-sm'
                      : 'bg-gradient-to-t from-brand-600/90 to-brand-300/80'
                    } group-hover:from-brand-700 group-hover:to-brand-400`}
                    style={{ height: barPx }}
                  />
                </div>
                <span className="text-[9px] sm:text-[10px] text-gray-400 tabular-nums leading-none">
                  {h.hour}
                </span>
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-20 pointer-events-none">
                  <div className="w-32 rounded-lg bg-navy-900 text-white text-[10px] p-2.5 shadow-xl border border-white/10">
                    <p className="font-bold border-b border-white/10 pb-1 mb-1">{h.hour}:00 IST</p>
                    <p className="tabular-nums">{h.orders} orders</p>
                    <p className="tabular-nums">{formatPrice(h.revenue)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
