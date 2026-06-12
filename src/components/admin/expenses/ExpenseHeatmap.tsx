'use client';

import { categoryColor, categoryLabel, EXPENSE_CATEGORIES } from '@/lib/operatingExpenseCategories';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface HeatmapCell {
  year: number;
  month: number;
  category: string;
  total: number;
}

export default function ExpenseHeatmap({
  cells,
  year,
  maxValue,
}: {
  cells: HeatmapCell[];
  year: number;
  maxValue: number;
}) {
  const cellMap = new Map<string, number>();
  for (const c of cells) {
    cellMap.set(`${c.category}-${c.month}`, c.total);
  }

  const max = maxValue > 0 ? maxValue : 1;

  function intensity(amount: number): string {
    if (amount <= 0) return 'bg-gray-50 text-gray-300';
    const ratio = amount / max;
    if (ratio >= 0.75) return 'bg-brand-600 text-white shadow-sm';
    if (ratio >= 0.5) return 'bg-brand-500 text-white';
    if (ratio >= 0.3) return 'bg-brand-300 text-brand-950';
    if (ratio >= 0.15) return 'bg-brand-200 text-brand-900';
    return 'bg-brand-50 text-brand-800';
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[10px] min-w-[640px] border-separate border-spacing-1">
        <thead>
          <tr>
            <th className="text-left px-2 py-1 text-gray-500 font-bold uppercase sticky left-0 bg-white z-10">
              Category
            </th>
            {MONTHS.map(m => (
              <th key={m} className="text-center px-1 py-1 text-gray-400 font-semibold min-w-[3rem]">
                {m}
              </th>
            ))}
            <th className="text-right px-2 py-1 text-gray-500 font-bold">YTD</th>
          </tr>
        </thead>
        <tbody>
          {EXPENSE_CATEGORIES.map(cat => {
            let rowTotal = 0;
            return (
              <tr key={cat.id}>
                <td className="sticky left-0 bg-white z-10 px-2 py-1">
                  <div className="flex items-center gap-1.5">
                    <span className={cn('h-2 w-2 rounded-full shrink-0', categoryColor(cat.id))} />
                    <span className="font-semibold text-gray-700 text-[10px] whitespace-nowrap">
                      {cat.label}
                    </span>
                  </div>
                </td>
                {MONTHS.map((_, mi) => {
                  const month = mi + 1;
                  const amt = cellMap.get(`${cat.id}-${month}`) ?? 0;
                  rowTotal += amt;
                  return (
                    <td key={month} className="p-0.5">
                      <div
                        className={cn(
                          'rounded-md px-1 py-1.5 text-center font-bold tabular-nums min-h-[2rem] flex items-center justify-center',
                          intensity(amt),
                        )}
                        title={`${categoryLabel(cat.id)} · ${MONTHS[mi]} ${year}: ${formatPrice(amt)}`}
                      >
                        {amt > 0 ? (amt >= 1000 ? `${Math.round(amt / 1000)}k` : Math.round(amt)) : '·'}
                      </div>
                    </td>
                  );
                })}
                <td className="text-right px-2 font-bold text-gray-800 tabular-nums">
                  {rowTotal > 0 ? formatPrice(rowTotal) : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-[10px] text-gray-400 mt-2 px-1">
        Heat intensity = spend vs peak month in {year}. Hover cells for exact ₹.
      </p>
    </div>
  );
}
