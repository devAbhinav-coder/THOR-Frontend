'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Plus, Trash2, RefreshCw, FileText, CheckCircle, Clock, AlertCircle, X as XIcon,
  Eye, Pencil, Search, Printer, IndianRupee, Receipt,
} from 'lucide-react';
import { inventoryApi } from '@/lib/api';
import { formatDate, formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import Image from 'next/image';
import PurchaseInvoiceDocument from './PurchaseInvoiceDocument';
import {
  EMPTY_LINE,
  GST_RATES,
  calcLine,
  generateInvoiceNumber,
  supplyTypeLabel,
  type PurchaseInvoice,
  type PurchaseInvoiceSummary,
  type PurchaseLineItem,
} from './purchaseInvoiceUtils';

interface SearchResult {
  _id: string;
  name: string;
  hsnCode?: string;
  variants: { sku: string; size?: string; color?: string; price?: number; costPrice?: number }[];
  images: { url: string }[];
}

function LineItemForm({
  line,
  onUpdate,
  onRemove,
}: {
  line: PurchaseLineItem;
  onUpdate: (field: string, value: string | number | undefined) => void;
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
      setResults((res.data as { products?: SearchResult[] }).products ?? []);
    } catch { /* ignore */ }
    finally { setSearching(false); }
  };

  const select = (prod: SearchResult, variant: SearchResult['variants'][0]) => {
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
    <div className="border border-gray-200 rounded-xl p-4 space-y-4 bg-gray-50/50 shadow-sm relative">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative">
          <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Product</label>
          <div className="relative">
            <input
              placeholder="Search catalog or type name…"
              value={line.productName}
              onChange={e => {
                onUpdate('productName', e.target.value);
                if (!showSearch) setShowSearch(true);
                search(e.target.value);
              }}
              onFocus={() => setShowSearch(true)}
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            {showSearch && (query.length >= 2 || results.length > 0) && (
              <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                {searching && (
                  <div className="p-3 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                    <RefreshCw className="h-3 w-3 animate-spin" /> Searching…
                  </div>
                )}
                {!searching && results.length === 0 && (
                  <div className="p-3 text-center text-xs text-gray-500">No match — manual entry OK</div>
                )}
                {results.map(p => (
                  <div key={p._id} className="border-b border-gray-50 last:border-0">
                    <div className="px-3 py-2 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2">
                      <div className="h-4 w-4 rounded overflow-hidden bg-gray-200 relative">
                        {p.images[0]?.url && <Image src={p.images[0].url} alt="" fill className="object-cover" />}
                      </div>
                      {p.name}
                    </div>
                    {p.variants.map(v => (
                      <button
                        key={v.sku}
                        type="button"
                        onClick={() => select(p, v)}
                        className="w-full text-left px-3 py-1.5 hover:bg-brand-50 text-xs"
                      >
                        {[v.size, v.color].filter(Boolean).join(' / ') || 'Default'} · #{v.sku}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
          {line.product && (
            <p className="text-[9px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
              <CheckCircle className="h-2.5 w-2.5" /> Linked to catalog
              <button type="button" onClick={() => onUpdate('product', undefined)} className="text-gray-400 hover:text-red-500 ml-1">
                Unlink
              </button>
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">SKU</label>
            <input
              placeholder="SKU *"
              value={line.sku}
              onChange={e => onUpdate('sku', e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-gray-200 text-xs bg-white"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">HSN</label>
            <input
              placeholder="HSN/SAC"
              value={line.hsn || ''}
              onChange={e => onUpdate('hsn', e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-gray-200 text-xs bg-white"
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 items-end pt-2 border-t border-gray-100">
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Qty</label>
          <input type="number" min={1} value={line.quantity}
            onChange={e => onUpdate('quantity', Number(e.target.value))}
            className="w-full h-9 px-3 rounded-lg border border-gray-200 text-xs font-bold bg-white" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Unit Cost ₹</label>
          <input type="number" min={0} step="0.01" value={line.unitCost}
            onChange={e => onUpdate('unitCost', Number(e.target.value))}
            className="w-full h-9 px-3 rounded-lg border border-gray-200 text-xs font-bold bg-white" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">GST %</label>
          <select value={line.gstRate} onChange={e => onUpdate('gstRate', Number(e.target.value))}
            className="w-full h-9 px-3 rounded-lg border border-gray-200 text-xs bg-white">
            {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
          </select>
        </div>
        <div className="text-xs">
          <p className="text-[9px] text-gray-400 uppercase">Taxable</p>
          <p className="font-bold">₹{line.taxableAmount.toFixed(2)}</p>
        </div>
        <div className="text-xs">
          <p className="text-[9px] text-gray-400 uppercase">GST</p>
          <p className="font-bold text-emerald-600">₹{(line.cgst + line.sgst + line.igst).toFixed(2)}</p>
        </div>
        <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-brand-100">
          <div className="text-xs">
            <p className="text-[9px] text-brand-400 uppercase">Total</p>
            <p className="font-extrabold text-brand-700">₹{line.lineTotal.toFixed(2)}</p>
          </div>
          {onRemove && (
            <button type="button" onClick={onRemove} className="p-1.5 hover:bg-red-50 text-gray-300 hover:text-red-600 rounded-lg">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      {showSearch && <div className="fixed inset-0 z-10" onClick={() => setShowSearch(false)} />}
    </div>
  );
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
  const [lines, setLines] = useState<PurchaseLineItem[]>([EMPTY_LINE()]);
  const [saving, setSaving] = useState(false);

  const updateLine = (idx: number, field: keyof PurchaseLineItem, value: string | number | undefined) => {
    setLines(prev => {
      const next = [...prev];
      const base = { ...next[idx]! };
      const l = { ...base, [field]: value } as PurchaseLineItem;
      const calc = calcLine(Number(l.quantity), Number(l.unitCost), Number(l.gstRate), form.supplyType);
      next[idx] = { ...l, ...calc };
      return next;
    });
  };

  const totals = lines.reduce(
    (a, l) => ({
      taxable: a.taxable + l.taxableAmount,
      cgst: a.cgst + l.cgst,
      sgst: a.sgst + l.sgst,
      igst: a.igst + l.igst,
      grand: a.grand + l.lineTotal,
    }),
    { taxable: 0, cgst: 0, sgst: 0, igst: 0, grand: 0 },
  );

  const handle = async () => {
    if (!form.invoiceNumber || !form.supplierName || !form.invoiceDate) {
      toast.error('Invoice number, supplier & date required');
      return;
    }
    if (lines.some(l => !l.sku || !l.productName || l.quantity < 1)) {
      toast.error('Each line needs product name, SKU & quantity');
      return;
    }
    setSaving(true);
    try {
      await inventoryApi.createPurchaseInvoice({
        ...form,
        supplierGstin: form.supplierGstin || undefined,
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
      toast.success('Purchase invoice saved — stock updated for linked items');
      onSaved();
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to create invoice');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="New Purchase Invoice" onClose={onClose}>
      <InvoiceHeaderFields form={form} setForm={setForm} />
      <LineItemsEditor lines={lines} setLines={setLines} supplyType={form.supplyType} updateLine={updateLine} />
      <TotalsBar totals={totals} supplyType={form.supplyType} />
      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input type="checkbox" checked={form.updateCostPrice}
          onChange={e => setForm(p => ({ ...p, updateCostPrice: e.target.checked }))}
          className="rounded border-gray-300" />
        Auto-update variant cost price from this bill
      </label>
      <ModalFooter onClose={onClose} onSave={handle} saving={saving} saveLabel="Create & Update Stock" />
    </ModalShell>
  );
}

function EditModal({
  invoice,
  onClose,
  onSaved,
}: {
  invoice: PurchaseInvoice;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    invoiceNumber: invoice.invoiceNumber,
    supplierName: invoice.supplierName,
    supplierGstin: invoice.supplierGstin ?? '',
    supplyType: invoice.supplyType,
    invoiceDate: invoice.invoiceDate.slice(0, 10),
    paymentStatus: invoice.paymentStatus,
    paidAmount: invoice.paidAmount ?? 0,
    notes: invoice.notes ?? '',
  });
  const [saving, setSaving] = useState(false);

  const handle = async () => {
    setSaving(true);
    try {
      await inventoryApi.updatePurchaseInvoice(invoice._id, {
        ...form,
        supplierGstin: form.supplierGstin || '',
        paidAmount: form.paymentStatus === 'paid' ? invoice.grandTotal : form.paidAmount,
      });
      toast.success('Invoice updated');
      onSaved();
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title={`Edit · ${invoice.invoiceNumber}`} onClose={onClose}>
      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
        Line items & GST amounts cannot be changed after creation (stock already posted). Edit supplier, payment & notes only.
      </p>
      <InvoiceHeaderFields form={form} setForm={setForm} />
      <ModalFooter onClose={onClose} onSave={handle} saving={saving} saveLabel="Save Changes" />
    </ModalShell>
  );
}

function ViewModal({
  invoiceId,
  onClose,
  onEdit,
}: {
  invoiceId: string;
  onClose: () => void;
  onEdit: (inv: PurchaseInvoice) => void;
}) {
  const [invoice, setInvoice] = useState<PurchaseInvoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await inventoryApi.getPurchaseInvoice(invoiceId);
        setInvoice((res.data as { invoice: PurchaseInvoice }).invoice);
      } catch {
        toast.error('Could not load invoice');
        onClose();
      } finally {
        setLoading(false);
      }
    })();
  }, [invoiceId, onClose]);

  const print = () => {
    const el = document.getElementById('purchase-invoice-print');
    if (!el) return;
    const w = window.open('', '_blank');
    if (!w) { toast.error('Allow pop-ups to print'); return; }
    w.document.write(`<html><head><title>${invoice?.invoiceNumber ?? 'Invoice'}</title>
      <style>body{font-family:system-ui,sans-serif;margin:24px} table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #e5e7eb;padding:6px 8px;font-size:12px} th{background:#f9fafb}</style></head><body>`);
    w.document.write(el.innerHTML);
    w.document.write('</body></html>');
    w.document.close();
    w.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl my-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h3 className="font-bold text-gray-900">Purchase Invoice</h3>
          <div className="flex items-center gap-2">
            {invoice && (
              <>
                <Button variant="outline" size="sm" className="rounded-lg" onClick={print}>
                  <Printer className="h-4 w-4 mr-1" /> Print
                </Button>
                <Button variant="outline" size="sm" className="rounded-lg" onClick={() => { onEdit(invoice); onClose(); }}>
                  <Pencil className="h-4 w-4 mr-1" /> Edit
                </Button>
              </>
            )}
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><XIcon className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
          ) : invoice ? (
            <PurchaseInvoiceDocument invoice={invoice} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><XIcon className="h-4 w-4" /></button>
        </div>
        <div className="p-6 space-y-5">{children}</div>
      </div>
    </div>
  );
}

function InvoiceHeaderFields<T extends Record<string, unknown>>({
  form,
  setForm,
}: {
  form: T;
  setForm: React.Dispatch<React.SetStateAction<T>>;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[
        { label: 'Invoice Number *', key: 'invoiceNumber', placeholder: 'PUR-20250522-ABC' },
        { label: 'Supplier Name *', key: 'supplierName', placeholder: 'Supplier / Vendor' },
        { label: 'Supplier GSTIN', key: 'supplierGstin', placeholder: '22AAAAA0000A1Z5' },
        { label: 'Invoice Date *', key: 'invoiceDate', type: 'date' },
      ].map(f => (
        <div key={f.key}>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">{f.label}</label>
          <div className="relative">
            <input
              type={f.type || 'text'}
              placeholder={f.placeholder}
              value={String((form as Record<string, unknown>)[f.key] ?? '')}
              onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
            {f.key === 'invoiceNumber' && (
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, invoiceNumber: generateInvoiceNumber() } as T))}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-brand-600"
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
          value={String((form as Record<string, unknown>).supplyType)}
          onChange={e => setForm(p => ({ ...p, supplyType: e.target.value } as T))}
          className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm"
        >
          <option value="intra">Intra-State (CGST + SGST)</option>
          <option value="inter">Inter-State (IGST)</option>
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-600 mb-1 block">Payment Status</label>
        <select
          value={String((form as Record<string, unknown>).paymentStatus)}
          onChange={e => setForm(p => ({ ...p, paymentStatus: e.target.value } as T))}
          className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm"
        >
          <option value="unpaid">Unpaid</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
        </select>
      </div>
      {(form as Record<string, unknown>).paymentStatus === 'partial' && (
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Paid Amount ₹</label>
          <input
            type="number"
            min={0}
            value={Number((form as Record<string, unknown>).paidAmount ?? 0)}
            onChange={e => setForm(p => ({ ...p, paidAmount: Number(e.target.value) } as T))}
            className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm"
          />
        </div>
      )}
      <div className="sm:col-span-2">
        <label className="text-xs font-semibold text-gray-600 mb-1 block">Notes</label>
        <input
          value={String((form as Record<string, unknown>).notes ?? '')}
          onChange={e => setForm(p => ({ ...p, notes: e.target.value } as T))}
          placeholder="PO reference, delivery challan no., etc."
          className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm"
        />
      </div>
    </div>
  );
}

function LineItemsEditor({
  lines,
  setLines,
  supplyType,
  updateLine,
}: {
  lines: PurchaseLineItem[];
  setLines: React.Dispatch<React.SetStateAction<PurchaseLineItem[]>>;
  supplyType: 'intra' | 'inter';
  updateLine: (idx: number, field: keyof PurchaseLineItem, value: string | number | undefined) => void;
}) {
  useEffect(() => {
    setLines(prev =>
      prev.map(l => ({ ...l, ...calcLine(l.quantity, l.unitCost, l.gstRate, supplyType) })),
    );
  }, [supplyType, setLines]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-700">Line Items</h4>
        <button
          type="button"
          onClick={() => setLines(p => [...p, EMPTY_LINE()])}
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600"
        >
          <Plus className="h-3.5 w-3.5" /> Add Line
        </button>
      </div>
      <div className="space-y-3">
        {lines.map((l, idx) => (
          <LineItemForm
            key={idx}
            line={l}
            onUpdate={(f, v) => updateLine(idx, f as keyof PurchaseLineItem, v)}
            onRemove={lines.length > 1 ? () => setLines(p => p.filter((_, i) => i !== idx)) : undefined}
          />
        ))}
      </div>
    </div>
  );
}

function TotalsBar({
  totals,
  supplyType,
}: {
  totals: { taxable: number; cgst: number; sgst: number; igst: number; grand: number };
  supplyType: 'intra' | 'inter';
}) {
  const rows =
    supplyType === 'intra'
      ? [
          { label: 'Taxable', value: totals.taxable },
          { label: 'CGST', value: totals.cgst },
          { label: 'SGST', value: totals.sgst },
          { label: 'Grand Total', value: totals.grand, bold: true },
        ]
      : [
          { label: 'Taxable', value: totals.taxable },
          { label: 'IGST', value: totals.igst },
          { label: 'Grand Total', value: totals.grand, bold: true },
        ];

  return (
    <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
      {rows.map(t => (
        <div key={t.label}>
          <p className="text-xs text-gray-500">{t.label}</p>
          <p className={t.bold ? 'font-bold text-gray-900 text-base' : 'font-semibold text-gray-700'}>
            ₹{t.value.toFixed(2)}
          </p>
        </div>
      ))}
    </div>
  );
}

function ModalFooter({
  onClose,
  onSave,
  saving,
  saveLabel,
}: {
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  saveLabel: string;
}) {
  return (
    <div className="flex gap-3 pt-2 border-t border-gray-100">
      <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>Cancel</Button>
      <Button variant="brand" className="flex-1 rounded-xl" onClick={onSave} disabled={saving}>
        {saving ? 'Saving…' : saveLabel}
      </Button>
    </div>
  );
}

export default function PurchaseInvoicesTab() {
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [summary, setSummary] = useState<PurchaseInvoiceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [editInvoice, setEditInvoice] = useState<PurchaseInvoice | null>(null);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: p, limit: 20 };
      if (search.trim()) params.search = search.trim();
      if (paymentFilter) params.paymentStatus = paymentFilter;
      if (from) params.from = from;
      if (to) params.to = to;
      const res = await inventoryApi.listPurchaseInvoices(params);
      const data = res.data as { invoices?: PurchaseInvoice[]; summary?: PurchaseInvoiceSummary };
      setInvoices(data.invoices ?? []);
      setSummary(data.summary ?? null);
      const pag = res.pagination as { totalPages?: number; total?: number } | undefined;
      setTotalPages(pag?.totalPages ?? 1);
      setTotal(pag?.total ?? 0);
      setPage(p);
    } catch {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [search, paymentFilter, from, to]);

  useEffect(() => { load(1); }, []);

  const handleVoid = async (inv: PurchaseInvoice) => {
    if (!confirm(`Void invoice ${inv.invoiceNumber}? This cannot be undone. Stock is NOT reversed automatically.`)) return;
    try {
      await inventoryApi.deletePurchaseInvoice(inv._id);
      toast.success('Invoice voided');
      load(page);
    } catch {
      toast.error('Failed to void invoice');
    }
  };

  return (
    <div className="space-y-5">
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Bills', value: String(summary.invoiceCount), icon: FileText, color: 'text-gray-900' },
            { label: 'Purchase Value', value: formatPrice(summary.grandTotal), icon: IndianRupee, color: 'text-emerald-700' },
            { label: 'Input GST (ITC)', value: formatPrice(summary.totalTax), icon: Receipt, color: 'text-blue-700' },
            { label: 'Outstanding Payable', value: formatPrice(summary.outstandingPayable), icon: AlertCircle, color: 'text-red-600' },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <c.icon className="h-3.5 w-3.5" />
                <p className="text-[10px] uppercase tracking-wide font-semibold">{c.label}</p>
              </div>
              <p className={`text-lg font-bold ${c.color}`}>{c.value}</p>
              {(c.label === 'Outstanding Payable' && (summary.unpaidCount + summary.partialCount) > 0) && (
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {summary.unpaidCount} unpaid · {summary.partialCount} partial
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && load(1)}
              placeholder="Search supplier, invoice no., GSTIN…"
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>
          <select
            value={paymentFilter}
            onChange={e => setPaymentFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border border-gray-200 text-sm min-w-[130px]"
          >
            <option value="">All payments</option>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
          </select>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="h-10 px-3 rounded-xl border border-gray-200 text-sm" title="From date" />
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="h-10 px-3 rounded-xl border border-gray-200 text-sm" title="To date" />
          <Button variant="brand" size="sm" className="rounded-xl h-10" onClick={() => load(1)}>Apply</Button>
          <button onClick={() => load(page)} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 h-10">
            <RefreshCw className={`h-4 w-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Button variant="brand" size="sm" className="rounded-xl h-10 ml-auto" onClick={() => setShowCreate(true)}>
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
              Record your first supplier bill
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Supplier / Invoice</th>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">GST</th>
                  <th className="text-right px-4 py-3">Taxable</th>
                  <th className="text-right px-4 py-3">Total</th>
                  <th className="text-left px-4 py-3">Payment</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map(inv => (
                  <tr key={inv._id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{inv.supplierName}</p>
                      <p className="text-xs text-gray-400 font-mono">#{inv.invoiceNumber}</p>
                      {inv.supplierGstin && <p className="text-[10px] text-gray-400 font-mono mt-0.5">{inv.supplierGstin}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{formatDate(inv.invoiceDate)}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {supplyTypeLabel(inv.supplyType).split('(')[0]?.trim()}
                      <br />
                      <span className="text-gray-400">{inv.lineItems.length} items</span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{formatPrice(inv.totalTaxable)}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{formatPrice(inv.grandTotal)}</td>
                    <td className="px-4 py-3"><StatusBadge status={inv.paymentStatus} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setViewId(inv._id)}
                          className="p-2 rounded-lg text-gray-500 hover:bg-brand-50 hover:text-brand-700"
                          title="View invoice"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditInvoice(inv)}
                          className="p-2 rounded-lg text-gray-500 hover:bg-amber-50 hover:text-amber-700"
                          title="Edit payment & supplier"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVoid(inv)}
                          className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600"
                          title="Void invoice"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">{total} invoice{total !== 1 ? 's' : ''} · Page {page}/{totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-lg" disabled={page <= 1} onClick={() => load(page - 1)}>Prev</Button>
              <Button variant="outline" size="sm" className="rounded-lg" disabled={page >= totalPages} onClick={() => load(page + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onSaved={() => load(1)} />}
      {viewId && (
        <ViewModal
          invoiceId={viewId}
          onClose={() => setViewId(null)}
          onEdit={inv => { setEditInvoice(inv); setViewId(null); }}
        />
      )}
      {editInvoice && (
        <EditModal
          invoice={editInvoice}
          onClose={() => setEditInvoice(null)}
          onSaved={() => load(page)}
        />
      )}
    </div>
  );
}
