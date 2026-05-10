"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Plus,
  Receipt,
  Search,
  Trash2,
  Pencil,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";

import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatINRMoney } from "@/lib/invoiceCalc";
import {
  deleteInvoice,
  listInvoices,
  type SavedInvoice,
} from "@/lib/invoiceStore";

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
}

function fmtRelative(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`;
  if (diff < 7 * 86_400_000) return `${Math.round(diff / 86_400_000)}d ago`;
  return fmtDate(iso);
}

export default function AdminInvoicesListPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<SavedInvoice[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");

  /** Defensive setter — guarantees state is always an array even if a stale
   *  module (HMR / bad build) passes us something unexpected. */
  const applyInvoices = useCallback((next: unknown) => {
    setInvoices(Array.isArray(next) ? (next as SavedInvoice[]) : []);
  }, []);

  /** Refresh the list from the server. Safe to call after any mutation. */
  const refresh = useCallback(async () => {
    const next = await listInvoices();
    applyInvoices(next);
  }, [applyInvoices]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const next = await listInvoices();
        if (!cancelled) {
          applyInvoices(next);
          setLoaded(true);
        }
      } catch {
        if (!cancelled) {
          applyInvoices([]);
          setLoaded(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyInvoices]);

  /** Always re-derive a guaranteed-iterable list before any consumer touches it. */
  const safeInvoices = useMemo<SavedInvoice[]>(
    () => (Array.isArray(invoices) ? invoices : []),
    [invoices],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return safeInvoices;
    return safeInvoices.filter((inv) => {
      const haystack = [
        inv.meta?.invoiceNumber,
        inv.meta?.poNumber,
        inv.buyer?.companyName,
        inv.buyer?.name,
        inv.buyer?.gstin,
        inv.buyer?.state,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [safeInvoices, query]);

  const totalThisMonth = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    let sum = 0;
    let count = 0;
    for (const inv of safeInvoices) {
      const d = new Date(inv.meta?.invoiceDate ?? "");
      if (Number.isNaN(d.getTime())) continue;
      if (d.getFullYear() === y && d.getMonth() === m) {
        sum += Number(inv.grandTotal) || 0;
        count += 1;
      }
    }
    return { sum, count };
  }, [safeInvoices]);

  const handleDelete = useCallback(
    async (id: string, label: string) => {
      if (!confirm(`Delete invoice ${label}? This cannot be undone.`)) return;
      try {
        await deleteInvoice(id);
        await refresh();
        toast.success("Invoice deleted");
      } catch {
        toast.error("Could not delete invoice. Try again.");
      }
    },
    [refresh],
  );

  return (
    <div className='mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 xl:p-8'>
      <AdminPageHeader
        title='B2B tax invoices'
        description='Admin-only GST bills for offline wholesale (e.g. fabric by meter). Not tied to the shop or customer carts — create, save, and reprint from any device.'
        badge='Billing'
        actions={
          <Button
            asChild
            variant='brand'
            size='sm'
            className='rounded-xl bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-400'
          >
            <Link href='/admin/invoices/new'>
              <Plus className='mr-1.5 h-4 w-4' /> New B2B invoice
            </Link>
          </Button>
        }
      />

      {/* Hero metrics */}
      <div className='grid gap-3 sm:grid-cols-3'>
        <div className='rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-blue-50/50 p-5 shadow-sm'>
          <p className='text-[11px] font-semibold uppercase tracking-wide text-blue-700'>
            Saved invoices
          </p>
          <p className='mt-1 text-2xl font-extrabold text-blue-900 tabular-nums'>
            {safeInvoices.length}
          </p>
          <p className='mt-1 text-xs text-blue-700/70'>
            {safeInvoices.length === 0 ?
              "Start with your first one →"
            : "Synced across admin devices"}
          </p>
        </div>
        <div className='rounded-2xl border border-gray-100 bg-white p-5 shadow-sm'>
          <p className='text-[11px] font-semibold uppercase tracking-wide text-gray-500'>
            This month — count
          </p>
          <p className='mt-1 text-2xl font-extrabold text-gray-900 tabular-nums'>
            {totalThisMonth.count}
          </p>
          <p className='mt-1 text-xs text-gray-500'>
            Invoices dated in {new Date().toLocaleString("en-IN", {
              month: "long",
            })}
          </p>
        </div>
        <div className='rounded-2xl border border-gray-100 bg-white p-5 shadow-sm'>
          <p className='text-[11px] font-semibold uppercase tracking-wide text-gray-500'>
            This month — value
          </p>
          <p className='mt-1 text-2xl font-extrabold text-gray-900 tabular-nums'>
            {formatINRMoney(totalThisMonth.sum)}
          </p>
          <p className='mt-1 text-xs text-gray-500'>Sum of grand totals</p>
        </div>
      </div>

      {/* Search */}
      <div className='relative'>
        <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Search by invoice number, buyer, GSTIN, PO…'
          className='h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300'
        />
      </div>

      {/* List */}
      {!loaded ?
        <div className='rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-500 shadow-sm'>
          Loading…
        </div>
      : filtered.length === 0 ?
        <EmptyState hasAny={safeInvoices.length > 0} clearQuery={() => setQuery("")} />
      : <div className='rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden'>
          <ul className='divide-y divide-gray-100'>
            {filtered.map((inv) => (
              <li
                key={inv.id}
                className='group flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5 hover:bg-blue-50/40 transition-colors'
              >
                <button
                  type='button'
                  onClick={() =>
                    router.push(
                      `/admin/invoices/new?id=${encodeURIComponent(inv.id)}`,
                    )
                  }
                  className='flex flex-1 items-start gap-3 text-left'
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                      "bg-blue-100 text-blue-700 group-hover:bg-blue-200",
                    )}
                  >
                    <Receipt className='h-5 w-5' />
                  </span>
                  <div className='min-w-0 flex-1'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <p className='truncate text-sm font-bold text-gray-900'>
                        {inv.meta.invoiceNumber || "(no number)"}
                      </p>
                      <span className='inline-flex items-center rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600'>
                        {inv.taxMode === "cgst_sgst" ?
                          "CGST+SGST"
                        : inv.taxMode === "igst" ?
                          "IGST"
                        : "Non-GST"}
                      </span>
                      <span className='inline-flex items-center gap-1 text-[11px] text-gray-500'>
                        <Calendar className='h-3 w-3' />
                        {fmtDate(inv.meta.invoiceDate)}
                      </span>
                    </div>
                    <p className='mt-0.5 truncate text-xs text-gray-600'>
                      {inv.buyer.companyName?.trim() ||
                        inv.buyer.name?.trim() ||
                        "Walk-in / unnamed buyer"}
                      {inv.buyer.gstin ? ` • GSTIN ${inv.buyer.gstin}` : ""}
                    </p>
                    <p className='mt-0.5 text-[11px] text-gray-400'>
                      Saved {fmtRelative(inv.updatedAt)} • {inv.itemCount}{" "}
                      item
                      {inv.itemCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className='shrink-0 text-right'>
                    <p className='text-sm font-extrabold text-blue-700 tabular-nums'>
                      {formatINRMoney(inv.grandTotal)}
                    </p>
                    <p className='text-[11px] text-gray-500'>Grand total</p>
                  </div>
                </button>
                <div className='flex shrink-0 items-center gap-2 pl-14 sm:pl-0'>
                  <Button
                    asChild
                    variant='outline'
                    size='sm'
                    className='rounded-lg'
                  >
                    <Link
                      href={`/admin/invoices/new?id=${encodeURIComponent(inv.id)}`}
                    >
                      <Pencil className='mr-1 h-3.5 w-3.5' /> Open
                    </Link>
                  </Button>
                  <button
                    type='button'
                    onClick={() =>
                      handleDelete(inv.id, inv.meta.invoiceNumber)
                    }
                    className='rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600'
                    aria-label={`Delete ${inv.meta.invoiceNumber}`}
                  >
                    <Trash2 className='h-4 w-4' />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      }
    </div>
  );
}

function EmptyState({
  hasAny,
  clearQuery,
}: {
  hasAny: boolean;
  clearQuery: () => void;
}) {
  return (
    <div className='rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/30 p-10 text-center'>
      <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700'>
        <FileText className='h-7 w-7' />
      </div>
      <h3 className='mt-4 text-lg font-bold text-gray-900'>
        {hasAny ? "No matches" : "No B2B invoices yet"}
      </h3>
      <p className='mx-auto mt-1 max-w-md text-sm text-gray-600'>
        {hasAny ?
          "Nothing matches that search. Try clearing it or use a different keyword."
        : "Create a standalone tax bill (meter, kg, pcs, etc.). Nothing from the shop checkout — admin billing only."}
      </p>
      <div className='mt-5 flex justify-center gap-2'>
        {hasAny ?
          <Button
            type='button'
            variant='outline'
            className='rounded-xl'
            onClick={clearQuery}
          >
            Clear search
          </Button>
        : null}
        <Button
          asChild
          variant='brand'
          className='rounded-xl bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-400'
        >
          <Link href='/admin/invoices/new'>
            <Plus className='mr-1.5 h-4 w-4' /> New B2B invoice
          </Link>
        </Button>
      </div>
    </div>
  );
}
