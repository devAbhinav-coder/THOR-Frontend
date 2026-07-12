'use client';

import { formatPrice } from '@/lib/utils';

type HourRow = { hour: number; orders: number; revenue: number };

const BAR_MAX_PX = 72;

export default function PeakHoursChart({ data }: { data: HourRow[] }) {
  if (!data.length) {
    return (
      <p className="text-xs text-gray-500 py-4 text-center">No order timing data yet.</p>
    );
  }

  const totalOrders = data.reduce((s, h) => s + h.orders, 0);
  if (totalOrders === 0) {
    return (
      <p className="text-xs text-gray-500 py-4 text-center">No orders in this period — bars will appear when sales come in.</p>
    );
  }

  const maxOrders = Math.max(...data.map((x) => x.orders), 1);
  const peakHour = data.reduce((best, h) => (h.orders > best.orders ? h : best), data[0]);
  const quietHours = data.filter((h) => h.orders === 0).length;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 text-[10px]">
        <span className="rounded-full bg-brand-50 text-brand-800 border border-brand-100 px-2 py-0.5 font-semibold tabular-nums">
          Peak {peakHour.hour}:00 · {peakHour.orders} orders
        </span>
        {quietHours > 0 && (
          <span className="rounded-full bg-gray-50 text-gray-500 border border-gray-100 px-2 py-0.5 tabular-nums">
            {quietHours} quiet hrs
          </span>
        )}
      </div>

      <div className="rounded-lg border border-gray-100 bg-gradient-to-b from-slate-50/80 to-white px-1 sm:px-2 pt-2 pb-1">
        <div
          className="grid gap-0.5 sm:gap-1 items-end"
          style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}
        >
          {data.map((h) => {
            const barPx = h.orders > 0 ? Math.max(6, Math.round((h.orders / maxOrders) * BAR_MAX_PX)) : 2;
            const isPeak = h.hour === peakHour.hour && h.orders > 0;
            return (
              <div key={h.hour} className="group relative flex flex-col items-center gap-1 min-w-0">
                <div className="w-full flex items-end justify-center" style={{ height: BAR_MAX_PX }}>
                  <div
                    className={`w-[80%] max-w-[20px] rounded-t-[3px] transition-all duration-500 ${
                      h.orders === 0 ? 'bg-gray-200'
                      : isPeak ? 'bg-gradient-to-t from-navy-900 via-brand-600 to-gold-400'
                      : 'bg-gradient-to-t from-brand-500/80 to-brand-300/70'
                    }`}
                    style={{ height: barPx }}
                  />
                </div>
                <span className="text-[8px] sm:text-[9px] text-gray-400 tabular-nums leading-none">
                  {h.hour}
                </span>
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-20 pointer-events-none">
                  <div className="w-28 rounded-lg bg-navy-950 text-white text-[9px] p-2 shadow-xl border border-brand-500/30">
                    <p className="font-bold mb-1">{h.hour}:00 IST</p>
                    <p className="tabular-nums">{h.orders} orders</p>
                    <p className="tabular-nums font-bold text-brand-300">{formatPrice(h.revenue)}</p>
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
