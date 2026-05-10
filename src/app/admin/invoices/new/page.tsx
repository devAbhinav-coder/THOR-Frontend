"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Printer,
  Save,
  Trash2,
  RotateCcw,
  Eye,
  EyeOff,
  Building2,
  User2,
  Package,
  StickyNote,
  Calculator,
} from "lucide-react";
import toast from "react-hot-toast";

import AdminPageHeader from "@/components/admin/AdminPageHeader";
import SalesInvoiceDocument, {
  type BuyerDetails,
  type InvoiceMeta,
  type SellerDetails,
} from "@/components/admin/SalesInvoiceDocument";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  computeLine,
  computeTotals,
  emptyLine,
  formatINRMoney,
  GST_RATE_PRESETS,
  suggestInvoiceNumber,
  UNIT_OPTIONS,
  type InvoiceLine,
  type TaxMode,
  type UnitValue,
} from "@/lib/invoiceCalc";
import { getInvoice, saveInvoice } from "@/lib/invoiceStore";

const DEFAULT_SELLER: SellerDetails = {
  name: "The House of Rani",
  address: "Amrapali Princely State Sector 76, Noida, Uttar Pradesh 201301",
  email: "support@thehouseofrani.com",
  phone: "+91 8340311033",
  gstin: "10CCLPR1131E1Z6",
  pan: "AAACCJ9379R",
  state: "Uttar Pradesh",
};

const DEFAULT_BUYER: BuyerDetails = {
  name: "",
  companyName: "",
  gstin: "",
  pan: "",
  address: "",
  state: "",
  phone: "",
  email: "",
};

/** Common Indian states for the place-of-supply dropdown (admin can free-type if missing). */
const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

