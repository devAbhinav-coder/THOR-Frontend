'use client';

import { formatPrice } from '@/lib/utils';
import type { CategoryProfitRow } from '@/types';

export default function CategoryProfitPanel({ rows }: { rows: CategoryProfitRow[] }) {
  if (!rows.length) return null;

  const maxProfit = Math.max(...rows.map((r) => Math.abs(r.profit)), 1);

  return (
    <div className="space-y-3">
      {rows.map((cat) => {
        const pct = (Math.abs(cat.profit) / maxProfit) * 100;
        const negative = cat.profit < 0;
        return (
          <div key={cat._id} className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-gray-800 truncate">{cat._id}</span>
              <span className="text-gray-500 tabular-nums shrink-0">{cat.units} u</span>
            </div>
            <div className="flex items-center justify-between gap-2 text-[11px] mb-1">
              <span className="text-gray-500">
                Rev {formatPrice(cat.revenue)} · COGS {formatPrice(cat.cogs)}
              </span>
              <span
                className={
                  negative ?
                    'font-bold text-red-600 tabular-nums'
                  : 'font-bold text-emerald-700 tabular-nums'
                }
              >
                {formatPrice(cat.profit)} ({cat.marginPercent}%)
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${negative ? 'bg-red-400' : 'bg-gradient-to-r from-emerald-500 to-teal-600'}`}
                style={{ width: `${Math.max(pct, 4)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
