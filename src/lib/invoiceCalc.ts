/**
 * Pure helpers for the admin Sales Invoice generator.
 *
 * Kept framework-free so they can be unit-tested without React, and so the
 * print preview component (`SalesInvoiceDocument`) and the form page can
 * share the exact same totals math.
 */

/** Common Indian-trade GST rates. Admin can also type a custom % per row. */
export const GST_RATE_PRESETS = [0, 3, 5, 12, 18, 28] as const;

/** Frequently used selling units in B2B sarees / fabric / hampers. */
export const UNIT_OPTIONS = [
  { value: "pcs", label: "pcs" },
  { value: "mtr", label: "meter" },
  { value: "kg", label: "kg" },
  { value: "gm", label: "gram" },
  { value: "ltr", label: "ltr" },
  { value: "set", label: "set" },
  { value: "box", label: "box" },
  { value: "pkt", label: "pkt" },
  { value: "dozen", label: "dozen" },
  { value: "hr", label: "hour" },
  { value: "day", label: "day" },
  { value: "custom", label: "Custom…" },
] as const;

export type UnitValue = (typeof UNIT_OPTIONS)[number]["value"];

/** Single editable invoice line. */
export type InvoiceLine = {
  id: string;
  description: string;
  hsn: string;
  unit: UnitValue;
  customUnit: string;
  qty: number;
  rate: number;
  /** 0–100. Subtracted from the line subtotal before GST. */
  discountPct: number;
  /** 0–100. */
  gstPct: number;
};

/** Per-row computed totals — re-derived on every render to stay correct. */
export type ComputedLine = {
  /** Final unit label (substitutes the `customUnit` text when unit === "custom"). */
  unitLabel: string;
  /** qty × rate */
  gross: number;
  /** discountPct % of gross (₹) */
  discountAmt: number;
  /** gross − discountAmt */
  taxable: number;
  /** taxable × gstPct% */
  gstAmt: number;
  /** taxable + gstAmt */
  total: number;
};

export type InvoiceTotals = {
  /** Sum of pre-tax line amounts (after per-row discount). */
  subTotal: number;
  /** Sum of all per-row discount amounts (₹). */
  totalDiscount: number;
  /** Sum of all per-row GST. */
  totalGst: number;
  /** When `taxMode === 'cgst_sgst'`: half of `totalGst`. Else 0. */
  cgst: number;
  /** Same as `cgst` (intra-state SGST mirror). */
  sgst: number;
  /** When `taxMode === 'igst'`: equal to `totalGst`. Else 0. */
  igst: number;
  /** subTotal + totalGst (before round-off). */
  rawTotal: number;
  /** Sign-aware difference between rounded and raw total (₹). */
  roundOff: number;
  /** rawTotal + roundOff (final, integer-rupee invoice value). */
  grandTotal: number;
};

export type TaxMode = "cgst_sgst" | "igst" | "none";

export function emptyLine(id: string): InvoiceLine {
  return {
    id,
    description: "",
    hsn: "",
    /** Default meter + 0% GST — typical offline fabric/B2B; admin sets GST when using a taxed mode. */
    unit: "mtr",
    customUnit: "",
    qty: 1,
    rate: 0,
    discountPct: 0,
    gstPct: 0,
  };
}

export function unitLabelFor(line: InvoiceLine): string {
  if (line.unit === "custom")
    return (line.customUnit ?? "").trim() || "unit";
  const found = UNIT_OPTIONS.find((u) => u.value === line.unit);
  return found?.label ?? line.unit;
}

function safeNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Per-line money. `gstPct` is always stored on the line; when `taxMode === "none"`,
 * GST is not added to the line total (matches invoice totals / Non-GST bills).
 */
