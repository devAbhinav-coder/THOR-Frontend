'use client';

import { CreditCard } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

type PaymentRow = { _id: string; revenue: number; count: number };

export default function PaymentMethodMixPanel({
  rows,
  grossTotal,
}: {
  rows: PaymentRow[];
  grossTotal: number;
}) {
  if (!rows.length) {
    return (
      <p className="text-sm text-gray-500 py-4">No payment data yet.</p>
    );
  }

  const sorted = [...rows].sort((a, b) => b.revenue - a.revenue);
  const maxRev = Math.max(...sorted.map((r) => r.revenue), 1);

  return (
    <div className="space-y-3">
      {sorted.map((pm) => {
        const pct = grossTotal > 0 ? (pm.revenue / grossTotal) * 100 : 0;
        const barPct = (pm.revenue / maxRev) * 100;
        const label = pm._id.replace(/_/g, ' ');
        return (
          <div key={pm._id} className="rounded-xl border border-gray-100 bg-gray-50/50 p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 capitalize">
                <CreditCard className="h-3.5 w-3.5 text-gray-400" />
                {label}
              </span>
              <span className="text-xs font-bold text-gray-900 tabular-nums">
                {formatPrice(pm.revenue)} · {pct.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 w-full bg-gray-200/80 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-navy-700 to-brand-500 rounded-full transition-all"
                style={{ width: `${barPct}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 tabular-nums">{pm.count} orders</p>
          </div>
        );
      })}
    </div>
  );
}
