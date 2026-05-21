'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Plus, RefreshCw, Trash2, Pencil, X, ArrowUpRight, Flame,
  Truck, Package, Megaphone, Wallet,
} from 'lucide-react';
import { operatingExpensesApi } from '@/lib/api';
import { formatDate, formatPrice, cn } from '@/lib/utils';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import ExpenseHeatmap, { type HeatmapCell } from '@/components/admin/expenses/ExpenseHeatmap';
import {
  EXPENSE_CATEGORIES,
  categoryLabel,
  categoryColor,
  type ExpenseCategoryId,
} from '@/lib/operatingExpenseCategories';

interface Expense {
  _id: string;
  category: string;
  title: string;
  amount: number;
  expenseDate: string;
  notes?: string;
  createdBy?: { name?: string };
  createdAt?: string;
}

interface ExpenseSummary {
  year: number;
  yearTotal: number;
  monthToDateTotal: number;
  allTimeTotal: number;
  byCategory: { category: string; label: string; total: number; count: number }[];
  heatmap: HeatmapCell[];
  maxHeatmapValue: number;
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  shipping_outbound: Truck,
  packing: Package,
  ads: Megaphone,
  miscellaneous: Wallet,
};

function ExpenseFormModal({
  initial,
  onClose,
  onSaved,
}: {
  initial?: Expense;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    category: (initial?.category ?? 'miscellaneous') as ExpenseCategoryId,
    title: initial?.title ?? '',
    amount: initial?.amount ?? '',
    expenseDate: initial?.expenseDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    notes: initial?.notes ?? '',
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.title.trim() || !form.amount) {
      toast.error('Title and amount required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        category: form.category,
        title: form.title.trim(),
        amount: Number(form.amount),
        expenseDate: form.expenseDate,
        notes: form.notes.trim() || undefined,
      };
      if (initial) {
        await operatingExpensesApi.update(initial._id, payload);
        toast.success('Expense updated');
      } else {
        await operatingExpensesApi.create(payload);
        toast.success('Expense recorded');
      }
      onSaved();
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-bold text-gray-900">{initial ? 'Edit expense' : 'Add operating cost'}</h3>
          <button type="button" onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Category *</label>
            <select
              value={form.category}
              onChange={e => setForm(p => ({ ...p, category: e.target.value as ExpenseCategoryId }))}
              className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm"
            >
              {EXPENSE_CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
            <p className="text-[10px] text-gray-400 mt-1">
              {EXPENSE_CATEGORIES.find(c => c.id === form.category)?.hint}
            </p>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Title *</label>
            <input
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Delhivery March bill, Meta ads week 2"
              className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Amount ₹ *</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.amount}
                onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm font-bold"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Date *</label>
              <input
                type="date"
                value={form.expenseDate}
                onChange={e => setForm(p => ({ ...p, expenseDate: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none"
              placeholder="Invoice no., paid via UPI, etc."
            />
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t">
          <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>Cancel</Button>
          <Button variant="brand" className="flex-1 rounded-xl" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : initial ? 'Update' : 'Add expense'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminExpensesPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const [sumRes, listRes] = await Promise.all([
        operatingExpensesApi.getSummary({ year }),
        operatingExpensesApi.list({
          page: p,
          limit: 25,
          ...(categoryFilter ? { category: categoryFilter } : {}),
        }),
      ]);
      setSummary((sumRes.data as { summary: ExpenseSummary }).summary);
      setExpenses((listRes.data as { expenses: Expense[] }).expenses ?? []);
      const pag = listRes.pagination as { totalPages?: number } | undefined;
      setTotalPages(pag?.totalPages ?? 1);
      setPage(p);
    } catch {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [year, categoryFilter]);

  useEffect(() => { load(1); }, [load]);

  const handleVoid = async (e: Expense) => {
    if (!confirm(`Remove "${e.title}" (${formatPrice(e.amount)}) from books?`)) return;
    try {
      await operatingExpensesApi.void(e._id);
      toast.success('Expense voided');
      load(page);
    } catch {
      toast.error('Failed to void');
    }
  };

  const years = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="p-4 sm:p-6 xl:p-8 max-w-[1600px] mx-auto space-y-6">
      <AdminPageHeader
        title="Operating costs"
        badge="Kharcha log"
        description="Shipping, packing, ads & misc. — separate from inventory purchase bills. Full log, heatmap & audit trail."
        actions={
          <>
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => load(page)} disabled={loading}>
              <RefreshCw className={cn('h-4 w-4 mr-1', loading && 'animate-spin')} /> Refresh
            </Button>
            <Button variant="brand" size="sm" className="rounded-xl" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add cost
            </Button>
            <Link
              href="/admin/revenue"
              className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:border-brand-300"
            >
              Revenue <ArrowUpRight className="h-4 w-4 text-brand-600" />
            </Link>
          </>
        }
      />

      {summary && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: `${year} total spend`, value: formatPrice(summary.yearTotal), sub: 'All categories' },
              { label: 'This month (MTD)', value: formatPrice(summary.monthToDateTotal), sub: 'Current month' },
              { label: 'All-time logged', value: formatPrice(summary.allTimeTotal), sub: 'Since you started' },
              {
                label: 'Top category',
                value: summary.byCategory[0]?.label ?? '—',
                sub: summary.byCategory[0] ? formatPrice(summary.byCategory[0].total) : 'No data yet',
              },
            ].map(c => (
              <div key={c.label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{c.label}</p>
                <p className="text-xl font-extrabold text-gray-900 mt-1">{c.value}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{c.sub}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                <div>
                  <h2 className="font-bold text-gray-900">Spend heatmap</h2>
                  <p className="text-xs text-gray-500">Category × month — darker = higher spend</p>
                </div>
              </div>
              <select
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                className="h-9 px-3 rounded-xl border border-gray-200 text-sm font-semibold"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <ExpenseHeatmap
              cells={summary.heatmap}
              year={summary.year}
              maxValue={summary.maxHeatmapValue}
            />
          </div>

          {summary.byCategory.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {summary.byCategory.map(row => {
                const Icon = CATEGORY_ICONS[row.category] ?? Wallet;
                return (
                  <div key={row.category} className="rounded-xl border border-gray-100 bg-white p-3 flex gap-2">
                    <div className={cn('p-2 rounded-lg text-white h-fit', categoryColor(row.category))}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-gray-500 uppercase truncate">{row.label}</p>
                      <p className="text-sm font-bold text-gray-900">{formatPrice(row.total)}</p>
                      <p className="text-[9px] text-gray-400">{row.count} entries</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b flex flex-wrap items-center gap-3">
          <h2 className="font-bold text-gray-900 text-sm">Expense log</h2>
          <select
            value={categoryFilter}
            onChange={e => { setCategoryFilter(e.target.value); }}
            className="h-9 px-3 rounded-xl border border-gray-200 text-xs ml-auto"
          >
            <option value="">All categories</option>
            {EXPENSE_CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
          <Button variant="brand" size="sm" className="rounded-xl h-9" onClick={() => load(1)}>Apply</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-gray-50 text-[10px] text-gray-500 uppercase">
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3">Description</th>
                <th className="text-right px-4 py-3">Amount</th>
                <th className="text-left px-4 py-3">By</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-3">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 text-sm">
                    No expenses yet — add shipping, packing, or ad spend above.
                  </td>
                </tr>
              ) : (
                expenses.map(e => (
                  <tr key={e._id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                      {formatDate(e.expenseDate)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                        {categoryLabel(e.category)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{e.title}</p>
                      {e.notes && <p className="text-[10px] text-gray-400 truncate max-w-[240px]">{e.notes}</p>}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-red-700">{formatPrice(e.amount)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{e.createdBy?.name ?? 'Admin'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditExpense(e)}
                          className="p-2 rounded-lg hover:bg-amber-50 text-gray-500 hover:text-amber-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVoid(e)}
                          className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex justify-between px-4 py-3 border-t">
            <p className="text-xs text-gray-500">Page {page} / {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => load(page - 1)}>Prev</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => load(page + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 text-center pb-4">
        Changes are recorded in{' '}
        <Link href="/admin/security/audit" className="text-brand-600 font-semibold hover:underline">
          Security audit
        </Link>
        {' '}(operating_expense.* events) — not mixed with inventory stock log.
      </p>

      {showForm && <ExpenseFormModal onClose={() => setShowForm(false)} onSaved={() => load(1)} />}
      {editExpense && (
        <ExpenseFormModal
          initial={editExpense}
          onClose={() => setEditExpense(null)}
          onSaved={() => load(page)}
        />
      )}
    </div>
  );
}
