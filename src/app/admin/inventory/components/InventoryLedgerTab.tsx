'use client';

import { useState, useCallback, useEffect } from 'react';
import { RefreshCw, History, ArrowUp, ArrowDown } from 'lucide-react';
import { inventoryApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

interface LedgerEntry {
  _id: string;
  productName: string;
  variantLabel?: string;
  sku: string;
  delta: number;
  stockAfter: number;
  reason: string;
  note?: string;
  actor?: { name: string; email: string };
  createdAt: string;
}

const REASON_LABELS: Record<string, { label: string; color: string }> = {
  sale: { label: 'Sale', color: 'bg-blue-100 text-blue-700' },
  sale_return: { label: 'Sale Return', color: 'bg-purple-100 text-purple-700' },
  purchase: { label: 'Purchase', color: 'bg-emerald-100 text-emerald-700' },
  damage: { label: 'Damage', color: 'bg-red-100 text-red-700' },
  manual_correction: { label: 'Manual', color: 'bg-amber-100 text-amber-700' },
  opening_stock: { label: 'Opening', color: 'bg-gray-100 text-gray-700' },
};

export default function InventoryLedgerTab() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [reason, setReason] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: p, limit: 30 };
      if (reason) params.reason = reason;
      if (from) params.from = from;
      if (to) params.to = to;
      const res = await inventoryApi.getLedger(params);
      setEntries((res.data as any).entries ?? []);
      setTotalPages((res as any).pagination?.totalPages ?? 1);
      setTotal((res as any).pagination?.total ?? 0);
      setPage(p);
    } catch { toast.error('Failed to load ledger'); }
    finally { setLoading(false); }
  }, [reason, from, to]);

  useEffect(() => { load(1); }, []);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Reason</label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value="">All reasons</option>
              {Object.entries(REASON_LABELS).map(([v, { label }]) => (
                <option key={v} value={v}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">From</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="h-9 px-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">To</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              className="h-9 px-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
          </div>
          <Button variant="brand" size="sm" className="rounded-xl h-9" onClick={() => load(1)}>Apply</Button>
          <button onClick={() => load(page)} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50">
            <RefreshCw className={`h-4 w-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <History className="h-4 w-4 text-gray-500" />
          <h3 className="font-semibold text-gray-900 text-sm">Stock Movement Log</h3>
          <span className="ml-auto text-xs text-gray-400">{total} entries</span>
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3">Product / SKU</th>
                <th className="text-left px-4 py-3">Change</th>
                <th className="text-left px-4 py-3">After</th>
                <th className="text-left px-4 py-3">Reason</th>
                <th className="text-left px-4 py-3">Note</th>
                <th className="text-left px-4 py-3">By</th>
                <th className="text-left px-4 py-3">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-3">
                    <div className="h-4 bg-gray-100 rounded animate-pulse" />
                  </td></tr>
                ))
              ) : entries.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-sm text-gray-400">No ledger entries yet</td></tr>
              ) : entries.map(e => {
                const r = REASON_LABELS[e.reason] ?? { label: e.reason, color: 'bg-gray-100 text-gray-700' };
                return (
                  <tr key={e._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 truncate max-w-[180px]">{e.productName}</p>
                      <p className="text-xs text-gray-400">{e.variantLabel || e.sku}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-sm font-bold ${e.delta > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {e.delta > 0 ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
                        {e.delta > 0 ? `+${e.delta}` : e.delta}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 font-semibold">{e.stockAfter}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.color}`}>{r.label}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[140px] truncate">{e.note || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{e.actor?.name || 'System'}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{formatDate(e.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-gray-100">
          {loading ? [...Array(4)].map((_, i) => (
            <div key={i} className="p-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></div>
          )) : entries.map(e => {
            const r = REASON_LABELS[e.reason] ?? { label: e.reason, color: 'bg-gray-100 text-gray-700' };
            return (
              <div key={e._id} className="p-4 space-y-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{e.productName}</p>
                    <p className="text-xs text-gray-400">{e.variantLabel || e.sku}</p>
                  </div>
                  <span className={`text-sm font-bold ${e.delta > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {e.delta > 0 ? `+${e.delta}` : e.delta}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.color}`}>{r.label}</span>
                  <span className="text-xs text-gray-400">{formatDate(e.createdAt)}</span>
                  {e.note && <span className="text-xs text-gray-500 italic">{e.note}</span>}
                </div>
              </div>
            );
          })}
        </div>

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
    </div>
  );
}
