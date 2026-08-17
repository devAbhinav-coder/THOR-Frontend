/**
 * Document numbering — keep prefixes consistent in admin UI.
 *
 * - **THOR-…** — order reference (The House of Rani)
 * - **INV-…** — B2B GST tax invoice (`/admin/invoices`)
 */

export const ORDER_REF_PREFIX = "THOR";

export const B2B_TAX_INVOICE_PREFIX = "INV";

/** Order PDF / receipt — same as order number (THOR-…), not INV-THOR-…. */
export function orderInvoiceNumber(orderNumber: string): string {
  return orderNumber.trim();
}

/** Default number for new B2B GST tax invoices. */
export function suggestB2bTaxInvoiceNumber(now: Date = new Date()): string {
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const seq = Math.floor(Math.random() * 900 + 100);
  return `${B2B_TAX_INVOICE_PREFIX}-${yy}${mm}${dd}-${seq}`;
}

/** @deprecated Use suggestB2bTaxInvoiceNumber — kept for invoiceCalc imports. */
export function suggestInvoiceNumber(now: Date = new Date()): string {
  return suggestB2bTaxInvoiceNumber(now);
}
