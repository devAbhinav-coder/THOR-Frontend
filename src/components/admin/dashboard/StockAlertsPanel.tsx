'use client';

import Link from 'next/link';
import { PackageX, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { LOW_STOCK_ALERT_EXCLUSIVE_MAX } from '@/lib/inventoryConstants';
import { cn } from '@/lib/utils';
import type { DashboardAnalytics } from '@/types';

type StockProduct = {
  _id: string;
  name: string;
  totalStock: number;
  category: string;
};

type StockAlertsPanelProps = {
  outOfStock: StockProduct[];
  lowStockOnly: StockProduct[];
  stockHealth?: DashboardAnalytics['stockHealth'];
  showManageLink?: boolean;
  /** Avoid stretching to fill grid rows (e.g. Analytics bento layout) */
  compact?: boolean;
};

function ProductRow({ product, variant }: { product: StockProduct; variant: 'out' | 'low' }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
        <p className="text-xs text-gray-500 truncate">{product.category}</p>
      </div>
      <span
        className={
          variant === 'out' ?
            'text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-800 shrink-0'
          : 'text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 shrink-0'
        }
      >
        {variant === 'out' ? 'Out of stock' : `${product.totalStock} left`}
      </span>
    </div>
  );
}

export default function StockAlertsPanel({
  outOfStock,
  lowStockOnly,
  stockHealth,
  showManageLink = true,
  compact = false,
}: StockAlertsPanelProps) {
  const totalAlerts = (stockHealth?.outOfStock ?? outOfStock.length) + (stockHealth?.lowStock ?? lowStockOnly.length);
  const allClear = outOfStock.length === 0 && lowStockOnly.length === 0;

  return (
    <section
      className={cn(
        'rounded-2xl border border-gray-200/80 bg-white shadow-sm overflow-hidden',
        compact ? 'h-auto' : 'h-full flex flex-col',
      )}
    >
      <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900">Stock alerts</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Out of stock and low stock (&lt;{LOW_STOCK_ALERT_EXCLUSIVE_MAX} units) are tracked separately
          </p>
        </div>
        {showManageLink && (
          <Link
            href="/admin/inventory"
            className="text-xs font-semibold text-brand-600 hover:underline shrink-0"
          >
            Manage
          </Link>
        )}
      </div>

      {allClear ?
        <div
          className={cn(
            'flex flex-col items-center justify-center p-8 text-center',
            !compact && 'flex-1',
          )}
        >
          <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2" />
          <p className="text-sm font-medium text-gray-800">All active SKUs are well stocked</p>
          <p className="text-xs text-gray-500 mt-1">No out-of-stock or low-stock alerts right now</p>
        </div>
      : <div
          className={cn(
            'grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100',
            !compact && 'flex-1',
          )}
        >
          <div className="p-4 sm:p-5 min-h-0">
            <div className="flex items-center gap-2 mb-3">
              <PackageX className="h-4 w-4 text-red-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-red-800">
                Out of stock
                {stockHealth ?
                  <span className="ml-1.5 tabular-nums font-semibold">({stockHealth.outOfStock})</span>
                : null}
              </h4>
            </div>
            {outOfStock.length === 0 ?
              <p className="text-sm text-gray-500 py-4">No products completely out of stock.</p>
            : <div className="max-h-[220px] overflow-y-auto pr-1">
                {outOfStock.map((p) => (
                  <ProductRow key={String(p._id)} product={p} variant="out" />
                ))}
              </div>
            }
            {(stockHealth?.outOfStock ?? 0) > outOfStock.length && (
              <p className="text-[10px] text-gray-400 mt-2">
                Showing top {outOfStock.length} of {stockHealth?.outOfStock} — see Inventory for full list
              </p>
            )}
          </div>

          <div className="p-4 sm:p-5 min-h-0">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Low stock
                {stockHealth ?
                  <span className="ml-1.5 tabular-nums font-semibold">({stockHealth.lowStock})</span>
                : null}
              </h4>
            </div>
            {lowStockOnly.length === 0 ?
              <p className="text-sm text-gray-500 py-4">No low-stock items (1–{LOW_STOCK_ALERT_EXCLUSIVE_MAX - 1} units).</p>
            : <div className="max-h-[220px] overflow-y-auto pr-1">
                {lowStockOnly.map((p) => (
                  <ProductRow key={String(p._id)} product={p} variant="low" />
                ))}
              </div>
            }
          </div>
        </div>
      }

      {totalAlerts > 0 && (
        <div className="px-5 py-2.5 bg-amber-50/50 border-t border-amber-100/80 text-[11px] text-amber-900/90">
          {totalAlerts} product{totalAlerts === 1 ? '' : 's'} need attention — restock or pause ads on out-of-stock items.
        </div>
      )}
    </section>
  );
}
