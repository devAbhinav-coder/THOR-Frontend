'use client';

import Link from 'next/link';
import { Warehouse, PackageX, AlertTriangle, Boxes } from 'lucide-react';
import { formatPrice, cn } from '@/lib/utils';
import type { DashboardAnalytics } from '@/types';

export type InventoryValuationOverall = {
  totalUnits: number;
  totalCostValue: number;
  totalSaleValue: number;
  potentialMargin: number;
};

type InventorySnapshotPanelProps = {
  valuation: InventoryValuationOverall | null;
  stockHealth?: DashboardAnalytics['stockHealth'];
  compact?: boolean;
};

export default function InventorySnapshotPanel({
  valuation,
  stockHealth,
  compact = false,
}: InventorySnapshotPanelProps) {
  if (!valuation) return null;

  const expectedProfit = valuation.totalSaleValue - valuation.totalCostValue;
  const healthPills = stockHealth ?
    [
      {
        label: 'Out of stock',
        value: stockHealth.outOfStock,
        icon: PackageX,
        tone: 'bg-red-50 text-red-800 border-red-100',
      },
      {
        label: 'Low stock',
        value: stockHealth.lowStock,
        icon: AlertTriangle,
        tone: 'bg-amber-50 text-amber-900 border-amber-100',
      },
      {
        label: 'Units on hand',
        value: stockHealth.totalUnits.toLocaleString(),
        icon: Boxes,
        tone: 'bg-navy-50 text-navy-900 border-navy-100',
      },
    ]
  : [];

  const metrics = [
    {
      label: 'Inventory at cost',
      value: formatPrice(valuation.totalCostValue),
      sub: 'Purchase cost of all units in stock',
      color: 'text-gray-900',
    },
    {
      label: 'Sale value (list)',
      value: formatPrice(valuation.totalSaleValue),
      sub: 'If everything sold at current price',
      color: 'text-emerald-700',
    },
    {
      label: 'Potential margin',
      value: `${valuation.potentialMargin}%`,
      sub: `Expected profit ${formatPrice(expectedProfit)}`,
      color: valuation.potentialMargin >= 0 ? 'text-emerald-700' : 'text-red-600',
    },
    {
      label: 'Total units',
      value: valuation.totalUnits.toLocaleString(),
      sub: 'Across all active variants',
      color: 'text-navy-800',
    },
  ];

  return (
    <section className="rounded-[1.5rem] border border-gray-200/80 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden group">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-[#FAF9F6] to-white">
        <div>
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Warehouse className="h-4 w-4 text-brand-600" />
            Inventory valuation
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Live stock value — cost basis vs storefront list price
          </p>
        </div>
        <Link
          href="/admin/inventory"
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline shrink-0"
        >
          Open inventory hub →
        </Link>
      </div>

      {healthPills.length > 0 && (
        <div
          className={cn(
            'flex flex-wrap gap-2 px-5 py-3 border-b border-gray-50 bg-gray-50/40',
            compact && 'py-2',
          )}
        >
          {healthPills.map((p) => (
            <span
              key={p.label}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold',
                p.tone,
              )}
            >
              <p.icon className="h-3.5 w-3.5 shrink-0" />
              {p.label}: <span className="tabular-nums">{p.value}</span>
            </span>
          ))}
        </div>
      )}

      <div
        className={cn(
          'grid grid-cols-2 lg:grid-cols-4 gap-3 p-5',
          compact && 'p-4 gap-2',
        )}
      >
        {metrics.map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-transparent bg-white p-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
          >
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide group-hover:text-brand-500 transition-colors">{c.label}</p>
            <p className={cn('text-lg font-bold mt-1 tabular-nums', c.color)}>{c.value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{c.sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
