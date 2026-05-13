'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import {
  Package, AlertCircle, RefreshCw, TrendingDown, Search,
  ChevronDown, ChevronRight, Pencil, Check, X as XIcon,
} from 'lucide-react';
import { inventoryApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
interface Variant {
  sku: string;
  size?: string;
  color?: string;
  stock: number;
  price?: number;
  costPrice?: number;
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
  turnover: number;
}

interface Summary {
  totalProducts: number;
  totalUnits: number;
  outOfStock: number;
  lowStock: number;
  totalInventoryValue: number;
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
  if (stock < 3) return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{stock} low</span>;
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

function ProductRow({ 
  product, 
  onRefresh, 
  onAdjust 
}: { 
  product: InventoryProduct; 
  onRefresh: () => void;
  onAdjust: (v: Variant) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const img = product.images[0]?.url;
  
  // Find first variant with a cost price to show an indicative margin
  const variantWithCost = product.variants.find(v => v.costPrice !== undefined && v.costPrice !== null);
  const margin = variantWithCost
    ? Math.round(((variantWithCost.price ?? product.price) - (variantWithCost.costPrice ?? 0)) / (variantWithCost.price ?? product.price) * 100)
    : null;

  return (
    <>
      <tr
        className="hover:bg-gray-50 transition-colors cursor-pointer"
        onClick={() => setExpanded(v => !v)}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative w-9 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100" style={{ aspectRatio: '3/4' }}>
              {img && <Image src={img} alt={product.name} fill sizes="36px" className="object-cover" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">{product.name}</p>
              <p className="text-xs text-gray-400">{product.category}{product.fabric ? ` · ${product.fabric}` : ''}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">{product.variants.length} variant{product.variants.length !== 1 ? 's' : ''}</td>
        <td className="px-4 py-3"><StockBadge stock={product.totalStock} /></td>
        <td className="px-4 py-3 text-sm text-gray-700">{product.soldCount ?? 0}</td>
        <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatPrice(product.price)}</td>
        <td className="px-4 py-3">
          <div className="flex flex-col gap-1">
            <span className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded-md w-fit uppercase tracking-tighter",
              (product.turnover ?? 0) >= 2 ? "bg-emerald-100 text-emerald-700" : 
              (product.turnover ?? 0) >= 1 ? "bg-blue-100 text-blue-700" : 
              (product.turnover ?? 0) >= 0.5 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"
            )}>
              {(product.turnover ?? 0).toFixed(1)}x Velocity
            </span>
            <p className="text-[9px] text-gray-400 font-medium">Sales/Stock</p>
          </div>
        </td>
        <td className="px-4 py-3 text-xs">
          {margin !== null ? (
            <div className="flex flex-col">
              <span className={cn(
                "font-bold text-sm",
                margin >= 30 ? 'text-emerald-600' : 
                margin >= 15 ? 'text-blue-600' : 
                margin > 0 ? 'text-amber-600' : 'text-red-600'
              )}>
                {margin}%
              </span>
              <span className="text-[9px] text-gray-400 uppercase font-bold tracking-tighter">Margin</span>
            </div>
          ) : <span className="text-gray-400">—</span>}
        </td>
        <td className="px-4 py-3 text-right text-gray-400">
          {expanded ? <ChevronDown className="h-4 w-4 inline" /> : <ChevronRight className="h-4 w-4 inline" />}
        </td>
      </tr>
      {expanded && product.variants.map(v => {
        const varLabel = [v.size, v.color].filter(Boolean).join(' / ') || v.sku;
        const varMargin = v.costPrice && (v.price ?? product.price)
          ? Math.round(((v.price ?? product.price) - v.costPrice) / (v.price ?? product.price) * 100)
          : null;
        return (
          <tr key={v.sku} className="bg-brand-50/30">
            <td className="px-4 py-2 pl-16" colSpan={1}>
              <span className="text-xs font-medium text-gray-700">{varLabel}</span>
              <span className="text-xs text-gray-400 ml-2">#{v.sku}</span>
            </td>
            <td className="px-4 py-2 text-xs text-gray-500">—</td>
            <td className="px-4 py-2"><StockBadge stock={v.stock} /></td>
            <td className="px-4 py-2 text-xs text-gray-500">—</td>
            <td className="px-4 py-2 text-xs text-gray-700">{v.price ? formatPrice(v.price) : '—'}</td>
            <td className="px-4 py-2 text-xs">
              {v.costPrice ? (
                <span className="text-gray-600">Cost: {formatPrice(v.costPrice)}{varMargin !== null ? ` · ${varMargin}%` : ''}</span>
              ) : <span className="text-gray-400">No cost set</span>}
            </td>
            <td className="px-4 py-2 text-right">
              <button
                onClick={e => { e.stopPropagation(); onAdjust(v); }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:bg-brand-50 px-2 py-1 rounded-lg transition-colors"
              >
                <Pencil className="h-3 w-3" /> Adjust
              </button>
            </td>
          </tr>
        );
      })}
    </>
  );
}

export default function InventoryStockTab() {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Lifted state for adjustment
  const [adjustTarget, setAdjustTarget] = useState<{ p: InventoryProduct; v: Variant } | null>(null);

  const load = useCallback(async (p = 1, s = search, f = filter) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: p, limit: 20, filter: f };
      if (s) params.search = s;
      const res = await inventoryApi.getOverview(params);
      setProducts((res.data as any).products ?? []);
      setSummary((res.data as any).summary ?? null);
      setTotalPages((res as any).pagination?.totalPages ?? 1);
      setTotal((res as any).pagination?.total ?? 0);
      setPage(p);
    } catch { toast.error('Failed to load inventory'); }
    finally { setLoading(false); }
  }, [search, filter]);

  useEffect(() => { load(1, search, filter); }, []);

  const handleSearch = (v: string) => {
    setSearch(v);
    load(1, v, filter);
  };
  const handleFilter = (f: string) => {
    setFilter(f);
    load(1, search, f);
  };

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Total Products', value: summary.totalProducts.toLocaleString(), color: 'text-gray-900' },
            { label: 'Total Units', value: summary.totalUnits.toLocaleString(), color: 'text-blue-700' },
            { label: 'Out of Stock', value: summary.outOfStock.toLocaleString(), color: 'text-red-600' },
            { label: 'Low Stock', value: summary.lowStock.toLocaleString(), color: 'text-amber-600' },
            { label: 'Inventory Value', value: formatPrice(summary.totalInventoryValue), color: 'text-emerald-700' },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <p className="text-[11px] text-gray-500 uppercase tracking-wide">{c.label}</p>
              <p className={`text-xl font-bold mt-1 ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>
      )}

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
            {(['all', 'low', 'out'] as const).map(f => (
              <button
                key={f}
                onClick={() => handleFilter(f)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                  filter === f
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-brand-300'
                }`}
              >
                {f === 'all' ? 'All' : f === 'low' ? '⚠ Low Stock' : '🔴 Out of Stock'}
              </button>
            ))}
            <button
              onClick={() => load(page, search, filter)}
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50"
            >
              <RefreshCw className={`h-4 w-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3">Product</th>
                <th className="text-left px-4 py-3">Variants</th>
                <th className="text-left px-4 py-3">Stock</th>
                <th className="text-left px-4 py-3">Sold</th>
                <th className="text-left px-4 py-3">Price</th>
                <th className="text-left px-4 py-3">Turnover</th>
                <th className="text-left px-4 py-3">Margin</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-4 py-3">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <Package className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No products found</p>
                  </td>
                </tr>
              ) : (
                products.map(p => (
                  <ProductRow 
                    key={p._id} 
                    product={p} 
                    onRefresh={() => load(page, search, filter)} 
                    onAdjust={(v) => setAdjustTarget({ p, v })}
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
