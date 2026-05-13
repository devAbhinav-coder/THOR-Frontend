'use client';

import { useState, useCallback, useEffect } from 'react';
import { RefreshCw, Download, FileSpreadsheet } from 'lucide-react';
import { inventoryApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

interface SupplierRow {
  gstin: string;
  supplierName: string;
  invoiceCount: number;
  totalTaxable: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTax: number;
  grandTotal: number;
}

interface MonthlyRow {
  _id: { year: number; month: number };
  invoiceCount: number;
  totalTaxable: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTax: number;
  grandTotal: number;
}

interface Totals {
  taxable: number; cgst: number; sgst: number; igst: number; tax: number; grand: number;
}

function fmt(n: number) { return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }

function exportCsv(bySupplier: SupplierRow[], year: number) {
  const rows = [
    ['GSTIN', 'Supplier', 'Invoices', 'Taxable', 'CGST', 'SGST', 'IGST', 'Total Tax', 'Grand Total'],
    ...bySupplier.map(r => [
      r.gstin, r.supplierName, r.invoiceCount,
      r.totalTaxable.toFixed(2), r.totalCgst.toFixed(2), r.totalSgst.toFixed(2),
      r.totalIgst.toFixed(2), r.totalTax.toFixed(2), r.grandTotal.toFixed(2),
    ]),
  ];
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `gst-purchase-summary-${year}.csv`; a.click();
  URL.revokeObjectURL(url);
}

export default function GstSummaryTab() {
  const [bySupplier, setBySupplier] = useState<SupplierRow[]>([]);
  const [monthly, setMonthly] = useState<MonthlyRow[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState('all');
  const [quarter, setQuarter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: { year: number; month?: string; quarter?: string } = { year };
      if (month !== 'all') { params.month = month; }
      else if (quarter !== 'all') { params.quarter = quarter; }
      const res = await inventoryApi.getGstSummary(params);
      setBySupplier((res.data as any).bySupplier ?? []);
      setMonthly((res.data as any).monthly ?? []);
      setTotals((res.data as any).totals ?? null);
    } catch { toast.error('Failed to load GST summary'); }
    finally { setLoading(false); }
  }, [year, month, quarter]);

  useEffect(() => { load(); }, [load]);

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Year</label>
            <select
              value={year}
              onChange={e => { setYear(Number(e.target.value)); setMonth('all'); setQuarter('all'); }}
              className="h-9 px-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Month</label>
            <select
              value={month}
              onChange={e => { setMonth(e.target.value); if (e.target.value !== 'all') setQuarter('all'); }}
              className="h-9 px-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value="all">All Months</option>
              {MONTHS.map((m, i) => <option key={i + 1} value={String(i + 1)}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Quarter</label>
            <select
              value={quarter}
              onChange={e => { setQuarter(e.target.value); if (e.target.value !== 'all') setMonth('all'); }}
              className="h-9 px-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value="all">All Quarters</option>
              <option value="1">Q1 (Apr–Jun)</option>
              <option value="2">Q2 (Jul–Sep)</option>
              <option value="3">Q3 (Oct–Dec)</option>
              <option value="4">Q4 (Jan–Mar)</option>
            </select>
          </div>
          <button onClick={load} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50">
            <RefreshCw className={`h-4 w-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl ml-auto"
            onClick={() => exportCsv(bySupplier, year)}
            disabled={bySupplier.length === 0}
          >
            <Download className="h-4 w-4 mr-1" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Totals bar */}
      {totals && (
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          {[
            { label: 'Total Taxable', value: totals.taxable, color: 'text-gray-900' },
            { label: 'CGST', value: totals.cgst, color: 'text-blue-700' },
            { label: 'SGST', value: totals.sgst, color: 'text-purple-700' },
            { label: 'IGST', value: totals.igst, color: 'text-orange-700' },
            { label: 'Total Tax', value: totals.tax, color: 'text-red-600' },
            { label: 'Grand Total', value: totals.grand, color: 'text-emerald-700' },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-2xl border border-gray-100 p-3 shadow-sm">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">{c.label}</p>
              <p className={`text-base font-bold mt-0.5 ${c.color}`}>{fmt(c.value)}</p>
            </div>
          ))}
        </div>
      )}

      {/* By Supplier table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-gray-500" />
          <h3 className="font-semibold text-gray-900 text-sm">By Supplier / GSTIN</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[680px]">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3">Supplier</th>
                <th className="text-left px-4 py-3">GSTIN</th>
                <th className="text-right px-4 py-3">Inv</th>
                <th className="text-right px-4 py-3">Taxable</th>
                <th className="text-right px-4 py-3">CGST</th>
                <th className="text-right px-4 py-3">SGST</th>
                <th className="text-right px-4 py-3">IGST</th>
                <th className="text-right px-4 py-3">Grand Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? [...Array(5)].map((_, i) => (
                <tr key={i}><td colSpan={8} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
              )) : bySupplier.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-sm text-gray-400">No purchase data for this period</td></tr>
              ) : bySupplier.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{r.supplierName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.gstin}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{r.invoiceCount}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{fmt(r.totalTaxable)}</td>
                  <td className="px-4 py-3 text-right text-blue-700">{fmt(r.totalCgst)}</td>
                  <td className="px-4 py-3 text-right text-purple-700">{fmt(r.totalSgst)}</td>
                  <td className="px-4 py-3 text-right text-orange-700">{fmt(r.totalIgst)}</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">{fmt(r.grandTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly breakdown */}
      {monthly.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">Monthly Breakdown — {year}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Month</th>
                  <th className="text-right px-4 py-3">Invoices</th>
                  <th className="text-right px-4 py-3">Taxable</th>
                  <th className="text-right px-4 py-3">Tax</th>
                  <th className="text-right px-4 py-3">Grand Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {monthly.map((m, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {MONTHS[(m._id.month - 1)] ?? m._id.month} {m._id.year}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{m.invoiceCount}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{fmt(m.totalTaxable)}</td>
                    <td className="px-4 py-3 text-right text-red-600">{fmt(m.totalTax)}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{fmt(m.grandTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