function newLineId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `ln_${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
}

function todayIso(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function makeInitialMeta(): InvoiceMeta {
  return {
    invoiceNumber: suggestInvoiceNumber(),
    invoiceDate: todayIso(),
    dueDate: "",
    poNumber: "",
    notes: "",
    terms:
      "1. Payment due within the agreed terms.\n2. Goods once sold will be returned only as per our return policy.\n3. Subject to Noida jurisdiction.",
    taxMode: "cgst_sgst",
    showHsn: true,
    showDiscount: true,
    showGstColumn: true,
  };
}

const card = "rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6";
const sectionTitle =
  "flex items-center gap-2 text-sm font-semibold text-gray-900";
const sectionBadge =
  "flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-[11px] font-black text-blue-800";
const fieldLabel =
  "text-[11px] font-semibold uppercase tracking-wide text-gray-500";
const inputBase =
  "h-10 w-full rounded-xl border border-gray-200 px-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300";
const textareaBase =
  "min-h-[72px] w-full resize-y rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300";
const pill =
  "rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400";
const pillActive =
  "border-blue-400 bg-blue-50 text-blue-900 ring-1 ring-blue-200";
const pillIdle =
  "border-gray-200 bg-gray-50/50 text-gray-700 hover:border-gray-300";

export default function NewSalesInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const [hydrating, setHydrating] = useState<boolean>(Boolean(editId));
  /** Bumps on StrictMode remount / dependency change so stale `getInvoice` runs never touch state or leave `hydrating` stuck. */
  const hydrateGenRef = useRef(0);
  const [persistedId, setPersistedId] = useState<string | null>(null);
  /** Server `createdAt` — printed on the invoice as "Created on" after first save. */
  const [recordCreatedAt, setRecordCreatedAt] = useState<string | null>(null);

  const [seller, setSeller] = useState<SellerDetails>(DEFAULT_SELLER);
  const [buyer, setBuyer] = useState<BuyerDetails>(DEFAULT_BUYER);
  const [meta, setMeta] = useState<InvoiceMeta>(() => makeInitialMeta());
  const [lines, setLines] = useState<InvoiceLine[]>(() => [
    emptyLine(newLineId()),
  ]);

  /** Mobile-only: collapsible preview drawer (saves screen real estate while editing). */
  const [previewOpenMobile, setPreviewOpenMobile] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);

  /* ── Hydrate when editing an existing saved invoice ───────────────── */
  useEffect(() => {
    if (!editId) {
      setHydrating(false);
      return;
    }
    const runId = ++hydrateGenRef.current;
    setHydrating(true);
    (async () => {
      try {
        const found = await getInvoice(editId);
        if (runId !== hydrateGenRef.current) return;
        if (found) {
          setSeller({
            ...DEFAULT_SELLER,
            ...(typeof found.seller === "object" && found.seller ?
              (found.seller as Partial<SellerDetails>)
            : {}),
          });
          setBuyer({
            ...DEFAULT_BUYER,
            ...(typeof found.buyer === "object" && found.buyer ?
              (found.buyer as Partial<BuyerDetails>)
            : {}),
          });
          setMeta({
            ...makeInitialMeta(),
            ...(typeof found.meta === "object" && found.meta ?
              (found.meta as Partial<InvoiceMeta>)
            : {}),
          } as InvoiceMeta);
          /** Server doesn't persist the client-side `id` on each row — re-create them on hydrate so React keys stay stable. */
          const rawLines = found.lines;
          const lineSource = Array.isArray(rawLines) ? rawLines : [];
          const hydrated: InvoiceLine[] = lineSource.map((l) => ({
            id: newLineId(),
            description: l.description ?? "",
            hsn: l.hsn ?? "",
            unit: l.unit,
            customUnit: l.customUnit ?? "",
            qty: l.qty ?? 0,
            rate: l.rate ?? 0,
            discountPct: l.discountPct ?? 0,
            gstPct: l.gstPct ?? 0,
          }));
          setLines(hydrated.length > 0 ? hydrated : [emptyLine(newLineId())]);
          setPersistedId(found.id);
          setRecordCreatedAt(
            typeof found.createdAt === "string" ? found.createdAt : null,
          );
        } else {
          toast.error("Invoice not found — starting a new one.");
        }
      } catch {
        if (runId === hydrateGenRef.current) {
          toast.error("Could not load this invoice.");
        }
      } finally {
        if (runId === hydrateGenRef.current) setHydrating(false);
      }
    })();
    return () => {
      hydrateGenRef.current += 1;
    };
  }, [editId]);

  /* ── Shorter browser print header (Chrome uses document.title in the margin when headers are on). ─ */
  const printTitlePrevRef = useRef<string | null>(null);
  useEffect(() => {
    const shortTitle =
      meta.invoiceNumber?.trim() ?
        `Invoice ${meta.invoiceNumber.trim()}`
      : "Invoice";
    const onBeforePrint = () => {
      printTitlePrevRef.current = document.title;
      document.title = shortTitle;
    };
    const onAfterPrint = () => {
      if (printTitlePrevRef.current != null) {
        document.title = printTitlePrevRef.current;
        printTitlePrevRef.current = null;
      }
    };
    window.addEventListener("beforeprint", onBeforePrint);
    window.addEventListener("afterprint", onAfterPrint);
    return () => {
      window.removeEventListener("beforeprint", onBeforePrint);
      window.removeEventListener("afterprint", onAfterPrint);
    };
  }, [meta.invoiceNumber]);

  /* ── Line CRUD ────────────────────────────────────────────────────── */
  const patchLine = useCallback((id: string, patch: Partial<InvoiceLine>) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }, []);

  const addLine = useCallback(() => {
    setLines((prev) => [...prev, emptyLine(newLineId())]);
  }, []);

  const removeLine = useCallback((id: string) => {
    setLines((prev) => {
      if (prev.length <= 1) return [emptyLine(newLineId())];
      return prev.filter((l) => l.id !== id);
    });
  }, []);

  const duplicateLine = useCallback((id: string) => {
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.id === id);
      if (idx < 0) return prev;
      const original = prev[idx]!;
      const copy: InvoiceLine = { ...original, id: newLineId() };
      const next = prev.slice();
      next.splice(idx + 1, 0, copy);
      return next;
    });
  }, []);

  /* ── Totals (memoized; reused by sticky summary + buttons) ────────── */
  const totals = useMemo(() => {
    const safeLines = Array.isArray(lines) ? lines : [];
    return computeTotals(safeLines, meta.taxMode);
  }, [lines, meta.taxMode]);

  /* ── Validators (only blocks save / print when truly empty) ───────── */
  const validate = useCallback((): string | null => {
    if (!meta.invoiceNumber.trim()) return "Enter an invoice number.";
    if (!meta.invoiceDate) return "Pick an invoice date.";
    if (lines.every((l) => !l.description.trim() && l.qty * l.rate === 0)) {
      return "Add at least one line with a description or a qty × rate value.";
    }
    return null;
  }, [meta.invoiceNumber, meta.invoiceDate, lines]);

  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async (): Promise<boolean> => {
    const err = validate();
    if (err) {
      toast.error(err);
      return false;
    }
    setSaving(true);
    try {
      const saved = await saveInvoice({
        id: persistedId ?? undefined,
        seller,
        buyer,
        meta,
        lines,
      });
      setPersistedId(saved.id);
      setRecordCreatedAt(saved.createdAt ?? saved.updatedAt ?? null);
      toast.success("Invoice saved");
      return true;
    } catch (e: unknown) {
      const msg =
        (e as { message?: string })?.message ||
        "Could not save invoice. Try again.";
      toast.error(msg);
      return false;
    } finally {
      setSaving(false);
    }
  }, [validate, persistedId, seller, buyer, meta, lines]);

  const handlePrint = useCallback(() => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    window.print();
  }, [validate]);

  const handleSaveAndPrint = useCallback(async () => {
    const ok = await handleSave();
    if (!ok) return;
    /** Tiny delay so the success toast renders before the OS print dialog steals focus. */
    setTimeout(() => handlePrint(), 60);
  }, [handleSave, handlePrint]);

  const handleReset = useCallback(() => {
    if (!confirm("Clear the form and start a fresh invoice?")) return;
    setSeller(DEFAULT_SELLER);
    setBuyer(DEFAULT_BUYER);
    setMeta(makeInitialMeta());
    setLines([emptyLine(newLineId())]);
    setPersistedId(null);
    setRecordCreatedAt(null);
    /** Drop ?id= from the URL so further saves don't overwrite the previous record. */
    router.replace("/admin/invoices/new");
  }, [router]);

  const handleScrollPreview = useCallback(() => {
    setPreviewOpenMobile(true);
    /** Wait one frame so the drawer mounts before we scroll. */
    requestAnimationFrame(() => {
      previewRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, []);

  if (hydrating) {
    return <div className='p-6 text-sm text-gray-500'>Loading invoice…</div>;
  }

  return (
    <div className='mx-auto w-full max-w-[1500px] space-y-6 p-4 pb-[calc(7.25rem+env(safe-area-inset-bottom,0px))] sm:p-6 sm:pb-[calc(7.25rem+env(safe-area-inset-bottom,0px))] xl:p-8 xl:pb-[calc(7.25rem+env(safe-area-inset-bottom,0px))]'>
      <div className='flex flex-wrap items-center gap-3 print-hidden'>
        <Link
          href='/admin/invoices'
          className='inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-700'
        >
          <ArrowLeft className='h-4 w-4' /> All invoices
        </Link>
      </div>

      <div className='print-hidden'>
        <AdminPageHeader
          title={persistedId ? "Edit B2B invoice" : "New B2B invoice"}
          description='Offline wholesale billing: line items with unit, qty, and rate. CGST+SGST, IGST, or non-GST.'
          badge='Admin billing'
          actions={
            <div className='flex flex-wrap gap-2'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='rounded-xl'
                onClick={handleReset}
              >
                <RotateCcw className='mr-1.5 h-4 w-4' /> Reset
              </Button>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='rounded-xl'
                onClick={() => void handleSave()}
                loading={saving}
              >
                <Save className='mr-1.5 h-4 w-4' /> Save draft
              </Button>
              <Button
                type='button'
                variant='brand'
                size='sm'
                className='rounded-xl bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-400'
                onClick={() => void handleSaveAndPrint()}
                loading={saving}
              >
                <Printer className='mr-1.5 h-4 w-4' /> Save &amp; print
              </Button>
            </div>
          }
        />
      </div>

      <div className='grid min-h-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(440px,600px)] print-hidden'>
        {/* ─────────── FORM (left column on desktop) ─────────── */}
        <div className='min-h-0 space-y-6'>
          {/* Invoice meta */}
          <section className={card}>
            <div className='mb-4 flex items-center justify-between gap-2'>
              <div className={sectionTitle}>
                <span className={sectionBadge}>1</span>
                <Calculator className='h-4 w-4 text-blue-600' />
                Invoice details
              </div>
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <label className='block space-y-1.5'>
                <span className={fieldLabel}>Invoice number</span>
                <input
                  value={meta.invoiceNumber}
                  onChange={(e) =>
                    setMeta((m) => ({ ...m, invoiceNumber: e.target.value }))
                  }
                  className={inputBase}
                  placeholder='INV-251005-001'
                />
              </label>
              <label className='block space-y-1.5'>
                <span className={fieldLabel}>Invoice date</span>
                <input
                  type='date'
                  value={meta.invoiceDate}
                  onChange={(e) =>
                    setMeta((m) => ({ ...m, invoiceDate: e.target.value }))
                  }
                  className={inputBase}
                />
              </label>
              <label className='block space-y-1.5'>
                <span className={fieldLabel}>Due date (optional)</span>
                <input
                  type='date'
                  value={meta.dueDate}
                  onChange={(e) =>
                    setMeta((m) => ({ ...m, dueDate: e.target.value }))
                  }
                  className={inputBase}
                />
              </label>
              <label className='block space-y-1.5'>
                <span className={fieldLabel}>PO / reference</span>
                <input
                  value={meta.poNumber}
                  onChange={(e) =>
                    setMeta((m) => ({ ...m, poNumber: e.target.value }))
                  }
                  className={inputBase}
                  placeholder='Purchase order or buyer reference'
                />
              </label>
            </div>

            <div className='mt-5'>
              <p className={fieldLabel}>Tax mode</p>
              <div className='mt-2 flex flex-wrap gap-2'>
                {(
                  [
                    { v: "cgst_sgst", label: "CGST + SGST (intra-state)" },
                    { v: "igst", label: "IGST (inter-state)" },
                    { v: "none", label: "No tax / non-GST" },
                  ] as { v: TaxMode; label: string }[]
                ).map((opt) => (
                  <button
                    key={opt.v}
                    type='button'
                    onClick={() => setMeta((m) => ({ ...m, taxMode: opt.v }))}
                    className={cn(
                      pill,
                      meta.taxMode === opt.v ? pillActive : pillIdle,
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className='mt-5 flex flex-wrap gap-2'>
              <ToggleChip
                active={meta.showHsn}
                onClick={() => setMeta((m) => ({ ...m, showHsn: !m.showHsn }))}
                label='HSN/SAC column'
              />
              <ToggleChip
                active={meta.showDiscount}
                onClick={() =>
                  setMeta((m) => ({ ...m, showDiscount: !m.showDiscount }))
                }
                label='Discount column'
              />
              <ToggleChip
                active={meta.showGstColumn}
                onClick={() =>
                  setMeta((m) => ({
                    ...m,
                    showGstColumn: !m.showGstColumn,
                  }))
                }
                label='Show GST in row'
              />
            </div>
          </section>

          {/* Buyer */}
          <section className={card}>
            <div className='mb-4 flex items-center gap-2'>
              <span className={sectionBadge}>2</span>
              <User2 className='h-4 w-4 text-blue-600' />
              <h2 className='text-sm font-semibold text-gray-900'>
                Bill to (buyer)
              </h2>
            </div>
            <div className='grid gap-4 sm:grid-cols-2'>
              <label className='block space-y-1.5'>
                <span className={fieldLabel}>Company / business name</span>
                <input
                  value={buyer.companyName}
                  onChange={(e) =>
                    setBuyer((b) => ({ ...b, companyName: e.target.value }))
                  }
                  className={inputBase}
                  placeholder='ABC Textiles Pvt Ltd'
                />
              </label>
              <label className='block space-y-1.5'>
                <span className={fieldLabel}>Contact person</span>
                <input
                  value={buyer.name}
                  onChange={(e) =>
                    setBuyer((b) => ({ ...b, name: e.target.value }))
                  }
                  className={inputBase}
                  placeholder='Mr / Ms…'
                />
              </label>
              <label className='block space-y-1.5'>
                <span className={fieldLabel}>GSTIN (optional)</span>
                <input
                  value={buyer.gstin}
                  onChange={(e) =>
                    setBuyer((b) => ({
                      ...b,
                      gstin: e.target.value.toUpperCase(),
                    }))
                  }
                  className={cn(inputBase, "tracking-wider")}
                  placeholder='15-character GSTIN'
                  maxLength={15}
                />
              </label>
              <label className='block space-y-1.5'>
                <span className={fieldLabel}>PAN (optional)</span>
                <input
                  value={buyer.pan}
                  onChange={(e) =>
                    setBuyer((b) => ({
                      ...b,
                      pan: e.target.value.toUpperCase(),
                    }))
                  }
                  className={cn(inputBase, "tracking-wider")}
                  placeholder='10-character PAN'
                  maxLength={10}
                />
              </label>
              <label className='block space-y-1.5 sm:col-span-2'>
                <span className={fieldLabel}>Billing address</span>
                <textarea
                  value={buyer.address}
                  onChange={(e) =>
                    setBuyer((b) => ({ ...b, address: e.target.value }))
                  }
                  className={textareaBase}
                  placeholder='Street, area, city, pin code'
                  rows={2}
                />
              </label>
              <label className='block space-y-1.5'>
                <span className={fieldLabel}>State (place of supply)</span>
                <input
                  list='indian-states'
                  value={buyer.state}
                  onChange={(e) =>
                    setBuyer((b) => ({ ...b, state: e.target.value }))
                  }
                  className={inputBase}
                  placeholder='e.g. Maharashtra'
                />
                <datalist id='indian-states'>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </label>
              <label className='block space-y-1.5'>
                <span className={fieldLabel}>Phone (optional)</span>
                <input
                  value={buyer.phone}
                  onChange={(e) =>
                    setBuyer((b) => ({ ...b, phone: e.target.value }))
                  }
                  className={inputBase}
                  placeholder='+91…'
                />
              </label>
              <label className='block space-y-1.5 sm:col-span-2'>
                <span className={fieldLabel}>Email (optional)</span>
                <input
                  value={buyer.email}
                  onChange={(e) =>
                    setBuyer((b) => ({ ...b, email: e.target.value }))
                  }
                  className={inputBase}
                  placeholder='accounts@buyer.com'
                />
              </label>
            </div>
          </section>

          {/* Items */}
          <section className={card}>
            <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <div className='flex items-center gap-2'>
                <span className={sectionBadge}>3</span>
                <Package className='h-4 w-4 text-blue-600' />
                <h2 className='text-sm font-semibold text-gray-900'>
                  Invoice lines
                </h2>
                <span className='ml-2 text-[11px] text-gray-500'>
                  {lines.length} {lines.length === 1 ? "row" : "rows"}
                </span>
              </div>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='rounded-xl'
                onClick={addLine}
              >
                <Plus className='mr-1.5 h-4 w-4' /> Add item
              </Button>
            </div>

            <div className='space-y-4'>
              {lines.map((line, idx) => (
                <ItemRow
                  key={line.id}
                  index={idx}
                  line={line}
                  taxMode={meta.taxMode}
                  showHsn={meta.showHsn}
                  showDiscount={meta.showDiscount}
                  showGst={meta.taxMode !== "none"}
                  onPatch={(p) => patchLine(line.id, p)}
                  onDuplicate={() => duplicateLine(line.id)}
                  onRemove={() => removeLine(line.id)}
                  canRemove={lines.length > 1}
                />
              ))}
            </div>
          </section>

          {/* Notes / terms */}
          <section className={card}>
            <div className='mb-4 flex items-center gap-2'>
              <span className={sectionBadge}>4</span>
              <StickyNote className='h-4 w-4 text-blue-600' />
              <h2 className='text-sm font-semibold text-gray-900'>
                Notes &amp; terms
              </h2>
            </div>
            <div className='grid gap-4'>
              <label className='block space-y-1.5'>
                <span className={fieldLabel}>Notes (visible on invoice)</span>
                <textarea
                  value={meta.notes}
                  onChange={(e) =>
                    setMeta((m) => ({ ...m, notes: e.target.value }))
                  }
                  className={textareaBase}
                  placeholder='Bank details, thank-you note, packaging info…'
                  rows={3}
                />
              </label>
              <label className='block space-y-1.5'>
                <span className={fieldLabel}>Terms &amp; conditions</span>
                <textarea
                  value={meta.terms}
                  onChange={(e) =>
                    setMeta((m) => ({ ...m, terms: e.target.value }))
                  }
                  className={textareaBase}
                  placeholder='Payment terms, jurisdiction, return policy…'
                  rows={4}
                />
              </label>
            </div>
          </section>

          {/* Seller (collapsed at the bottom — defaults usually fine) */}
          <section className={card}>
            <div className='mb-4 flex items-center gap-2'>
              <span className={sectionBadge}>5</span>
              <Building2 className='h-4 w-4 text-blue-600' />
              <h2 className='text-sm font-semibold text-gray-900'>
                Seller (your business)
              </h2>
              <span className='ml-2 text-[11px] text-gray-500'>
                Pre-filled — edit if your details change
              </span>
            </div>
            <div className='grid gap-4 sm:grid-cols-2'>
              <label className='block space-y-1.5'>
                <span className={fieldLabel}>Business name</span>
                <input
                  value={seller.name}
                  onChange={(e) =>
                    setSeller((s) => ({ ...s, name: e.target.value }))
                  }
                  className={inputBase}
                />
              </label>
              <label className='block space-y-1.5'>
                <span className={fieldLabel}>State</span>
                <input
                  list='indian-states'
                  value={seller.state}
                  onChange={(e) =>
                    setSeller((s) => ({ ...s, state: e.target.value }))
                  }
                  className={inputBase}
                />
              </label>
              <label className='block space-y-1.5 sm:col-span-2'>
                <span className={fieldLabel}>Address</span>
                <textarea
                  value={seller.address}
                  onChange={(e) =>
                    setSeller((s) => ({ ...s, address: e.target.value }))
                  }
                  className={textareaBase}
                  rows={2}
                />
              </label>
              <label className='block space-y-1.5'>
                <span className={fieldLabel}>GSTIN</span>
                <input
                  value={seller.gstin}
                  onChange={(e) =>
                    setSeller((s) => ({
                      ...s,
                      gstin: e.target.value.toUpperCase(),
                    }))
                  }
                  className={cn(inputBase, "tracking-wider")}
                  maxLength={15}
                />
              </label>
              <label className='block space-y-1.5'>
                <span className={fieldLabel}>PAN</span>
                <input
                  value={seller.pan}
                  onChange={(e) =>
                    setSeller((s) => ({
                      ...s,
                      pan: e.target.value.toUpperCase(),
                    }))
                  }
                  className={cn(inputBase, "tracking-wider")}
                  maxLength={10}
                />
              </label>
              <label className='block space-y-1.5'>
                <span className={fieldLabel}>Email</span>
                <input
                  value={seller.email}
                  onChange={(e) =>
                    setSeller((s) => ({ ...s, email: e.target.value }))
                  }
                  className={inputBase}
                />
              </label>
              <label className='block space-y-1.5'>
                <span className={fieldLabel}>Phone</span>
                <input
                  value={seller.phone}
                  onChange={(e) =>
                    setSeller((s) => ({ ...s, phone: e.target.value }))
                  }
                  className={inputBase}
                />
              </label>
            </div>
          </section>
        </div>

        {/* ─────────── PREVIEW (right column on desktop, drawer on mobile) ─────────── */}
        {/* Fixed height + min-h-0 flex chain so line items scroll inside the column and never sit under the viewport bottom / sticky save bar. */}
        <aside className='w-full min-h-0 lg:sticky lg:top-4 lg:z-10 lg:flex lg:h-[min(56rem,calc(100dvh-8.75rem))] lg:max-h-[min(56rem,calc(100dvh-8.75rem))] lg:flex-col lg:self-start lg:overflow-hidden'>
          <div className='hidden min-h-0 flex-1 flex-col gap-3 lg:flex'>
            <div className='flex shrink-0 items-center justify-between gap-2'>
              <h3 className='text-sm font-semibold text-gray-900'>
                Live preview
              </h3>
              <div className='flex items-center gap-2 text-[11px] text-gray-500'>
                <span className='inline-flex h-2 w-2 rounded-full bg-emerald-500' />
                Updates as you type
              </div>
            </div>
            <div className='min-h-0 flex-1 overflow-auto rounded-2xl border border-gray-200 bg-gray-50 p-3'>
              <ScaledPreview>
                <SalesInvoiceDocument
                  seller={seller}
                  buyer={buyer}
                  meta={meta}
                  lines={lines}
                  recordCreatedAt={recordCreatedAt}
                />
              </ScaledPreview>
            </div>
            <div className='shrink-0 pt-0.5'>
              <SummaryStrip totals={totals} taxMode={meta.taxMode} />
            </div>
          </div>

          {/* Mobile preview toggle */}
          <div className='lg:hidden'>
            <Button
              type='button'
              variant='outline'
              className='w-full rounded-xl'
              onClick={() => {
                if (previewOpenMobile) setPreviewOpenMobile(false);
                else handleScrollPreview();
              }}
            >
              {previewOpenMobile ?
                <>
                  <EyeOff className='mr-1.5 h-4 w-4' /> Hide preview
                </>
              : <>
                  <Eye className='mr-1.5 h-4 w-4' /> Show invoice preview
                </>
              }
            </Button>
            {previewOpenMobile ?
              <div ref={previewRef} className='mt-4 space-y-3'>
                <div className='rounded-2xl border border-gray-200 bg-gray-50 p-3'>
                  <ScaledPreview>
                    <SalesInvoiceDocument
                      seller={seller}
                      buyer={buyer}
                      meta={meta}
                      lines={lines}
                      recordCreatedAt={recordCreatedAt}
                    />
                  </ScaledPreview>
                </div>
                <SummaryStrip totals={totals} taxMode={meta.taxMode} />
              </div>
            : null}
          </div>
        </aside>
      </div>

      {/* When printing, the document is also rendered here so it's visible
          even if the preview pane is collapsed on small screens. */}
      <div className='hidden print:block'>
        <SalesInvoiceDocument
          seller={seller}
          buyer={buyer}
          meta={meta}
          lines={lines}
          recordCreatedAt={recordCreatedAt}
        />
      </div>

      {/* Sticky bottom action bar (mobile-friendly).
          On desktop we offset by the admin sidebar's collapsed width (76px) so the bar
          aligns with the page content instead of running under the sidebar. */}
      <div className='fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur-md sm:px-8 lg:left-[76px] print-hidden'>
        <div className='mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-x-4 gap-y-2'>
          <div className='flex flex-col text-xs text-gray-600 sm:flex-row sm:items-center sm:gap-3'>
            <span className='font-semibold text-gray-800'>
              Grand total:{" "}
              <span className='text-blue-700'>
                {formatINRMoney(totals.grandTotal)}
              </span>
            </span>
            <span className='hidden text-gray-300 sm:inline'>•</span>
            <span>
              {lines.length} item{lines.length === 1 ? "" : "s"} •{" "}
              {meta.taxMode === "cgst_sgst" ?
                "CGST+SGST"
              : meta.taxMode === "igst" ?
                "IGST"
              : "No tax"}
            </span>
          </div>
          <div className='flex flex-wrap gap-2'>
            <Button
              type='button'
              variant='outline'
              className='rounded-xl'
              onClick={() => void handleSave()}
              loading={saving}
            >
              <Save className='mr-1.5 h-4 w-4' /> Save
            </Button>
            <Button
              type='button'
              variant='brand'
              className='rounded-xl bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-400 min-w-[160px]'
              onClick={() => void handleSaveAndPrint()}
              loading={saving}
            >
              <Printer className='mr-1.5 h-4 w-4' /> Save &amp; print
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Sub-components ───────────────────────── */

/**
 * Renders the children at their natural width (default 850px — the invoice's
 * `max-w`) and proportionally scales the entire box down to fit the parent.
 *
 * Used so the live preview never gets horizontally cut off in the narrow
 * right column. The dedicated `print:block` instance elsewhere in the page
 * is unscaled, so the saved PDF is still full-size.
 */
function ScaledPreview({
  children,
  naturalWidth = 850,
}: {
  children: React.ReactNode;
  naturalWidth?: number;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [boxHeight, setBoxHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const recompute = () => {
      const w = outer.clientWidth;
      if (w <= 0) return;
      const s = Math.min(1, w / naturalWidth);
      setScale(s);
      setBoxHeight(inner.scrollHeight * s);
    };
    const ro = new ResizeObserver(recompute);
    ro.observe(outer);
    ro.observe(inner);
    recompute();
    return () => ro.disconnect();
  }, [naturalWidth]);

  return (
    <div
      ref={outerRef}
      className='relative w-full overflow-hidden'
      style={{ height: boxHeight }}
    >
      <div
        ref={innerRef}
        style={{
          width: naturalWidth,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function ToggleChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(pill, active ? pillActive : pillIdle)}
      aria-pressed={active}
    >
      {active ? "✓ " : ""}
      {label}
    </button>
  );
}

function SummaryStrip({
  totals,
  taxMode,
}: {
  totals: ReturnType<typeof computeTotals>;
  taxMode: TaxMode;
}) {
  return (
    <div className='rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-blue-50/40 p-4 shadow-sm'>
      <div className='grid grid-cols-2 gap-2 text-xs sm:grid-cols-4'>
        <div>
          <p className='text-[10px] uppercase tracking-wide text-gray-500'>
            Subtotal
          </p>
          <p className='font-bold tabular-nums text-gray-900'>
            {formatINRMoney(totals.subTotal)}
          </p>
        </div>
        <div>
          <p className='text-[10px] uppercase tracking-wide text-gray-500'>
            Discount
          </p>
          <p className='font-bold tabular-nums text-gray-900'>
            {totals.totalDiscount > 0 ?
              `− ${formatINRMoney(totals.totalDiscount)}`
            : "—"}
          </p>
        </div>
        <div>
          <p className='text-[10px] uppercase tracking-wide text-gray-500'>
            {taxMode === "cgst_sgst" ?
              "CGST + SGST"
            : taxMode === "igst" ?
              "IGST"
            : "Tax"}
          </p>
          <p className='font-bold tabular-nums text-gray-900'>
            {taxMode === "none" ? "—" : formatINRMoney(totals.totalGst)}
          </p>
        </div>
        <div>
          <p className='text-[10px] uppercase tracking-wide text-blue-600'>
            Grand total
          </p>
          <p className='font-extrabold tabular-nums text-blue-800 text-base'>
            {formatINRMoney(totals.grandTotal)}
          </p>
        </div>
      </div>
    </div>
  );
}

function ItemRow({
  index,
  line,
  taxMode,
  showHsn,
  showDiscount,
  showGst,
  onPatch,
  onDuplicate,
  onRemove,
  canRemove,
}: {
  index: number;
  line: InvoiceLine;
  taxMode: TaxMode;
  showHsn: boolean;
  showDiscount: boolean;
  showGst: boolean;
  onPatch: (p: Partial<InvoiceLine>) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const c = computeLine(line, taxMode);
  return (
    <div className='rounded-2xl border border-gray-200 bg-gray-50/40 p-4'>
      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <span className='text-[11px] font-bold uppercase tracking-wide text-gray-500'>
          Item {index + 1}
        </span>
        <div className='flex items-center gap-1'>
          <button
            type='button'
            onClick={onDuplicate}
            className='rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-600 hover:border-blue-300 hover:bg-blue-50/60 hover:text-blue-700'
          >
            Duplicate
          </button>
          <button
            type='button'
            onClick={onRemove}
            disabled={!canRemove}
            className={cn(
              "rounded-lg p-1.5 text-gray-400",
              canRemove ?
                "hover:bg-red-50 hover:text-red-600"
              : "cursor-not-allowed opacity-40",
            )}
            aria-label='Remove item'
          >
            <Trash2 className='h-4 w-4' />
          </button>
        </div>
      </div>

      <div className='grid gap-3 sm:grid-cols-12'>
        <label className='block space-y-1 sm:col-span-7'>
          <span className={fieldLabel}>Description</span>
          <input
            value={line.description}
            onChange={(e) => onPatch({ description: e.target.value })}
            className={inputBase}
            placeholder='e.g. Banarasi silk saree — wholesale lot'
          />
        </label>
        {showHsn ?
          <label className='block space-y-1 sm:col-span-5'>
            <span className={fieldLabel}>HSN / SAC</span>
            <input
              value={line.hsn}
              onChange={(e) => onPatch({ hsn: e.target.value })}
              className={inputBase}
              placeholder='e.g. 5407'
            />
          </label>
        : null}

        <label className='block space-y-1 sm:col-span-3'>
          <span className={fieldLabel}>Unit</span>
          <select
            value={line.unit}
            onChange={(e) => onPatch({ unit: e.target.value as UnitValue })}
            className={inputBase}
          >
            {UNIT_OPTIONS.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </label>
        {line.unit === "custom" ?
          <label className='block space-y-1 sm:col-span-3'>
            <span className={fieldLabel}>Custom unit</span>
            <input
              value={line.customUnit}
              onChange={(e) => onPatch({ customUnit: e.target.value })}
              className={inputBase}
              placeholder='e.g. roll, bundle'
            />
          </label>
        : null}
        <label className='block space-y-1 sm:col-span-2'>
          <span className={fieldLabel}>Qty</span>
          <input
            type='number'
            min={0}
            step={0.01}
            value={line.qty}
            onChange={(e) => onPatch({ qty: Number(e.target.value) })}
            className={inputBase}
          />
        </label>
        <label
          className={cn(
            "block space-y-1",
            line.unit === "custom" ? "sm:col-span-4" : "sm:col-span-4",
          )}
        >
          <span className={fieldLabel}>Rate (₹ per unit)</span>
          <input
            type='number'
            min={0}
            step={0.01}
            value={line.rate}
            onChange={(e) => onPatch({ rate: Number(e.target.value) })}
            className={inputBase}
            placeholder='0.00'
          />
        </label>

        {showDiscount ?
          <label className='block space-y-1 sm:col-span-3'>
            <span className={fieldLabel}>Discount %</span>
            <input
              type='number'
              min={0}
              max={100}
              step={0.5}
              value={line.discountPct}
              onChange={(e) => onPatch({ discountPct: Number(e.target.value) })}
              className={inputBase}
              placeholder='0'
            />
          </label>
        : null}

        {showGst ?
          <div className='space-y-1 sm:col-span-9'>
            <span className={fieldLabel}>GST %</span>
            <div className='flex flex-wrap items-center gap-2'>
              {GST_RATE_PRESETS.map((rate) => (
                <button
                  key={rate}
                  type='button'
                  onClick={() => onPatch({ gstPct: rate })}
                  className={cn(
                    "rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                    line.gstPct === rate ?
                      "border-blue-400 bg-blue-50 text-blue-800"
                    : "border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:bg-blue-50/40",
                  )}
                >
                  {rate}%
                </button>
              ))}
              <div className='ml-1 flex items-center gap-1.5'>
                <span className='text-[11px] text-gray-500'>Custom</span>
                <input
                  type='number'
                  min={0}
                  max={100}
                  step={0.5}
                  value={line.gstPct}
                  onChange={(e) => onPatch({ gstPct: Number(e.target.value) })}
                  className='h-9 w-20 rounded-lg border border-gray-200 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300'
                />
              </div>
            </div>
          </div>
        : null}
      </div>

      {/* Per-row computed peek */}
      <div className='mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/70 px-3 py-2 text-[11px] text-gray-600 ring-1 ring-gray-100'>
        <span>
          Taxable:{" "}
          <span className='font-semibold tabular-nums text-gray-900'>
            {formatINRMoney(c.taxable)}
          </span>
        </span>
        {showGst ?
          <span>
            GST ({line.gstPct || 0}%):{" "}
            <span className='font-semibold tabular-nums text-gray-900'>
              {formatINRMoney(c.gstAmt)}
            </span>
          </span>
        : null}
        <span>
          Line total:{" "}
          <span className='font-bold tabular-nums text-blue-700'>
            {formatINRMoney(c.total)}
          </span>
        </span>
      </div>
    </div>
  );
}
