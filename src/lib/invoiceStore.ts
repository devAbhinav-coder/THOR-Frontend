/**
 * Admin sales-invoice store — server-backed via `/api/admin/invoices`.
 *
 * Uses the shared `api` axios instance + `unwrapAxios` directly instead of
 * `adminApi.*` so save/list never hit "is not a function" from stale HMR /
 * partial module evaluation.
 *
 * Invoice response schemas come from `invoiceApiSchemas.ts` (Zod-only) so
 * `parseApiResponse` always receives a real schema — never `undefined`.
 */

import { api } from "@/lib/api";
import {
  adminSalesInvoiceList,
  adminSalesInvoiceSingle,
} from "@/lib/invoiceApiSchemas";
import { successMessageData } from "@/lib/api-schemas";
import { unwrapAxios } from "@/lib/parseApi";
import type {
  AdminSalesInvoice,
  AdminSalesInvoiceWriteBody,
} from "@/types";

/** Re-exported under the legacy name so existing imports keep working. */
export type SavedInvoice = AdminSalesInvoice;

export async function listInvoices(): Promise<SavedInvoice[]> {
  try {
    const res = await unwrapAxios(
      "admin.invoices.list",
      api.get("/admin/invoices", { params: { limit: 100 } }),
      adminSalesInvoiceList,
    );
    const list = res?.data?.invoices;
    return Array.isArray(list) ? (list as SavedInvoice[]) : [];
  } catch {
    return [];
  }
}

export async function getInvoice(id: string): Promise<SavedInvoice | null> {
  if (!id) return null;
  try {
    const res = await unwrapAxios(
      "admin.invoices.get",
      api.get(`/admin/invoices/${encodeURIComponent(id)}`),
      adminSalesInvoiceSingle,
    );
    return (res.data?.invoice ?? null) as SavedInvoice | null;
  } catch {
    return null;
  }
}

export type SaveInvoiceInput = AdminSalesInvoiceWriteBody & { id?: string };

export async function saveInvoice(
  input: SaveInvoiceInput,
): Promise<SavedInvoice> {
  const payload: AdminSalesInvoiceWriteBody = {
    seller: input.seller,
    buyer: input.buyer,
    meta: input.meta,
    lines: input.lines,
  };
  const res =
    input.id ?
      await unwrapAxios(
        "admin.invoices.update",
        api.put(`/admin/invoices/${encodeURIComponent(input.id)}`, payload),
        adminSalesInvoiceSingle,
      )
    : await unwrapAxios(
        "admin.invoices.create",
        api.post("/admin/invoices", payload),
        adminSalesInvoiceSingle,
      );
  return res.data.invoice as SavedInvoice;
}

export async function deleteInvoice(id: string): Promise<void> {
  if (!id) return;
  await unwrapAxios(
    "admin.invoices.delete",
    api.delete(`/admin/invoices/${encodeURIComponent(id)}`),
    successMessageData,
  );
}
