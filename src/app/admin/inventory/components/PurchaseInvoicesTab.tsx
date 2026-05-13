'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Plus, Trash2, RefreshCw, FileText, CheckCircle, Clock, AlertCircle, X as XIcon,
} from 'lucide-react';
import { inventoryApi } from '@/lib/api';
import { formatDate, formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { Search } from 'lucide-react';
import Image from 'next/image';

interface LineItem {
  product?: string;
  productName: string;
  sku: string;
  variantLabel?: string;
  quantity: number;
  unitCost: number;
  hsn?: string;
  gstRate: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  lineTotal: number;
}

interface PurchaseInvoice {
  _id: string;
  invoiceNumber: string;
  supplierName: string;
  supplierGstin?: string;
  supplyType: 'intra' | 'inter';
  invoiceDate: string;
  lineItems: LineItem[];
  totalTaxable: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTax: number;
  grandTotal: number;
  paymentStatus: 'unpaid' | 'paid' | 'partial';
  paidAmount: number;
  notes?: string;
  createdAt: string;
}

interface SearchResult {
  _id: string;
  name: string;
  hsnCode?: string;
  variants: { sku: string; size?: string; color?: string; price?: number; costPrice?: number }[];
  images: { url: string }[];
}

function generateInvoiceNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `PUR-${date}-${rand}`;
}

