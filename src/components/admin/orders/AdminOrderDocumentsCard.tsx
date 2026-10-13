"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, FileText, Loader2, Receipt, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/api";
import type { Order } from "@/types";
import { cn, formatDateTime } from "@/lib/utils";
import AdminOrderSectionCard from "./AdminOrderSectionCard";

export function getLinkedTaxInvoiceId(order: Order): string | null {
  const raw = order.taxSalesInvoiceId;
  if (!raw) return null;
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && raw !== null && "_id" in raw) {
    return String((raw as { _id: string })._id);
  }
  return null;
}

function linkedTaxInvoiceNumber(order: Order): string | null {
  const raw = order.taxSalesInvoiceId;
  if (raw && typeof raw === "object" && "invoiceNumber" in raw) {
    return (raw as { invoiceNumber?: string }).invoiceNumber ?? null;
  }
  return null;
}

export default function AdminOrderDocumentsCard({
  order,
  onOrderUpdated,
}: {
  order: Order;
  onOrderUpdated: (order: Order) => void;
}) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [creatingTax, setCreatingTax] = useState(false);

  const invoiceEligible =
    order.paymentStatus === "paid" || order.status === "delivered";
  const isB2b = order.offlineMeta?.source === "b2b";
  const taxId = getLinkedTaxInvoiceId(order);
  const taxNo = linkedTaxInvoiceNumber(order);

  const generateInvoice = async () => {
    if (!invoiceEligible) return;
    setGenerating(true);
    try {
      await adminApi.generateOrderInvoice(order._id);
      toast.success("Invoice generated");
      const refreshed = await adminApi.getOrderDetails(order._id);
      onOrderUpdated(refreshed.data.order as Order);
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message || "Failed to generate invoice",
      );
    } finally {
      setGenerating(false);
    }
  };

  const createTaxInvoice = async () => {
    setCreatingTax(true);
    try {
      const res = await adminApi.createTaxInvoiceFromOrder(order._id);
      const invoiceId = res.data.invoice.id;
      toast.success("GST tax invoice created");
      router.push(`/admin/invoices/new?id=${encodeURIComponent(invoiceId)}`);
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message || "Failed to create tax invoice",
      );
    } finally {
      setCreatingTax(false);
    }
  };

  return (
    <AdminOrderSectionCard
      id='documents'
      icon={FileText}
      tone='navy'
      title='Documents'
      bodyClassName='space-y-2'
    >
      {/* Order invoice (THOR) */}
      <DocRow
        icon={FileText}
        title='Order invoice'
        subtitle={
          order.invoice?.isGenerated ?
            `Generated${order.invoice.generatedAt ? ` · ${formatDateTime(order.invoice.generatedAt)}` : ""}`
          : invoiceEligible ? "Not generated yet"
          : "Available once paid or delivered"
        }
        status={order.invoice?.isGenerated ? "ready" : invoiceEligible ? "pending" : "locked"}
      >
        {order.invoice?.isGenerated ?
          <Link
            href={`/admin/orders/${encodeURIComponent(order._id)}/invoice`}
            className='inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-navy-900 text-white text-xs font-semibold hover:bg-navy-800'
          >
            View <ExternalLink className='h-3 w-3' />
          </Link>
        : null}
        <button
          type='button'
          disabled={!invoiceEligible || generating}
          onClick={() => void generateInvoice()}
          title={order.invoice?.isGenerated ? "Regenerate" : "Generate"}
          className={cn(
            "inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border text-xs font-semibold transition-colors",
            invoiceEligible ?
              "border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
            : "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed",
          )}
        >
          {generating ?
            <Loader2 className='h-3.5 w-3.5 animate-spin' />
          : <RefreshCw className='h-3.5 w-3.5' />}
          {order.invoice?.isGenerated ? "Regenerate" : "Generate"}
        </button>
      </DocRow>

      {/* GST tax invoice (B2B) */}
      {isB2b ?
        <DocRow
          icon={Receipt}
          title='GST tax invoice'
          subtitle={
            taxId ?
              `Linked${taxNo ? ` · ${taxNo}` : ""} (INV series)`
            : "Separate INV- number from the THOR order number"
          }
          status={taxId ? "ready" : "pending"}
        >
          {taxId ?
            <Link
              href={`/admin/invoices/new?id=${encodeURIComponent(taxId)}`}
              className='inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800'
            >
              Open <ExternalLink className='h-3 w-3' />
            </Link>
          : <button
              type='button'
              disabled={creatingTax}
              onClick={() => void createTaxInvoice()}
              className='inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-900 text-xs font-semibold hover:bg-emerald-100 disabled:opacity-60'
            >
              {creatingTax ?
                <Loader2 className='h-3.5 w-3.5 animate-spin' />
              : <Receipt className='h-3.5 w-3.5' />}
              Create
            </button>
          }
        </DocRow>
      : null}
    </AdminOrderSectionCard>
  );
}

function DocRow({
  icon: Icon,
  title,
  subtitle,
  status,
  children,
}: {
  icon: typeof FileText;
  title: string;
  subtitle: string;
  status: "ready" | "pending" | "locked";
  children: React.ReactNode;
}) {
  return (
    <div className='flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-2.5'>
      <span
        className={cn(
          "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
          status === "ready" ? "bg-emerald-50 text-emerald-700"
          : status === "pending" ? "bg-amber-50 text-amber-700"
          : "bg-gray-100 text-gray-400",
        )}
      >
        <Icon className='h-4 w-4' />
      </span>
      <div className='min-w-0 flex-1'>
        <p className='text-sm font-semibold text-gray-900 leading-tight'>{title}</p>
        <p className='text-[11px] text-gray-500 truncate'>{subtitle}</p>
      </div>
      <div className='flex items-center gap-1.5 shrink-0'>{children}</div>
    </div>
  );
}
