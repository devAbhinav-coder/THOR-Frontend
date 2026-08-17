'use client';

import { useState, useCallback, useEffect } from 'react';
import OrderLineThumbnail from '@/components/orders/OrderLineThumbnail';
import {
  Package, RefreshCw, Search, Download,
  ChevronDown, ChevronRight, Pencil, X as XIcon,
} from 'lucide-react';
import { inventoryApi, operatingExpensesApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { LOW_STOCK_ALERT_EXCLUSIVE_MAX } from '@/lib/inventoryConstants';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import InventoryBusinessSummary, {
  type InventoryBusinessSummaryData,
  type OperatingCostsSnapshot,
} from './InventoryBusinessSummary';
import MetricTooltip from '@/components/admin/inventory/MetricTooltip';
import PeriodToolbar from '@/components/admin/shared/PeriodToolbar';
import MissingCostBanner from '@/components/admin/inventory/MissingCostBanner';
import ReorderSuggestionsPanel, {
  type ReorderItem,
} from '@/components/admin/inventory/ReorderSuggestionsPanel';
import {
  formatTurnover,
  INVENTORY_METRIC_NOTES,
  productRowTooltipLines,
} from '@/lib/inventoryMetrics';
import { downloadCsv } from '@/lib/csvExport';
import type { RevenuePeriod } from '@/lib/revenuePeriod';
import { Info } from 'lucide-react';
import {
  formatSellPriceRange,
  variantCatalogMrp,
  variantCatalogSellPrice,
  variantPriceOverridesBase,
} from '@/lib/productPricing';

interface Variant {
  sku: string;
  size?: string;
  color?: string;
  stock: number;
  price?: number;
  costPrice?: number;
  soldCount?: number;
  periodRevenue?: number;
  periodProfit?: number;
  missingCost?: boolean;
}

interface InventoryProduct {
  _id: string;
  name: string;
  category: string;
  fabric?: string;
  images: { url: string }[];
  variants: Variant[];
  totalStock: number;
  soldCount: number;
  price: number;
  comparePrice?: number;
  turnover: number | null;
  avgCost?: number;
  stockValue?: number;
  grossRevenue?: number;
  grossCostOfSales?: number;
  grossProfit?: number;
  estimatedRevenue?: number;
  estimatedCost?: number;
  estimatedProfit?: number;
  marginPercent?: number | null;
  effectiveSellPrice?: number;
  hasVariantPriceSpread?: boolean;
  isPeriodView?: boolean;
  lifetimeSoldCount?: number;
  variantsMissingCost?: number;
}

const REASONS = [
  { value: 'purchase', label: 'Purchase / Received' },
  { value: 'sale_return', label: 'Sale Return' },
  { value: 'damage', label: 'Damage / Loss' },
  { value: 'manual_correction', label: 'Manual Correction' },
  { value: 'opening_stock', label: 'Opening Stock' },
];

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Out</span>;
  if (stock < LOW_STOCK_ALERT_EXCLUSIVE_MAX) return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{stock} low</span>;
  return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{stock}</span>;
}

