'use client';

import Link from 'next/link';
import {
  ShoppingBag,
  IndianRupee,
  TrendingUp,
  Percent,
  ArrowUpRight,
  Receipt,
  Info,
  Minus,
  Equal,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';
import MetricTooltip from '@/components/admin/inventory/MetricTooltip';
import { INVENTORY_METRIC_NOTES, summaryTooltipLines } from '@/lib/inventoryMetrics';

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
  period?: string;
  periodLabel?: string;
  costMethod?: string;
  missingCostSkus?: number;
  missingCostTotalSkus?: number;
  periodLinesMissingCost?: number;
  periodOrderLines?: number;
  reorderSuggestions?: ReorderItem[];
}

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
  tooltip,
}: {
  label: string;
  sublabel: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  tooltip?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col min-h-[108px] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group overflow-visible">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide inline-flex items-center gap-1">
            {label}
            {tooltip}
          </p>
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
  tooltip,
}: {
  label: string;
  value: string;
  hint?: string;
  className?: string;
  tooltip?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col justify-center px-4 py-3 min-w-[110px] flex-1 basis-[140px] hover:bg-gray-50/60 transition-colors">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide inline-flex items-center gap-1">
        {label}
        {tooltip}
      </p>
      <p className={cn('text-sm font-bold mt-0.5 tabular-nums', className ?? 'text-gray-800')}>{value}</p>
      {hint && <p className="text-[9px] text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function FlowMini({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'base' | 'minus' | 'result';
}) {
  const styles = {
    base: 'border-brand-200 bg-brand-50/60 text-gray-900',
    minus: 'border-red-200 bg-red-50/50 text-gray-900',
    result: 'border-emerald-200 bg-emerald-50/60 text-emerald-800',
  };
  return (
    <div className={cn('rounded-xl border px-3 py-2 min-w-[7rem] flex-1', styles[tone])}>
      <p className="text-[9px] font-bold uppercase text-gray-500">{label}</p>
      <p className="text-sm font-bold tabular-nums mt-0.5">{value}</p>
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
  const isPeriod = Boolean(summary.period && summary.period !== 'lifetime');

  const tips = summaryTooltipLines({
    sold,
    grossRevenue,
    grossCost,
    grossProfit,
    margin,
    stockAtCost,
    stockAtMrp,
  });

  const infoIcon = (
    <Info className="h-3 w-3 text-gray-300 group-hover:text-brand-500 transition-colors shrink-0" />
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3 px-1">
        <div>
          <h2 className="text-sm font-bold text-navy-900">Catalog snapshot</h2>
          <p className="text-xs text-gray-500 max-w-xl">
            {summary.period && summary.period !== 'lifetime' ? (
              <>
                Sales &amp; profit for <strong>{summary.periodLabel}</strong> from paid orders
                (website + offline/POS). Stock values are current snapshot.
              </>
            ) : (
              <>
                Sold / revenue / profit from catalog <strong>soldCount × MRP/cost</strong> (per SKU).
                Hover any metric for the full formula.
              </>
            )}{' '}
            For cash from orders use{' '}
            <Link href="/admin/revenue" className="text-brand-600 font-semibold hover:underline">
              Revenue
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {summary.costMethod === 'weighted_average' && (
            <span className="text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-full">
              WAC costing
            </span>
          )}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 overflow-visible">
        <PrimaryKpi
          label={isPeriod ? 'Units sold' : 'Units sold (lifetime)'}
          sublabel={isPeriod ? 'Paid orders in selected period' : 'Sum of per-SKU soldCount'}
          value={sold.toLocaleString('en-IN')}
          icon={ShoppingBag}
          accent="bg-navy-100 text-navy-700"
          tooltip={
            <MetricTooltip
              title="Units sold"
              lines={tips.unitsSold}
              note={INVENTORY_METRIC_NOTES.productLevelSales}
            >
              {infoIcon}
            </MetricTooltip>
          }
        />
        <PrimaryKpi
          label={isPeriod ? 'Gross revenue' : 'Est. gross revenue'}
          sublabel={isPeriod ? 'Actual paid line totals' : 'Units sold × avg MRP (catalog)'}
          value={formatPrice(grossRevenue)}
          icon={IndianRupee}
          accent="bg-brand-100 text-brand-700"
          tooltip={
            <MetricTooltip
              title="Est. gross revenue"
              lines={tips.grossRevenue}
              note={INVENTORY_METRIC_NOTES.estMeaning}
            >
              {infoIcon}
            </MetricTooltip>
          }
        />
        <PrimaryKpi
          label={isPeriod ? 'Gross profit' : 'Est. gross profit'}
          sublabel={isPeriod ? 'Revenue − COGS (orders)' : 'Est. revenue − cost of sold units'}
          value={formatPrice(grossProfit)}
          icon={TrendingUp}
          accent="bg-emerald-100 text-emerald-700"
          tooltip={
            <MetricTooltip
              title="Est. gross profit"
              lines={tips.grossProfit}
              note={INVENTORY_METRIC_NOTES.avgCost}
            >
              {infoIcon}
            </MetricTooltip>
          }
        />
        <PrimaryKpi
          label="Catalog margin"
          sublabel="Gross profit ÷ est. revenue"
          value={margin != null && grossRevenue > 0 ? `${margin}%` : '—'}
          icon={Percent}
          accent="bg-purple-100 text-purple-700"
          tooltip={
            <MetricTooltip title="Catalog margin" lines={tips.margin}>
              {infoIcon}
            </MetricTooltip>
          }
        />
      </div>

      {/* Profit flow breakdown — mirrors Revenue page style */}
      {sold > 0 && (
        <div className="rounded-[1.25rem] border border-gray-200/80 bg-white/80 backdrop-blur-sm p-4 shadow-sm overflow-visible">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
            {isPeriod ? 'Profit flow (orders)' : 'Catalog profit flow'}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <FlowMini label={isPeriod ? 'Revenue' : 'Est. revenue'} value={formatPrice(grossRevenue)} tone="base" />
            <div className="flex items-center text-gray-300 px-0.5 shrink-0">
              <Minus className="h-3.5 w-3.5" />
            </div>
            <FlowMini label="COGS (sold)" value={formatPrice(grossCost)} tone="minus" />
            <div className="flex items-center text-gray-300 px-0.5 shrink-0">
              <Equal className="h-3.5 w-3.5" />
            </div>
            <FlowMini label="Gross profit" value={formatPrice(grossProfit)} tone="result" />
            {margin != null && grossRevenue > 0 && (
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-1 rounded-full shrink-0">
                {margin}% margin
              </span>
            )}
          </div>
          {!isPeriod && (
            <p className="text-[10px] text-gray-400 mt-2.5 leading-relaxed">
              <strong>Est.</strong> = catalog estimate from units already sold × list price/cost — not a future forecast.
              Actual cash is on the{' '}
              <Link href="/admin/revenue" className="text-brand-600 font-semibold hover:underline">
                Revenue
              </Link>{' '}
              page.
            </p>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-visible">
        <div className="flex flex-wrap divide-x divide-gray-100">
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
          tooltip={
            <MetricTooltip title="Stock @ cost" lines={tips.stockAtCost} note={INVENTORY_METRIC_NOTES.variantStock}>
              {infoIcon}
            </MetricTooltip>
          }
        />
        <SecondaryStat
          label="Stock @ MRP"
          value={formatPrice(stockAtMrp)}
          hint="If all stock sells"
          className="text-blue-700"
          tooltip={
            <MetricTooltip title="Stock @ MRP" lines={tips.stockAtMrp} note={INVENTORY_METRIC_NOTES.effectiveSellPrice}>
              {infoIcon}
            </MetricTooltip>
          }
        />
        <SecondaryStat
          label="COGS (sold)"
          value={formatPrice(grossCost)}
          hint="Cost of sold units"
          className="text-gray-700"
          tooltip={
            <MetricTooltip title="COGS on sold units" lines={tips.grossProfit.slice(1, 2)}>
              {infoIcon}
            </MetricTooltip>
          }
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
    </div>
  );
}
