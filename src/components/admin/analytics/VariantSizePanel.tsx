'use client';

import { Ruler } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { DashboardAnalytics } from '@/types';

type Row = NonNullable<DashboardAnalytics['topVariantSizes']>[number];

export default function VariantSizePanel({ rows }: { rows: Row[] }) {
  if (!rows.length) {
    return null;
  }

  const maxUnits = Math.max(...rows.map((x) => x.units), 1);

  return (
    <div className="pt-5 mt-5 border-t border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <Ruler className="h-4 w-4 text-brand-600" />
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Top sizes (units)</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
        {rows.slice(0, 8).map((v) => {
          const pct = (v.units / maxUnits) * 100;
          return (
            <div key={v._id} className="min-w-0">
              <div className="flex justify-between items-baseline gap-2 text-xs mb-1">
                <span className="font-semibold text-gray-800 truncate">Size {v._id}</span>
                <span className="text-gray-500 tabular-nums shrink-0 text-[11px]">
                  {v.units} u · {formatPrice(v.revenue)}
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-navy-600 to-brand-500 rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
