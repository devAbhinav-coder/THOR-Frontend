import { z } from "zod";

/**
 * Response envelopes for `GET/POST/PUT /admin/invoices`.
 * Lives in its own file (only `zod`) so `invoiceStore` never depends on the
 * full `api-schemas` graph — avoids rare cases where `import * as schemas`
 * yields `undefined` for these keys during module init / HMR.
 */

const salesInvoiceLine = z.object({
  description: z.string(),
  hsn: z.string().optional(),
  unit: z.enum([
    "pcs",
    "mtr",
    "kg",
    "gm",
    "ltr",
    "set",
    "box",
    "pkt",
    "dozen",
    "hr",
    "day",
    "custom",
  ]),
  customUnit: z.string().optional(),
  qty: z.number(),
  rate: z.number(),
  discountPct: z.number(),
  gstPct: z.number(),
});

const salesInvoiceSeller = z.object({
  name: z.string(),
  address: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  gstin: z.string().optional(),
  pan: z.string().optional(),
  state: z.string().optional(),
});

const salesInvoiceBuyer = z.object({
  name: z.string().optional(),
  companyName: z.string().optional(),
  gstin: z.string().optional(),
  pan: z.string().optional(),
  address: z.string().optional(),
  state: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
});

const salesInvoiceMeta = z.object({
  invoiceNumber: z.string(),
  invoiceDate: z.string(),
  dueDate: z.string().optional(),
  poNumber: z.string().optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  taxMode: z.enum(["cgst_sgst", "igst", "none"]),
  showHsn: z.boolean(),
  showDiscount: z.boolean(),
  showGstColumn: z.boolean(),
});

const salesInvoice = z.object({
  id: z.string(),
  updatedAt: z.string(),
  createdAt: z.string(),
  invoiceNumber: z.string(),
  invoiceDate: z.string(),
  taxMode: z.enum(["cgst_sgst", "igst", "none"]),
  itemCount: z.number(),
  grandTotal: z.number(),
  subTotal: z.number(),
  totalDiscount: z.number(),
  totalGst: z.number(),
  seller: salesInvoiceSeller,
  buyer: salesInvoiceBuyer,
  meta: salesInvoiceMeta,
  lines: z.array(salesInvoiceLine),
});

export const adminSalesInvoiceSingle = z.object({
  status: z.string(),
  data: z.object({ invoice: salesInvoice }),
});

export const adminSalesInvoiceList = z.object({
  status: z.string(),
  data: z.object({ invoices: z.array(salesInvoice) }),
  pagination: z
    .object({
      currentPage: z.number(),
      totalPages: z.number(),
      total: z.number(),
      hasNextPage: z.boolean(),
      hasPrevPage: z.boolean(),
    })
    .optional(),
});
