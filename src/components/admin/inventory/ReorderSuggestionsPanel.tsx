'use client';

import { PackagePlus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ReorderItem {
  productId: string;
  productName: string;
  sku: string;
  size?: string;
  color?: string;
  currentStock: number;
  unitsSoldInPeriod: number;
  avgDailySales: number;
  suggestedReorderQty: number;
  priorityScore: number;
  missingCost: boolean;
}

export default function ReorderSuggestionsPanel({
  items,
  lookbackDays = 30,
  leadTimeDays = 14,
}: {
  items: ReorderItem[];
  lookbackDays?: number;
  leadTimeDays?: number;
}) {
  if (!items.length) return null;

  return (
    <section className="rounded-[1.25rem] border border-navy-200/60 bg-gradient-to-br from-navy-50/40 to-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-navy-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <PackagePlus className="h-4 w-4 text-navy-700" />
          <h3 className="text-sm font-bold text-navy-900">Reorder suggestions</h3>
        </div>
        <p className="text-[10px] text-gray-500">
          Based on last {lookbackDays}d sales · {leadTimeDays}d lead time · WAC cost method
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[640px]">
          <thead>
            <tr className="bg-gray-50 text-[10px] text-gray-500 uppercase">
              <th className="text-left px-4 py-2">Product / SKU</th>
              <th className="text-right px-3 py-2">Stock</th>
              <th className="text-right px-3 py-2">Sold (30d)</th>
              <th className="text-right px-3 py-2">Avg/day</th>
              <th className="text-right px-3 py-2">Reorder qty</th>
              <th className="text-right px-4 py-2">Priority</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => {
              const label = [item.size, item.color].filter(Boolean).join(' / ') || item.sku;
              return (
                <tr key={`${item.productId}-${item.sku}`} className="hover:bg-navy-50/30">
                  <td className="px-4 py-2.5">
                    <p className="font-semibold text-gray-900 truncate max-w-[200px]">{item.productName}</p>
                    <p className="text-[10px] text-gray-500 font-mono">{label}</p>
                    {item.missingCost && (
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                        No cost
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span
                      className={cn(
                        'font-bold tabular-nums',
                        item.currentStock === 0 ? 'text-red-600' : 'text-gray-800',
                      )}
                    >
                      {item.currentStock}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{item.unitsSoldInPeriod}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-gray-600">
                    {item.avgDailySales.toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span className="font-bold text-brand-700 tabular-nums">
                      {item.suggestedReorderQty > 0 ? item.suggestedReorderQty : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="text-[10px] font-bold bg-navy-100 text-navy-800 px-2 py-0.5 rounded-full tabular-nums">
                      {item.priorityScore.toFixed(1)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