function AdjustModal({
  product, variant, onClose, onSaved,
}: {
  product: InventoryProduct;
  variant: Variant;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [delta, setDelta] = useState('');
  const [costPrice, setCostPrice] = useState(String(variant.costPrice || ''));
  const [price, setPrice] = useState(String(variant.price || product.price || ''));
  const [reason, setReason] = useState('manual_correction');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handle = async () => {
    const d = parseInt(delta, 10) || 0;
    const cp = parseFloat(costPrice);
    const p = parseFloat(price);

    if (d === 0 && isNaN(cp) && isNaN(p)) {
      toast.error('Enter a stock change or update a price');
      return;
    }

    setSaving(true);
    try {
      await inventoryApi.adjustStock(product._id, variant.sku, { 
        delta: d, 
        reason, 
        note: note || undefined,
        costPrice: isNaN(cp) ? undefined : cp,
        price: isNaN(p) ? undefined : p
      });
      toast.success('Stock & pricing updated');
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Adjust Stock</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><XIcon className="h-4 w-4" /></button>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-sm">
          <p className="font-semibold text-gray-900">{product.name}</p>
          <p className="text-gray-500 text-xs mt-0.5">SKU: {variant.sku} · Current stock: {variant.stock}</p>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Stock Delta (+/-)</label>
              <input
                type="number"
                value={delta}
                onChange={e => setDelta(e.target.value)}
                placeholder="e.g. +10"
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none bg-gray-50/30"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Reason</label>
              <select
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                {REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block text-brand-600">Unit Cost ₹</label>
              <input
                type="number"
                step="0.01"
                value={costPrice}
                onChange={e => setCostPrice(e.target.value)}
                placeholder="0.00"
                className="w-full h-10 px-3 rounded-xl border border-brand-100 text-sm font-bold text-brand-900 focus:ring-2 focus:ring-brand-500 focus:outline-none bg-brand-50/20"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block text-navy-600">Selling Price ₹</label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full h-10 px-3 rounded-xl border border-navy-100 text-sm font-bold text-navy-900 focus:ring-2 focus:ring-navy-500 focus:outline-none bg-navy-50/10"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Adjustment Note</label>
            <input
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Correcting cost after invoice"
              className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>Cancel</Button>
          <Button variant="brand" className="flex-1 rounded-xl" onClick={handle} disabled={saving}>
            {saving ? 'Saving…' : 'Apply'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function marginColor(pct: number) {
  if (pct >= 30) return 'text-emerald-600';
  if (pct >= 15) return 'text-blue-600';
  if (pct > 0) return 'text-amber-600';
  return 'text-red-600';
}

function VariantBreakdownPanel({
  product,
  onAdjust,
}: {
  product: InventoryProduct;
  onAdjust: (v: Variant) => void;
}) {
  const periodView = Boolean(product.isPeriodView);

  return (
    <div className="rounded-xl border border-brand-200/80 bg-white shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-brand-50/60 border-b border-brand-100">
        <p className="text-[11px] font-bold text-brand-800 uppercase tracking-wide">
          Variant / SKU details
        </p>
        <p className="text-[10px] text-gray-500">
          {periodView ?
            'Per-SKU sold · sell · cost · period revenue/profit from orders'
          : 'Per-SKU soldCount · size / color / stock / cost / margin'}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[520px]">
          <thead>
            <tr className="bg-gray-50 text-[10px] text-gray-500 uppercase tracking-wide">
              <th className="text-left px-4 py-2">Variant</th>
              <th className="text-left px-4 py-2">SKU</th>
              <th className="text-right px-4 py-2">Stock</th>
              <th className="text-right px-4 py-2">Sold</th>
              <th className="text-right px-4 py-2">Sell</th>
              <th className="text-right px-4 py-2">MRP</th>
              <th className="text-right px-4 py-2">Cost</th>
              {periodView ?
                <>
                  <th className="text-right px-4 py-2">Revenue</th>
                  <th className="text-right px-4 py-2">Profit</th>
                </>
              : null}
              {!periodView ?
                <th className="text-right px-4 py-2">Margin</th>
              : null}
              <th className="text-right px-4 py-2">Stock value</th>
              <th className="text-right px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {product.variants.map(v => {
              const varLabel = [v.size, v.color].filter(Boolean).join(' / ') || 'Default';
              const sell = variantCatalogSellPrice(v, product.price);
              const mrp = variantCatalogMrp(v, product);
              const cost = v.costPrice;
              const varMargin =
                !periodView && cost != null && sell > 0
                  ? Math.round(((sell - cost) / sell) * 100)
                  : null;
              const stockValue = (cost ?? 0) * v.stock;
              const sellOverride = variantPriceOverridesBase(v, product.price);
              const skuSold = v.soldCount ?? 0;
              const skuRevenue = periodView ? v.periodRevenue : undefined;
              const skuProfit = periodView ? v.periodProfit : undefined;

              return (
                <tr key={v.sku} className="hover:bg-gray-50/80">
                  <td className="px-4 py-2.5 font-medium text-gray-800">{varLabel}</td>
                  <td className="px-4 py-2.5 font-mono text-gray-500 text-[11px]">{v.sku}</td>
                  <td className="px-4 py-2.5 text-right">
                    <StockBadge stock={v.stock} />
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-navy-800">
                    {skuSold}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-gray-900">
                    {formatPrice(sell)}
                    {sellOverride && (
                      <p className="text-[9px] font-normal text-brand-600">variant price</p>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray-500">
                    {mrp != null ?
                      <span className="line-through">{formatPrice(mrp)}</span>
                    : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {cost != null ? (
                      <span className="font-semibold text-brand-800">{formatPrice(cost)}</span>
                    ) : (
                      <span className="text-amber-600 font-bold text-[10px]">Not set</span>
                    )}
                  </td>
                  {periodView ?
                    <>
                      <td className="px-4 py-2.5 text-right font-semibold text-brand-800">
                        {skuSold > 0 && skuRevenue != null ?
                          formatPrice(skuRevenue)
                        : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-emerald-700">
                        {skuSold > 0 && skuProfit != null ?
                          formatPrice(skuProfit)
                        : <span className="text-gray-300">—</span>}
                      </td>
                    </>
                  : null}
                  {!periodView ?
                    <td className="px-4 py-2.5 text-right">
                      {varMargin != null ? (
                        <span className={cn('font-bold', marginColor(varMargin))}>{varMargin}%</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  : null}
                  <td className="px-4 py-2.5 text-right text-gray-700">
                    {cost != null ? formatPrice(stockValue) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); onAdjust(v); }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:bg-brand-50 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      <Pencil className="h-3 w-3" /> Adjust
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductRow({
  product,
  onAdjust,
}: {
  product: InventoryProduct;
  onAdjust: (v: Variant) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const img = product.images[0]?.url;
  const sold = product.soldCount ?? 0;
  const hasSales = sold > 0;

  const variantWithCost = product.variants.find(
    v => v.costPrice !== undefined && v.costPrice !== null,
  );
  const fallbackMargin = variantWithCost
    ? Math.round(
        (((variantWithCost.price ?? product.price) - (variantWithCost.costPrice ?? 0)) /
          (variantWithCost.price ?? product.price)) *
          100,
      )
    : null;
  const marginPct = product.marginPercent ?? fallbackMargin;
  const turnoverLabel = formatTurnover(product.turnover);
  const rowTips = productRowTooltipLines(product);
  const infoIcon = (
    <Info className="h-3 w-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
  );

  const toggle = () => setExpanded(v => !v);

  return (
    <>
      <tr
        className={cn(
          'group hover:bg-gray-50 transition-colors cursor-pointer',
          expanded && 'bg-brand-50/20',
        )}
        onClick={toggle}
        aria-expanded={expanded}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 flex-shrink-0" style={{ aspectRatio: '3/4' }}>
              <OrderLineThumbnail
                image={img}
                name={product.name}
                className="h-full w-full rounded-lg"
                sizes="36px"
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate max-w-[220px]">{product.name}</p>
              <p className="text-xs text-gray-400">
                {product.category}
                {product.fabric ? ` · ${product.fabric}` : ''}
              </p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">
          <button
            type="button"
            onClick={e => { e.stopPropagation(); toggle(); }}
            className="text-left hover:text-brand-700 underline-offset-2 hover:underline"
          >
            {product.variants.length} SKU
            <span className="block text-[10px] text-gray-400 font-normal mt-0.5">
              {expanded ? 'Hide detail' : 'View detail'}
            </span>
          </button>
        </td>
        <td className="px-4 py-3 text-center"><StockBadge stock={product.totalStock} /></td>
        <td className="px-4 py-3 text-center">
          <p className="text-sm font-bold text-navy-900">{sold}</p>
          <p className="text-[9px] text-gray-400">pieces</p>
        </td>
        <td className="px-4 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap">
          <div className="text-right">
            {formatSellPriceRange(product)}
            {product.hasVariantPriceSpread && (
              <p className="text-[9px] text-brand-600 font-normal">
                per SKU prices differ
              </p>
            )}
            {product.comparePrice != null && product.comparePrice > product.price && (
              <p className="text-[9px] text-gray-400 line-through font-normal">
                MRP {formatPrice(product.comparePrice)}
              </p>
            )}
          </div>
        </td>
        <td className="px-4 py-3 text-right text-xs whitespace-nowrap">
          {hasSales ? (
            <MetricTooltip
              title={`${product.name} — revenue`}
              lines={rowTips.slice(0, 4)}
              note={INVENTORY_METRIC_NOTES.productLevelSales}
              align="right"
            >
              <div className="inline-flex flex-col items-end cursor-help">
                <p className="font-bold text-brand-800 inline-flex items-center gap-1">
                  {formatPrice(product.grossRevenue ?? product.estimatedRevenue ?? 0)}
                  {infoIcon}
                </p>
                <p className="text-[9px] text-gray-400">gross revenue</p>
              </div>
            </MetricTooltip>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </td>
        <td className="px-4 py-3 text-right text-xs whitespace-nowrap">
          {hasSales ? (
            <MetricTooltip
              title={`${product.name} — COGS`}
              lines={rowTips.slice(2, 5)}
              note={INVENTORY_METRIC_NOTES.avgCost}
              align="right"
            >
              <div className="inline-flex flex-col items-end cursor-help">
                <p className="font-semibold text-gray-600 inline-flex items-center gap-1">
                  {formatPrice(product.grossCostOfSales ?? product.estimatedCost ?? 0)}
                  {infoIcon}
                </p>
                <p className="text-[9px] text-gray-400">COGS</p>
              </div>
            </MetricTooltip>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </td>
        <td className="px-4 py-3 text-right text-xs whitespace-nowrap">
          {hasSales ? (
            <MetricTooltip
              title={`${product.name} — profit`}
              lines={rowTips}
              note={INVENTORY_METRIC_NOTES.catalogVsOrders}
              align="right"
            >
              <div className="inline-flex flex-col items-end cursor-help">
                <p
                  className={cn(
                    'font-bold text-sm inline-flex items-center gap-1',
                    (product.grossProfit ?? product.estimatedProfit ?? 0) >= 0
                      ? 'text-emerald-600'
                      : 'text-red-600',
                  )}
                >
                  {formatPrice(product.grossProfit ?? product.estimatedProfit ?? 0)}
                  {infoIcon}
                </p>
                <p className="text-[9px] text-gray-400">gross profit</p>
              </div>
            </MetricTooltip>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </td>
        <td className="px-4 py-3 text-center">
          {turnoverLabel === 'Sold out' ? (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md inline-block bg-navy-100 text-navy-700 uppercase tracking-tighter">
              Sold out
            </span>
          ) : (
            <MetricTooltip
              title="Inventory velocity"
              lines={[
                { label: 'Sold', value: String(sold) },
                { label: 'In stock', value: String(product.totalStock) },
                { label: 'Turnover', value: turnoverLabel, highlight: true },
              ]}
              note="soldCount ÷ current stock. Higher = faster moving."
              align="center"
            >
              <span
                className={cn(
                  'text-[10px] font-bold px-1.5 py-0.5 rounded-md inline-block uppercase tracking-tighter cursor-help',
                  (product.turnover ?? 0) >= 2
                    ? 'bg-emerald-100 text-emerald-700'
                    : (product.turnover ?? 0) >= 1
                      ? 'bg-blue-100 text-blue-700'
                      : (product.turnover ?? 0) >= 0.5
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-500',
                )}
              >
                {turnoverLabel}
              </span>
            </MetricTooltip>
          )}
        </td>
        <td className="px-4 py-3 text-right text-xs">
          {marginPct != null ? (
            <MetricTooltip
              title={`${product.name} — margin`}
              lines={[
                {
                  label: 'Sell price used',
                  value: formatSellPriceRange(product),
                },
                {
                  label: 'Avg cost',
                  value: product.avgCost ? formatPrice(product.avgCost) : 'Not set',
                },
                { label: 'Margin', value: `${marginPct}%`, highlight: true },
              ]}
              note="(Sell − avg cost) ÷ sell. Per-variant margins in SKU detail below."
              align="right"
            >
              <div className="inline-flex flex-col items-end cursor-help">
                <span className={cn('font-bold text-sm inline-flex items-center gap-1', marginColor(marginPct))}>
                  {marginPct}%
                  {infoIcon}
                </span>
                {product.avgCost != null && product.avgCost > 0 && (
                  <p className="text-[9px] text-gray-400 mt-0.5">avg cost {formatPrice(product.avgCost)}</p>
                )}
              </div>
            </MetricTooltip>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </td>
        <td className="px-4 py-3 text-right text-gray-400">
          {expanded ? (
            <ChevronDown className="h-4 w-4 inline" />
          ) : (
            <ChevronRight className="h-4 w-4 inline" />
          )}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-brand-50/30">
          <td colSpan={11} className="px-4 py-3 pl-14">
            <VariantBreakdownPanel product={product} onAdjust={onAdjust} />
          </td>
        </tr>
      )}
    </>
  );
}

export default function InventoryStockTab() {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [summary, setSummary] = useState<InventoryBusinessSummaryData | null>(null);
  const [operatingCosts, setOperatingCosts] = useState<OperatingCostsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('-sold');
  const [period, setPeriod] = useState<RevenuePeriod>('lifetime');
  const [year, setYear] = useState(new Date().getFullYear());
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [adjustTarget, setAdjustTarget] = useState<{ p: InventoryProduct; v: Variant } | null>(null);

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const load = useCallback(async (
    p = 1,
    s = search,
    f = filter,
    sortBy = sort,
    periodVal = period,
    yearVal = year,
  ) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: p,
        limit: 20,
        filter: f,
        sort: sortBy,
        period: periodVal,
      };
      if (s) params.search = s;
      if (periodVal === 'year') params.year = yearVal;
      if (periodVal === 'month') params.month = new Date().getMonth() + 1;

      const [res, opexRes] = await Promise.all([
        inventoryApi.getOverview(params),
        operatingExpensesApi.getSummary({
          year: periodVal === 'year' ? yearVal : new Date().getFullYear(),
        }),
      ]);
      setProducts((res.data as { products?: InventoryProduct[] }).products ?? []);
      setSummary((res.data as { summary?: InventoryBusinessSummaryData }).summary ?? null);
      const opex = (opexRes.data as { summary?: { yearTotal?: number; monthToDateTotal?: number } }).summary;
      setOperatingCosts(
        opex
          ? { yearTotal: opex.yearTotal ?? 0, monthToDateTotal: opex.monthToDateTotal ?? 0 }
          : null,
      );
      setTotalPages(res.pagination?.totalPages ?? 1);
      setTotal(res.pagination?.total ?? 0);
      setPage(p);
    } catch {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [search, filter, sort, period, year]);

  useEffect(() => {
    load(1, search, filter, sort, period, year);
  }, [period, year, load]);

  const handleSearch = (v: string) => {
    setSearch(v);
    load(1, v, filter, sort, period, year);
  };
  const handleFilter = (f: string) => {
    setFilter(f);
    load(1, search, f, sort, period, year);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await inventoryApi.exportRows();
      const rows = (res.data as { rows?: Record<string, unknown>[] }).rows ?? [];
      downloadCsv(
        `inventory-export-${new Date().toISOString().slice(0, 10)}.csv`,
        [
          'Product',
          'Category',
          'SKU',
          'Size',
          'Color',
          'Stock',
          'List price',
          'Cost',
          'Sold (SKU)',
          'Sold (Product)',
          'HSN',
          'Stock Value',
        ],
        rows.map((r) => [
          r.productName,
          r.category,
          r.sku,
          r.size,
          r.color,
          r.stock,
          r.mrp,
          r.costPrice,
          r.soldCountSku,
          r.soldCountProduct,
          r.hsnCode,
          r.stockValue,
        ]),
      );
      toast.success(`Exported ${rows.length} SKU rows`);
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const reorderItems = (summary?.reorderSuggestions ?? []) as ReorderItem[];

  return (
    <div className="space-y-5">
      <PeriodToolbar
        period={period}
        year={year}
        years={years}
        periodLabel={summary?.periodLabel}
        onPeriodChange={setPeriod}
        onYearChange={setYear}
      />

      {summary && (
        <MissingCostBanner
          missingSkus={summary.missingCostSkus ?? 0}
          totalSkus={summary.missingCostTotalSkus ?? 0}
          periodLinesMissingCost={summary.periodLinesMissingCost}
          periodOrderLines={summary.periodOrderLines}
          onFilterMissingCost={() => handleFilter('missing_cost')}
        />
      )}

      {summary && <InventoryBusinessSummary summary={summary} operatingCosts={operatingCosts} />}

      {reorderItems.length > 0 && <ReorderSuggestionsPanel items={reorderItems} />}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search product, SKU…"
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {([
              { id: 'all', label: 'All' },
              { id: 'sold', label: 'With sales' },
              { id: 'low', label: 'Low stock' },
              { id: 'out', label: 'Out of stock' },
              { id: 'missing_cost', label: 'Missing cost' },
            ] as const).map(f => (
              <button
                key={f.id}
                onClick={() => handleFilter(f.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                  filter === f.id
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-brand-300'
                }`}
              >
                {f.label}
              </button>
            ))}
            <select
              value={sort}
              onChange={e => { setSort(e.target.value); load(1, search, filter, e.target.value, period, year); }}
              className="h-10 px-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700"
            >
              <option value="-sold">Best sellers first</option>
              <option value="-updatedAt">Recently updated</option>
              <option value="-stock">Stock high → low</option>
              <option value="stock">Stock low → high</option>
              <option value="name">Name A–Z</option>
              <option value="-name">Name Z–A</option>
              <option value="category">Category</option>
            </select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl h-10 gap-1.5"
              disabled={exporting}
              onClick={handleExport}
            >
              <Download className="h-3.5 w-3.5" />
              {exporting ? 'Export…' : 'CSV'}
            </Button>
            <button
              type="button"
              onClick={() => load(page, search, filter, sort, period, year)}
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50"
            >
              <RefreshCw className={`h-4 w-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm table-fixed">
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[8%]" />
              <col className="w-[7%]" />
              <col className="w-[7%]" />
              <col className="w-[8%]" />
              <col className="w-[10%]" />
              <col className="w-[9%]" />
              <col className="w-[10%]" />
              <col className="w-[8%]" />
              <col className="w-[8%]" />
              <col className="w-[3%]" />
            </colgroup>
            <thead>
              <tr className="bg-gray-50 text-[10px] text-gray-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3">Product</th>
                <th className="text-left px-4 py-3">SKU</th>
                <th className="text-center px-4 py-3">Stock</th>
                <th className="text-center px-4 py-3">Sold</th>
                <th className="text-right px-4 py-3">Sell price</th>
                <th className="text-right px-4 py-3">Gross revenue</th>
                <th className="text-right px-4 py-3">COGS</th>
                <th className="text-right px-4 py-3">Gross profit</th>
                <th className="text-center px-4 py-3">Velocity</th>
                <th className="text-right px-4 py-3">Margin</th>
                <th className="px-2 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={11} className="px-4 py-3">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-16 text-center">
                    <Package className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No products found</p>
                  </td>
                </tr>
              ) : (
                products.map(p => (
                  <ProductRow
                    key={p._id}
                    product={p}
                    onAdjust={v => setAdjustTarget({ p, v })}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Adjust Modal (Outside table to fix nesting errors) */}
        {adjustTarget && (
          <AdjustModal
            product={adjustTarget.p}
            variant={adjustTarget.v}
            onClose={() => setAdjustTarget(null)}
            onSaved={() => load(page, search, filter)}
          />
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">Page {page} of {totalPages} · {total} products</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-lg" disabled={page <= 1} onClick={() => load(page - 1)}>Prev</Button>
              <Button variant="outline" size="sm" className="rounded-lg" disabled={page >= totalPages} onClick={() => load(page + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
