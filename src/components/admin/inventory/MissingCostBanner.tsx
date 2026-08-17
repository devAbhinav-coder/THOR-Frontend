'use client';

import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export interface MissingCostBannerProps {
  missingSkus: number;
  totalSkus: number;
  periodLinesMissingCost?: number;
  periodOrderLines?: number;
  onFilterMissingCost?: () => void;
}

export default function MissingCostBanner({
  missingSkus,
  totalSkus,
  periodLinesMissingCost,
  periodOrderLines,
  onFilterMissingCost,
}: MissingCostBannerProps) {
  if (missingSkus <= 0 && !(periodLinesMissingCost && periodLinesMissingCost > 0)) {
    return null;
  }

  const pct = totalSkus > 0 ? Math.round((missingSkus / totalSkus) * 100) : 0;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-amber-900">Missing cost data</p>
          <p className="text-xs text-amber-800/90 mt-0.5 leading-relaxed">
            {missingSkus > 0 && (
              <>
                <strong>{missingSkus}</strong> of {totalSkus} SKUs ({pct}%) have no cost set — margin &amp; profit may be overstated.
              </>
            )}
            {periodLinesMissingCost != null &&
              periodOrderLines != null &&
              periodLinesMissingCost > 0 && (
                <>
                  {missingSkus > 0 ? ' · ' : ''}
                  <strong>{periodLinesMissingCost}</strong> of {periodOrderLines} order lines in this period lack cost.
                </>
              )}
            {' '}Set unit cost via purchase bills or Adjust stock.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 shrink-0">
        {onFilterMissingCost && missingSkus > 0 && (
          <button
            type="button"
            onClick={onFilterMissingCost}
            className="text-xs font-bold text-amber-900 bg-white border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-100"
          >
            Show SKUs missing cost
          </button>
        )}
        <Link
          href="/admin/revenue"
          className="text-xs font-bold text-brand-700 hover:underline px-1 py-1.5"
        >
          Revenue profit table →
        </Link>
      </div>
    </div>
  );
}