export function computeLine(line: InvoiceLine, taxMode: TaxMode): ComputedLine {
  const qty = Math.max(0, safeNum(line.qty));
  const rate = Math.max(0, safeNum(line.rate));
  const discountPct = Math.min(100, Math.max(0, safeNum(line.discountPct)));
  const gstPct = Math.min(100, Math.max(0, safeNum(line.gstPct)));

  const gross = qty * rate;
  const discountAmt = (gross * discountPct) / 100;
  const taxable = gross - discountAmt;
  const gstAmtRaw = (taxable * gstPct) / 100;
  const includeGst = taxMode !== "none";
  const gstAmt = includeGst ? gstAmtRaw : 0;
  const total = taxable + gstAmt;

  return {
    unitLabel: unitLabelFor(line),
    gross,
    discountAmt,
    taxable,
    gstAmt,
    total,
  };
}

export function computeTotals(
  lines: InvoiceLine[],
  taxMode: TaxMode,
): InvoiceTotals {
  const list = Array.isArray(lines) ? lines : [];
  let subTotal = 0;
  let totalDiscount = 0;
  let totalGst = 0;
  for (const line of list) {
    const c = computeLine(line, taxMode);
    subTotal += c.taxable;
    totalDiscount += c.discountAmt;
    totalGst += c.gstAmt;
  }
  const rawTotal = subTotal + totalGst;
  const grandTotal = Math.round(rawTotal);
  const roundOff = grandTotal - rawTotal;

  return {
    subTotal,
    totalDiscount,
    totalGst,
    cgst: taxMode === "cgst_sgst" ? totalGst / 2 : 0,
    sgst: taxMode === "cgst_sgst" ? totalGst / 2 : 0,
    igst: taxMode === "igst" ? totalGst : 0,
    rawTotal,
    roundOff,
    grandTotal,
  };
}

/* ── Indian numbering: amount in words ─────────────────────────────────── */

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function twoDigits(n: number): string {
  if (n === 0) return "";
  if (n < 20) return ONES[n]!;
  const t = Math.floor(n / 10);
  const u = n % 10;
  return TENS[t]! + (u ? " " + ONES[u]! : "");
}

function threeDigits(n: number): string {
  if (n === 0) return "";
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const headPart = h ? ONES[h]! + " Hundred" : "";
  const tailPart = twoDigits(rest);
  return [headPart, tailPart].filter(Boolean).join(" ");
}

/** Convert a non-negative integer to Indian-style words (Crore/Lakh/Thousand/Hundred). */
function intToIndianWords(num: number): string {
  if (num === 0) return "Zero";
  const crore = Math.floor(num / 1_00_00_000);
  const lakh = Math.floor((num % 1_00_00_000) / 1_00_000);
  const thousand = Math.floor((num % 1_00_000) / 1_000);
  const remainder = num % 1_000;

  const parts = [
    crore ? twoDigits(crore) + " Crore" : "",
    lakh ? twoDigits(lakh) + " Lakh" : "",
    thousand ? twoDigits(thousand) + " Thousand" : "",
    threeDigits(remainder),
  ].filter(Boolean);

  return parts.join(" ").replace(/\s+/g, " ").trim();
}

/**
 * Convert a rupee amount (with paise) to a typical Indian-invoice phrasing,
 * e.g. `12,345.50 → "Rupees Twelve Thousand Three Hundred Forty Five and Fifty Paise Only"`.
 */
export function rupeesInWords(amount: number): string {
  const safe = Math.max(0, Math.round(safeNum(amount) * 100) / 100);
  const rupees = Math.floor(safe);
  const paise = Math.round((safe - rupees) * 100);

  const rupeesWords = intToIndianWords(rupees);
  if (paise === 0) return `Rupees ${rupeesWords} Only`;
  return `Rupees ${rupeesWords} and ${twoDigits(paise)} Paise Only`;
}

/* ── Currency display (with paise — different from formatPrice which floors) ── */

export function formatINRMoney(amount: number): string {
  const safe = safeNum(amount);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe);
}

/** Suggest a sensible default invoice number — admin can overwrite. */
export function suggestInvoiceNumber(now: Date = new Date()): string {
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  /** Random 3-digit suffix — keeps two invoices in the same minute distinguishable. */
  const seq = Math.floor(Math.random() * 900 + 100);
  return `INV-${yy}${mm}${dd}-${seq}`;
}
