'use client';

import Link from 'next/link';
import {
  ShoppingBag,
  IndianRupee,
  TrendingUp,
  Percent,
  ArrowUpRight,
  Receipt,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';

export interface InventoryBusinessSummaryData {
  totalProducts: number;
  totalUnits: number;
  outOfStock: number;
  lowStock: number;
  totalInventoryValue: number;
  totalSaleValueOnHand?: number;
  totalSoldUnits?: number;
  totalGrossRevenue?: number;
  totalGrossCostOfSales?: number;
  totalGrossProfit?: number;
  overallMarginPercent?: number;
  productsWithSales?: number;
  totalEstimatedRevenue?: number;
  totalEstimatedProfit?: number;
}

export interface OperatingCostsSnapshot {
  yearTotal: number;
  monthToDateTotal: number;
}

function PrimaryKpi({
  label,
  sublabel,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  sublabel: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col min-h-[108px]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{sublabel}</p>
        </div>
        <div className={cn('p-2 rounded-xl', accent)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-2xl sm:text-[1.65rem] font-extrabold text-gray-900 mt-auto pt-3 tracking-tight tabular-nums">
        {value}
      </p>
    </div>
  );
}

function SecondaryStat({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className="flex flex-col justify-center px-4 py-3 border-r border-gray-100 last:border-r-0 min-w-[110px]">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={cn('text-sm font-bold mt-0.5 tabular-nums', className ?? 'text-gray-800')}>{value}</p>
      {hint && <p className="text-[9px] text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
}

export default function InventoryBusinessSummary({
  summary,
  operatingCosts,
}: {
  summary: InventoryBusinessSummaryData;
  operatingCosts?: OperatingCostsSnapshot | null;
}) {
  const sold = summary.totalSoldUnits ?? 0;
  const grossRevenue = summary.totalGrossRevenue ?? summary.totalEstimatedRevenue ?? 0;
  const grossProfit = summary.totalGrossProfit ?? summary.totalEstimatedProfit ?? 0;
  const grossCost = summary.totalGrossCostOfSales ?? 0;
  const margin =
    summary.overallMarginPercent ??
    (grossRevenue > 0 ? Math.round((grossProfit / grossRevenue) * 100) : null);
  const stockAtCost = summary.totalInventoryValue ?? 0;
  const stockAtMrp = summary.totalSaleValueOnHand ?? 0;
  const opexYtd = operatingCosts?.yearTotal ?? 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3 px-1">
        <div>
          <h2 className="text-sm font-bold text-navy-900">Catalog snapshot</h2>
          <p className="text-xs text-gray-500 max-w-xl">
            Sold / revenue / profit from product <strong>soldCount × MRP/cost</strong>. For cash from
            orders use{' '}
            <Link href="/admin/revenue" className="text-brand-600 font-semibold hover:underline">
              Revenue
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {sold > 0 && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
              {summary.productsWithSales ?? 0} products with sales
            </span>
          )}
          <Link
            href="/admin/expenses"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:border-brand-300 shadow-sm"
          >
            <Receipt className="h-3.5 w-3.5 text-brand-600" />
            Operating costs
            {opexYtd > 0 && (
              <span className="text-red-600 tabular-nums">· {formatPrice(opexYtd)} YTD</span>
            )}
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <PrimaryKpi
          label="Units sold (catalog)"
          sublabel="Lifetime soldCount on products"
          value={sold.toLocaleString('en-IN')}
          icon={ShoppingBag}
          accent="bg-navy-100 text-navy-700"
        />
        <PrimaryKpi
          label="Est. gross revenue"
          sublabel="Sold × MRP per product"
          value={formatPrice(grossRevenue)}
          icon={IndianRupee}
          accent="bg-brand-100 text-brand-700"
        />
        <PrimaryKpi
          label="Est. gross profit"
          sublabel="Revenue − COGS (catalog)"
          value={formatPrice(grossProfit)}
          icon={TrendingUp}
          accent="bg-emerald-100 text-emerald-700"
        />
        <PrimaryKpi
          label="Catalog margin"
          sublabel="Gross profit ÷ est. revenue"
          value={margin != null && grossRevenue > 0 ? `${margin}%` : '—'}
          icon={Percent}
          accent="bg-purple-100 text-purple-700"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto flex">
        <SecondaryStat
          label="Active SKUs"
          value={summary.totalProducts.toLocaleString('en-IN')}
          hint={`${summary.totalUnits.toLocaleString('en-IN')} pcs in stock`}
        />
        <SecondaryStat
          label="Stock @ cost"
          value={formatPrice(stockAtCost)}
          hint="Godown investment"
          className="text-purple-700"
        />
        <SecondaryStat
          label="Stock @ MRP"
          value={formatPrice(stockAtMrp)}
          hint="If all stock sells"
          className="text-blue-700"
        />
        <SecondaryStat
          label="COGS (sold)"
          value={formatPrice(grossCost)}
          hint="Cost of sold units"
          className="text-gray-700"
        />
        <SecondaryStat
          label="Alerts"
          value={`${summary.lowStock} low · ${summary.outOfStock} out`}
          hint="Needs reorder"
          className="text-amber-700"
        />
        {opexYtd > 0 && (
          <SecondaryStat
            label="Operating costs"
            value={formatPrice(opexYtd)}
            hint={`${formatPrice(operatingCosts?.monthToDateTotal ?? 0)} this month · separate log`}
            className="text-red-700"
          />
        )}
      </div>
    </div>
  );
}
