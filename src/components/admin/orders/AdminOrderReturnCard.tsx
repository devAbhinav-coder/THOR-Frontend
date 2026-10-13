"use client";

import { useState } from "react";
import { Check, RotateCcw, Undo2, X } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/api";
import type { Order } from "@/types";
import { Button } from "@/components/ui/button";
import { cn, formatDateTime, formatPrice } from "@/lib/utils";
import AdminOrderSectionCard, { MicroLabel } from "./AdminOrderSectionCard";
import AdminCopyButton from "./AdminCopyButton";

const RETURN_STATUS_PILL: Record<string, string> = {
  requested: "bg-amber-100 text-amber-900 ring-amber-200",
  approved: "bg-emerald-100 text-emerald-900 ring-emerald-200",
  rejected: "bg-red-100 text-red-900 ring-red-200",
  completed: "bg-gray-200 text-gray-800 ring-gray-300",
};

export default function AdminOrderReturnCard({
  order,
  onUpdated,
  onProcessRefund,
}: {
  order: Order;
  onUpdated: (order: Order) => void;
  onProcessRefund: () => void;
}) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);

  const status = order.returnStatus;
  if (!status || status === "none") return null;

  const req = order.returnRequest;
  const bank = req?.userBankDetails;
  const refund = order.refundData;

  const resolve = async (action: "approve" | "reject") => {
    if (
      !window.confirm(
        action === "approve" ?
          "Approve this return? Customer will be notified and refund becomes available."
        : "Reject this return request? Customer will be notified.",
      )
    )
      return;
    setBusy(action);
    try {
      const res = await adminApi.resolveReturn(order._id, {
        action,
        adminNote: note.trim() || undefined,
      });
      toast.success(
        action === "approve" ? "Return approved" : "Return rejected",
      );
      onUpdated(res.data.order);
      setNote("");
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message || "Failed to resolve return",
      );
    } finally {
      setBusy(null);
    }
  };

  const bankRows: [string, string | undefined][] = [
    ["Account name", bank?.accountName],
    ["Account number", bank?.accountNumber],
    ["IFSC", bank?.ifscCode],
    ["Bank", bank?.bankName],
  ];

  return (
    <AdminOrderSectionCard
      id='return'
      icon={RotateCcw}
      tone='amber'
      title='Return & refund'
      description={
        req?.requestedAt ?
          `Requested ${formatDateTime(req.requestedAt)}`
        : "Customer-initiated return flow"
      }
      className='border-amber-200/80'
      action={
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset capitalize",
            RETURN_STATUS_PILL[status] ?? "bg-gray-100 text-gray-800 ring-gray-200",
          )}
        >
          {status.replace(/_/g, " ")}
        </span>
      }
    >
      <div className='space-y-4'>
        {(req?.reason || req?.note) && (
          <div className='rounded-xl bg-amber-50/70 border border-amber-100 px-4 py-3'>
            <MicroLabel className='text-amber-700/80 mb-1'>Reason</MicroLabel>
            <p className='text-sm text-amber-950 font-medium'>{req?.reason || "-"}</p>
            {req?.note ?
              <p className='text-sm text-amber-900/90 mt-1 whitespace-pre-wrap'>
                {req.note}
              </p>
            : null}
          </div>
        )}

        <div className='grid sm:grid-cols-2 gap-3'>
          {req?.refundMethod ?
            <div className='rounded-xl border border-gray-200 px-4 py-3'>
              <MicroLabel className='mb-1'>Refund method requested</MicroLabel>
              <p className='text-sm font-semibold text-gray-900 capitalize'>
                {req.refundMethod.replace(/_/g, " ")}
              </p>
            </div>
          : null}
          {bank && Object.values(bank).some(Boolean) ?
            <div className='rounded-xl border border-gray-200 px-4 py-3 sm:col-span-2'>
              <MicroLabel className='mb-2'>Customer payout details</MicroLabel>
              {req?.refundMethod === "upi" || bank.upiId ?
                <div className='flex items-center justify-between gap-2'>
                  <p className='text-sm'>
                    <span className='text-gray-500'>UPI ID</span>{" "}
                    <span className='font-mono font-semibold text-gray-900'>
                      {bank.upiId}
                    </span>
                  </p>
                  {bank.upiId ?
                    <AdminCopyButton value={bank.upiId} label='Copy UPI' />
                  : null}
                </div>
              : <dl className='grid grid-cols-2 gap-x-4 gap-y-2'>
                  {bankRows
                    .filter(([, v]) => v)
                    .map(([label, value]) => (
                      <div key={label} className='min-w-0'>
                        <dt className='text-[11px] text-gray-500'>{label}</dt>
                        <dd className='flex items-center gap-1 text-sm font-semibold text-gray-900 font-mono break-all'>
                          {value}
                          <AdminCopyButton value={value!} label={`Copy ${label}`} iconOnly />
                        </dd>
                      </div>
                    ))}
                </dl>
              }
            </div>
          : null}
        </div>

        {status === "requested" ?
          <div className='rounded-xl border border-dashed border-amber-200 bg-amber-50/40 p-4 space-y-3'>
            <MicroLabel className='text-amber-700/80'>Decide</MicroLabel>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder='Note to customer (optional) - included in the email'
              rows={2}
              className='w-full px-3.5 py-2.5 border border-amber-200 bg-white rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-300'
            />
            <div className='flex flex-col sm:flex-row gap-2'>
              <Button
                type='button'
                className='flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5'
                loading={busy === "approve"}
                disabled={busy !== null}
                onClick={() => void resolve("approve")}
              >
                <Check className='h-4 w-4' /> Approve return
              </Button>
              <Button
                type='button'
                variant='outline'
                className='flex-1 rounded-xl border-red-200 text-red-700 hover:bg-red-50 gap-1.5'
                loading={busy === "reject"}
                disabled={busy !== null}
                onClick={() => void resolve("reject")}
              >
                <X className='h-4 w-4' /> Reject
              </Button>
            </div>
          </div>
        : null}

        {status === "approved" && order.status !== "refunded" ?
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3'>
            <p className='text-sm text-emerald-950'>
              Return approved — refund is pending. Eligible amount excludes
              shipping / COD fees.
            </p>
            <Button
              type='button'
              className='rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shrink-0 gap-1.5'
              onClick={onProcessRefund}
            >
              <Undo2 className='h-4 w-4' /> Process refund
            </Button>
          </div>
        : null}

        {refund ?
          <div className='rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 text-sm'>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <p>
                <span className='text-gray-500'>Refunded</span>{" "}
                <span className='font-bold text-gray-900 tabular-nums'>
                  {formatPrice(refund.amount)}
                </span>{" "}
                <span className='text-gray-500'>via</span>{" "}
                <span className='font-semibold capitalize'>
                  {String(refund.method).replace(/_/g, " ")}
                </span>
              </p>
              {refund.processedAt ?
                <p className='text-xs text-gray-500'>{formatDateTime(refund.processedAt)}</p>
              : null}
            </div>
            {refund.gatewayRefundId ?
              <p className='text-xs text-gray-500 mt-1 flex items-center gap-1'>
                Gateway ref{" "}
                <span className='font-mono text-gray-800'>{refund.gatewayRefundId}</span>
                <AdminCopyButton value={refund.gatewayRefundId} label='Copy ref' iconOnly />
              </p>
            : null}
            {(refund.nonRefundableFees ?? 0) > 0 ?
              <p className='text-xs text-amber-800 mt-1'>
                Non-refundable fees retained:{" "}
                <span className='font-semibold tabular-nums'>
                  {formatPrice(refund.nonRefundableFees!)}
                </span>
              </p>
            : null}
            {refund.notes ?
              <p className='text-xs text-gray-600 mt-1 whitespace-pre-wrap'>{refund.notes}</p>
            : null}
          </div>
        : null}
      </div>
    </AdminOrderSectionCard>
  );
}
