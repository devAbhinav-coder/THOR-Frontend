'use client';

import { cn } from '@/lib/utils';
import type { RevenuePeriod } from '@/lib/revenuePeriod';

const PERIODS: { id: RevenuePeriod; label: string; hint: string }[] = [
  { id: 'month', label: 'This month', hint: 'MTD in IST' },
  { id: 'year', label: 'Year', hint: 'Calendar year' },
  { id: 'lifetime', label: 'Lifetime', hint: 'All orders' },
];

export default function RevenuePeriodToolbar({
  period,
  year,
  years,
  onPeriodChange,
  onYearChange,
  periodLabel,
}: {
  period: RevenuePeriod;
  year: number;
  years: number[];
  onPeriodChange: (p: RevenuePeriod) => void;
  onYearChange: (y: number) => void;
  periodLabel?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200/80 bg-white px-4 py-3 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPeriodChange(p.id)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors',
              period === p.id
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
            )}
            title={p.hint}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {period === 'year' && (
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">Year</span>
            <select
              value={year}
              onChange={(e) => onYearChange(Number(e.target.value))}
              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
        )}
        {periodLabel && (
          <span className="text-xs text-gray-500 border-l border-gray-200 pl-3">
            Showing: <strong className="text-gray-800">{periodLabel}</strong>
          </span>
        )}
      </div>
    </div>
  );
}
