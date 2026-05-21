/** Shared types & GST math for purchase (procurement) invoices — Indian CGST/SGST/IGST. */

export interface PurchaseLineItem {
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

export interface PurchaseInvoice {
  _id: string;
  invoiceNumber: string;
  supplierName: string;
  supplierGstin?: string;
  supplyType: 'intra' | 'inter';
  invoiceDate: string;
  lineItems: PurchaseLineItem[];
  totalTaxable: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTax: number;
  grandTotal: number;
  paymentStatus: 'unpaid' | 'paid' | 'partial';
  paidAmount: number;
  notes?: string;
  createdAt?: string;
  createdBy?: { name?: string; email?: string };
}

export interface PurchaseInvoiceSummary {
  invoiceCount: number;
  grandTotal: number;
  totalTaxable: number;
  totalTax: number;
  unpaidCount: number;
  partialCount: number;
  outstandingPayable: number;
}

export function generateInvoiceNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `PUR-${date}-${rand}`;
}

export function calcLine(
  q: number,
  cost: number,
  rate: number,
  supplyType: 'intra' | 'inter',
) {
  const taxable = Math.round(q * cost * 100) / 100;
  const gst = Math.round((taxable * rate) / 100 * 100) / 100;
  const cgst = supplyType === 'intra' ? Math.round((gst / 2) * 100) / 100 : 0;
  const sgst = supplyType === 'intra' ? Math.round((gst / 2) * 100) / 100 : 0;
  const igst = supplyType === 'inter' ? gst : 0;
  return { taxableAmount: taxable, cgst, sgst, igst, lineTotal: taxable + gst };
}

export const EMPTY_LINE = (): PurchaseLineItem => ({
  productName: '',
  sku: '',
  variantLabel: '',
  quantity: 1,
  unitCost: 0,
  hsn: '',
  gstRate: 18,
  taxableAmount: 0,
  cgst: 0,
  sgst: 0,
  igst: 0,
  lineTotal: 0,
});

export const GST_RATES = [0, 3, 5, 12, 18, 28] as const;

export function supplyTypeLabel(type: 'intra' | 'inter') {
  return type === 'intra' ? 'Intra-State (CGST + SGST)' : 'Inter-State (IGST)';
}

export function amountInWordsIndian(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '';
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function two(n: number): string {
    if (n < 20) return ones[n] ?? '';
    return `${tens[Math.floor(n / 10)] ?? ''} ${ones[n % 10]}`.trim();
  }

  function three(n: number): string {
    if (n < 100) return two(n);
    return `${ones[Math.floor(n / 100)]} Hundred ${two(n % 100)}`.trim();
  }

  const rupees = Math.floor(n);
  const paise = Math.round((n - rupees) * 100);
  if (rupees === 0 && paise === 0) return 'Zero Rupees Only';

  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const hundred = rupees % 1000;

  const parts: string[] = [];
  if (crore) parts.push(`${three(crore)} Crore`);
  if (lakh) parts.push(`${two(lakh)} Lakh`);
  if (thousand) parts.push(`${two(thousand)} Thousand`);
  if (hundred) parts.push(three(hundred));

  let words = parts.join(' ').replace(/\s+/g, ' ').trim();
  words = words ? `${words} Rupees` : 'Zero Rupees';
  if (paise > 0) words += ` and ${two(paise)} Paise`;
  return `${words} Only`;
}