function LineItemForm({ 
  line, 
  onUpdate, 
  onRemove 
}: { 
  line: LineItem; 
  onUpdate: (field: string, value: any) => void;
  onRemove?: () => void;
}) {
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedProd, setSelectedProd] = useState<SearchResult | null>(null);

  const search = async (val: string) => {
    setQuery(val);
    if (val.length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await inventoryApi.getOverview({ search: val, limit: 10 });
      setResults((res.data as any).products ?? []);
    } catch { /* ignore */ }
    finally { setSearching(false); }
  };

  const select = (prod: SearchResult, variant: any) => {
    onUpdate('product', prod._id);
    onUpdate('productName', prod.name);
    onUpdate('sku', variant.sku);
    onUpdate('variantLabel', [variant.size, variant.color].filter(Boolean).join(' / ') || 'Default');
    onUpdate('unitCost', variant.costPrice || variant.price || 0);
    if (prod.hsnCode) onUpdate('hsn', prod.hsnCode);
    setSelectedProd(prod);
    setShowSearch(false);
  };

  return (
    <div className="border border-gray-200 rounded-xl p-4 space-y-4 bg-gray-50/50 shadow-sm relative group">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative">
          <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Product Search / Name</label>
          <div className="relative">
            <input 
              placeholder="Start typing to search or enter manually..." 
              value={line.productName}
              onChange={e => { onUpdate('productName', e.target.value); if (!showSearch) setShowSearch(true); search(e.target.value); }}
              onFocus={() => setShowSearch(true)}
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white shadow-sm" 
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            
            {showSearch && (query.length >= 2 || results.length > 0) && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-64 overflow-y-auto">
                {searching && <div className="p-3 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                  <RefreshCw className="h-3 w-3 animate-spin" /> Searching Catalog...
                </div>}
                {!searching && results.length === 0 && <div className="p-3 text-center text-xs text-gray-500">No matching products found. Keep typing for manual entry.</div>}
                {results.map(p => (
                  <div key={p._id} className="border-b border-gray-50 last:border-0">
                    <div className="px-3 py-2 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2">
                      <div className="h-4 w-4 rounded overflow-hidden bg-gray-200 relative">
                        {p.images[0]?.url && <Image src={p.images[0].url} alt="" fill className="object-cover" />}
                      </div>
                      {p.name}
                    </div>
                    <div className="p-1 grid grid-cols-1 gap-0.5">
                      {p.variants.map(v => (
                        <button
                          key={v.sku}
                          onClick={() => select(p, v)}
                          className="text-left px-3 py-1.5 hover:bg-brand-50 rounded-md text-xs flex items-center justify-between group/v"
                        >
                          <span className="font-medium text-gray-700">
                            {[v.size, v.color].filter(Boolean).join(' / ') || 'Default Variant'}
                            <span className="text-[10px] text-gray-400 ml-2 font-normal">#{v.sku}</span>
                          </span>
                          <span className="text-[10px] font-bold text-brand-600 opacity-0 group-hover/v:opacity-100 transition-opacity">SELECT →</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {line.product && (
            <p className="text-[9px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
              <CheckCircle className="h-2.5 w-2.5" /> LINKED TO CATALOG
              <button onClick={() => { onUpdate('product', undefined); }} className="ml-1 text-gray-400 hover:text-red-500">Remove Link</button>
            </p>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">SKU / Variant</label>
            {line.product && selectedProd ? (
              <select 
                value={line.sku} 
                onChange={e => {
                  if (e.target.value === 'NEW') {
                    onUpdate('sku', '');
                    onUpdate('variantLabel', '');
                  } else {
                    const v = selectedProd.variants.find(v => v.sku === e.target.value);
                    if (v) {
                      onUpdate('sku', v.sku);
                      onUpdate('variantLabel', [v.size, v.color].filter(Boolean).join(' / ') || 'Default');
                    }
                  }
                }}
                className="w-full h-9 px-2 rounded-lg border border-gray-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white font-medium"
              >
                {selectedProd.variants.map(v => (
                  <option key={v.sku} value={v.sku}>
                    {v.sku} ({[v.size, v.color].filter(Boolean).join(' / ') || 'Default'})
                  </option>
                ))}
                <option value="NEW">+ Add New Variant SKU</option>
              </select>
            ) : (
              <input placeholder="SKU *" value={line.sku} onChange={e => onUpdate('sku', e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-gray-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white shadow-sm" />
            )}
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Label / HSN</label>
            <div className="grid grid-cols-2 gap-1">
              <input placeholder="Label" value={line.variantLabel || ''} onChange={e => onUpdate('variantLabel', e.target.value)}
                className="w-full h-9 px-2 rounded-lg border border-gray-200 text-[10px] focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white shadow-sm" />
              <input placeholder="HSN" value={line.hsn || ''} onChange={e => onUpdate('hsn', e.target.value)}
                className="w-full h-9 px-2 rounded-lg border border-gray-200 text-[10px] focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white shadow-sm" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 items-center pt-2 border-t border-gray-100">
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Quantity</label>
          <input type="number" min={1} value={line.quantity}
            onChange={e => onUpdate('quantity', Number(e.target.value))}
            className="w-full h-9 px-3 rounded-lg border border-gray-200 text-xs font-bold text-navy-900 focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Unit Cost ₹</label>
          <input type="number" min={0} step="0.01" value={line.unitCost}
            onChange={e => onUpdate('unitCost', Number(e.target.value))}
            className="w-full h-9 px-3 rounded-lg border border-gray-200 text-xs font-bold text-navy-900 focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">GST %</label>
          <select value={line.gstRate} onChange={e => onUpdate('gstRate', Number(e.target.value))}
            className="w-full h-9 px-3 rounded-lg border border-gray-200 text-xs font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white">
            {[0, 3, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
          </select>
        </div>
        <div className="text-xs">
          <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Taxable</p>
          <p className="font-bold text-gray-900">₹{line.taxableAmount.toFixed(2)}</p>
        </div>
        <div className="text-xs">
          <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Total GST</p>
          <p className="font-bold text-emerald-600">₹{(line.cgst + line.sgst + line.igst).toFixed(2)}</p>
        </div>
        <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-brand-100 shadow-inner">
          <div className="text-xs">
            <p className="text-[9px] font-bold text-brand-400 uppercase mb-0.5">Line Total</p>
            <p className="font-extrabold text-brand-700">₹{line.lineTotal.toFixed(2)}</p>
          </div>
          {onRemove && (
            <button onClick={onRemove}
              className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-lg text-gray-300 transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      
      {/* Click outside to close search */}
      {showSearch && <div className="fixed inset-0 z-0" onClick={() => setShowSearch(false)} />}
    </div>
  );
}

const EMPTY_LINE = (): LineItem => ({
  productName: '', sku: '', variantLabel: '', quantity: 1,
  unitCost: 0, hsn: '', gstRate: 18,
  taxableAmount: 0, cgst: 0, sgst: 0, igst: 0, lineTotal: 0,
});

function calcLine(q: number, cost: number, rate: number, supplyType: 'intra' | 'inter') {
  const taxable = Math.round(q * cost * 100) / 100;
  const gst = Math.round(taxable * rate / 100 * 100) / 100;
  const cgst = supplyType === 'intra' ? Math.round(gst / 2 * 100) / 100 : 0;
  const sgst = supplyType === 'intra' ? Math.round(gst / 2 * 100) / 100 : 0;
  const igst = supplyType === 'inter' ? gst : 0;
  return { taxableAmount: taxable, cgst, sgst, igst, lineTotal: taxable + gst };
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: 'bg-emerald-100 text-emerald-700',
    unpaid: 'bg-red-100 text-red-700',
    partial: 'bg-amber-100 text-amber-700',
  };
  const Icon = status === 'paid' ? CheckCircle : status === 'partial' ? Clock : AlertCircle;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${map[status] ?? 'bg-gray-100 text-gray-700'}`}>
      <Icon className="h-3 w-3" /> {status}
    </span>
  );
}

function CreateModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    invoiceNumber: generateInvoiceNumber(),
    supplierName: '',
    supplierGstin: '',
    supplyType: 'intra' as 'intra' | 'inter',
    invoiceDate: new Date().toISOString().slice(0, 10),
    paymentStatus: 'unpaid' as 'unpaid' | 'paid' | 'partial',
    paidAmount: 0,
    notes: '',
    updateCostPrice: true,
  });
  const [lines, setLines] = useState<LineItem[]>([EMPTY_LINE()]);
  const [saving, setSaving] = useState(false);

  const updateLine = (idx: number, field: keyof LineItem, value: string | number) => {
    setLines(prev => {
      const next = [...prev];
      const l = { ...next[idx]! } as any;
      l[field] = value;
      const calc = calcLine(Number(l.quantity), Number(l.unitCost), Number(l.gstRate), form.supplyType);
      next[idx] = { ...l, ...calc };
      return next;
    });
  };

  const totals = lines.reduce((a, l) => ({
    taxable: a.taxable + l.taxableAmount,
    cgst: a.cgst + l.cgst,
    sgst: a.sgst + l.sgst,
    igst: a.igst + l.igst,
    grand: a.grand + l.lineTotal,
  }), { taxable: 0, cgst: 0, sgst: 0, igst: 0, grand: 0 });

  const handle = async () => {
    if (!form.invoiceNumber || !form.supplierName || !form.invoiceDate) {
      toast.error('Fill in required fields');
      return;
    }
    setSaving(true);
    try {
      await inventoryApi.createPurchaseInvoice({
        ...form,
        lineItems: lines.map(l => ({
          product: l.product,
          productName: l.productName,
          sku: l.sku,
          variantLabel: l.variantLabel,
          quantity: l.quantity,
          unitCost: l.unitCost,
          hsn: l.hsn,
          gstRate: l.gstRate,
        })),
      });
      toast.success('Purchase invoice created & stock updated');
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create invoice');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">New Purchase Invoice</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><XIcon className="h-4 w-4" /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Supplier info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Invoice Number *', key: 'invoiceNumber', placeholder: 'INV-001' },
              { label: 'Supplier Name *', key: 'supplierName', placeholder: 'Supplier Co.' },
              { label: 'Supplier GSTIN', key: 'supplierGstin', placeholder: '22AAAAA0000A1Z5' },
              { label: 'Invoice Date *', key: 'invoiceDate', placeholder: '', type: 'date' },
            ].map(f => (
              <div key={f.key} className="relative">
                <label className="text-xs font-semibold text-gray-600 mb-1 block">{f.label}</label>
                <div className="relative">
                  <input
                    type={f.type || 'text'}
                    placeholder={f.placeholder}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  {f.key === 'invoiceNumber' && (
                    <button 
                      type="button" 
                      onClick={() => setForm(p => ({ ...p, invoiceNumber: generateInvoiceNumber() }))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-brand-600 transition-colors"
                      title="Regenerate Invoice Number"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Supply Type</label>
              <select
                value={form.supplyType}
                onChange={e => setForm(p => ({ ...p, supplyType: e.target.value as 'intra' | 'inter' }))}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="intra">Intra-State (CGST + SGST)</option>
                <option value="inter">Inter-State (IGST)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Payment Status</label>
              <select
                value={form.paymentStatus}
                onChange={e => setForm(p => ({ ...p, paymentStatus: e.target.value as any }))}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
              </select>
            </div>
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-gray-700">Line Items</h4>
                <p className="text-[10px] text-gray-400 font-medium bg-gray-100 px-1.5 py-0.5 rounded uppercase">Stock & Cost Auto-Syncs for Catalog Items</p>
              </div>
              <button
                onClick={() => setLines(p => [...p, EMPTY_LINE()])}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                <Plus className="h-3.5 w-3.5" /> Add Line
              </button>
            </div>
            <div className="space-y-3">
              {lines.map((l, idx) => (
                <LineItemForm
                  key={idx}
                  line={l}
                  onUpdate={(f, v) => updateLine(idx, f as any, v)}
                  onRemove={lines.length > 1 ? () => setLines(p => p.filter((_, i) => i !== idx)) : undefined}
                />
              ))}
            </div>
          </div>

          {/* Totals summary */}
          <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
            {[
              { label: 'Taxable', value: totals.taxable },
              { label: 'CGST', value: totals.cgst },
              { label: 'SGST', value: totals.sgst },
              { label: 'IGST', value: totals.igst },
              { label: 'Grand Total', value: totals.grand, bold: true },
            ].map(t => (
              <div key={t.label}>
                <p className="text-xs text-gray-500">{t.label}</p>
                <p className={`font-${t.bold ? 'bold text-gray-900' : 'semibold text-gray-700'}`}>₹{t.value.toFixed(2)}</p>
              </div>
            ))}
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={form.updateCostPrice}
              onChange={e => setForm(p => ({ ...p, updateCostPrice: e.target.checked }))}
              className="rounded border-gray-300" />
            Auto-update cost price on product variants
          </label>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>Cancel</Button>
          <Button variant="brand" className="flex-1 rounded-xl" onClick={handle} disabled={saving}>
            {saving ? 'Creating…' : 'Create Invoice & Update Stock'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PurchaseInvoicesTab() {
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await inventoryApi.listPurchaseInvoices({ page: p, limit: 20 });
      setInvoices((res.data as any).invoices ?? []);
      setTotalPages((res as any).pagination?.totalPages ?? 1);
      setTotal((res as any).pagination?.total ?? 0);
      setPage(p);
    } catch { toast.error('Failed to load invoices'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(1); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this invoice?')) return;
    try {
      await inventoryApi.deletePurchaseInvoice(id);
      toast.success('Deleted');
      load(page);
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{total} purchase invoice{total !== 1 ? 's' : ''}</p>
        <div className="flex gap-2">
          <button onClick={() => load(page)} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50">
            <RefreshCw className={`h-4 w-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Button variant="brand" size="sm" className="rounded-xl" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1" /> New Invoice
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-50">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-4 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></div>
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No purchase invoices yet</p>
            <button onClick={() => setShowCreate(true)} className="mt-3 text-sm font-semibold text-brand-600 hover:underline">
              Create your first invoice
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {invoices.map(inv => (
              <div key={inv._id}>
                <div
                  className="px-4 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setExpanded(expanded === inv._id ? null : inv._id)}
                >
                  <div className="flex items-start gap-3 justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm">{inv.supplierName}</p>
                        <span className="text-xs text-gray-400">#{inv.invoiceNumber}</span>
                        <StatusBadge status={inv.paymentStatus} />
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs text-gray-500">{formatDate(inv.invoiceDate)}</span>
                        {inv.supplierGstin && <span className="text-xs text-gray-400 font-mono">{inv.supplierGstin}</span>}
                        <span className="text-xs text-gray-500">{inv.lineItems.length} item{inv.lineItems.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-gray-900">{formatPrice(inv.grandTotal)}</p>
                      <p className="text-xs text-gray-400">Taxable: {formatPrice(inv.totalTaxable)}</p>
                    </div>
                  </div>
                </div>
                {expanded === inv._id && (
                  <div className="px-4 pb-4 border-t border-gray-50 bg-gray-50/50">
                    <table className="w-full text-xs mt-3">
                      <thead>
                        <tr className="text-gray-400 uppercase tracking-wide">
                          <th className="text-left py-1 pr-3">Item</th>
                          <th className="text-left py-1 pr-3">SKU</th>
                          <th className="text-right py-1 pr-3">Qty</th>
                          <th className="text-right py-1 pr-3">Unit Cost</th>
                          <th className="text-right py-1 pr-3">GST%</th>
                          <th className="text-right py-1">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {inv.lineItems.map((l, i) => (
                          <tr key={i}>
                            <td className="py-1.5 pr-3 font-medium text-gray-800">{l.productName} {l.variantLabel ? `(${l.variantLabel})` : ''}</td>
                            <td className="py-1.5 pr-3 text-gray-500 font-mono">{l.sku}</td>
                            <td className="py-1.5 pr-3 text-right">{l.quantity}</td>
                            <td className="py-1.5 pr-3 text-right">{formatPrice(l.unitCost)}</td>
                            <td className="py-1.5 pr-3 text-right">{l.gstRate}%</td>
                            <td className="py-1.5 text-right font-semibold">{formatPrice(l.lineTotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="font-bold text-gray-900 border-t border-gray-200">
                          <td colSpan={4} className="py-2 text-right text-xs text-gray-500">
                            CGST: ₹{inv.totalCgst.toFixed(2)} · SGST: ₹{inv.totalSgst.toFixed(2)} · IGST: ₹{inv.totalIgst.toFixed(2)}
                          </td>
                          <td colSpan={2} className="py-2 text-right">Grand: {formatPrice(inv.grandTotal)}</td>
                        </tr>
                      </tfoot>
                    </table>
                    <div className="flex justify-end mt-3">
                      <button
                        onClick={() => handleDelete(inv._id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-lg" disabled={page <= 1} onClick={() => load(page - 1)}>Prev</Button>
              <Button variant="outline" size="sm" className="rounded-lg" disabled={page >= totalPages} onClick={() => load(page + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onSaved={() => load(1)} />}
    </div>
  );
}
