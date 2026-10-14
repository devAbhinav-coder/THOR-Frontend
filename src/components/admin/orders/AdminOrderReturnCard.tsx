"use client";

import { useState } from "react";
import {
  Check,
  PackageCheck,
  RotateCcw,
  Truck,
  Undo2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/api";
import type { Order } from "@/types";
import { Button } from "@/components/ui/button";
import { cn, formatDateTime, formatPrice } from "@/lib/utils";
import {
  adminReturnChannelLabel,
  RETURN_STATUS_LABELS,
  RETURN_STEPS,
  returnStepIndex,
} from "@/lib/orderReturnHelpers";
import AdminOrderSectionCard, { MicroLabel } from "./AdminOrderSectionCard";
import AdminCopyButton from "./AdminCopyButton";

const RETURN_STATUS_PILL: Record<string, string> = {
  requested: "bg-amber-100 text-amber-900 ring-amber-200",
  approved: "bg-sky-100 text-sky-900 ring-sky-200",
  picked_up: "bg-indigo-100 text-indigo-900 ring-indigo-200",
  received: "bg-emerald-100 text-emerald-900 ring-emerald-200",
  rejected: "bg-red-100 text-red-900 ring-red-200",
  returned: "bg-gray-200 text-gray-800 ring-gray-300",
};

const inputClass =
  "w-full px-3.5 py-2.5 border border-gray-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300";

type BusyAction = "approve" | "reject" | "pickup" | "receive" | null;

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
  const [carrier, setCarrier] = useState("");
  const [awb, setAwb] = useState("");
  const [condition, setCondition] = useState<"resellable" | "damaged">(
    "resellable",
  );
  const [busy, setBusy] = useState<BusyAction>(null);

  const status = order.returnStatus;
  if (!status || status === "none") return null;

  const req = order.returnRequest;
  const bank = req?.userBankDetails;
  const refund = order.refundData;
  const currentStep = returnStepIndex(status);

  const run = async (
    action: Exclude<BusyAction, null>,
    call: () => Promise<{ data: { order?: unknown } }>,
    successMsg: string,
  ) => {
    setBusy(action);
    try {
      const res = await call();
      toast.success(successMsg);
      onUpdated(res.data.order as Order);
      setNote("");
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message || "Action failed",
      );
    } finally {
      setBusy(null);
    }
  };

  const resolve = (action: "approve" | "reject") => {
    if (
      !window.confirm(
        action === "approve" ?
          "Approve this return? Customer will be told a pickup will be arranged."
        : "Reject this return request? Customer will be notified.",
      )
    )
      return;
    void run(
      action,
      () =>
        adminApi.resolveReturn(order._id, {
          action,
          adminNote: note.trim() || undefined,
        }),
      action === "approve" ? "Return approved" : "Return rejected",
    );
  };

  const markPickedUp = () =>
    void run(
      "pickup",
      () =>
        adminApi.markReturnPickedUp(order._id, {
          carrier: carrier.trim() || undefined,
          awb: awb.trim() || undefined,
          note: note.trim() || undefined,
        }),
      "Marked as picked up",
    );

  const markReceived = () => {
    if (
      !window.confirm(
        condition === "resellable" ?
          "Mark item received as resellable? Stock will be added back to inventory."
        : "Mark item received as damaged? Stock will NOT be added back.",
      )
    )
      return;
    void run(
      "receive",
      () =>
        adminApi.markReturnReceived(order._id, {
          condition,
          note: note.trim() || undefined,
        }),
      condition === "resellable" ?
        "Received — stock restored, refund unlocked"
      : "Received — refund unlocked",
    );
  };

  const bankRows: [string, string | undefined][] = [
    ["Account name", bank?.accountName],
    ["Account number", bank?.accountNumber],
    ["IFSC", bank?.ifscCode],
    ["Bank", bank?.bankName],
  ];

  const noteBox = (placeholder: string) => (
    <textarea
      value={note}
      onChange={(e) => setNote(e.target.value)}
      placeholder={placeholder}
      rows={2}
      className={cn(inputClass, "resize-none")}
    />
  );

  return (
    <AdminOrderSectionCard
      id='return'
      icon={RotateCcw}
      tone='amber'
      title='Return & refund'
      description={
        req?.requestedAt ?
          `${
            req?.requestedBy === "admin" ?
              `Recorded by admin${adminReturnChannelLabel(req.requestChannel) ? ` · via ${adminReturnChannelLabel(req.requestChannel)}` : ""}`
            : "Customer request (app)"
          } · ${formatDateTime(req.requestedAt)}`
        : "Return flow"
      }
      className='border-amber-200/80'
      action={
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
            RETURN_STATUS_PILL[status] ?? "bg-gray-100 text-gray-800 ring-gray-200",
          )}
        >
          {RETURN_STATUS_LABELS[status] ?? status.replace(/_/g, " ")}
        </span>
      }
    >
      <div className='space-y-4'>
        {status !== "rejected" ?
          <ol className='grid grid-cols-5 gap-1'>
            {RETURN_STEPS.map((step, i) => {
              const done = i < currentStep || status === "returned";
              const current = i === currentStep && status !== "returned";
              return (
                <li key={step.key} className='flex flex-col items-center text-center'>
                  <span
                    className={cn(
                      "h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold ring-2",
                      done ? "bg-emerald-600 text-white ring-emerald-600"
                      : current ? "bg-amber-50 text-amber-900 ring-amber-400"
                      : "bg-white text-gray-400 ring-gray-200",
                    )}
                  >
                    {done ?
                      <Check className='h-3.5 w-3.5' />
                    : i + 1}
                  </span>
                  <span
                    className={cn(
                      "mt-1 text-[10px] leading-tight font-semibold",
                      done || current ? "text-gray-900" : "text-gray-400",
                    )}
                  >
                    {step.label}
                  </span>
                </li>
              );
            })}
          </ol>
        : null}

        {(req?.reason || req?.note) && (
          <div className='rounded-xl bg-amber-50/70 border border-amber-100 px-4 py-3'>
            <MicroLabel className='text-amber-700/80 mb-1'>Reason</MicroLabel>
            <p className='text-sm text-amber-950 font-medium'>{req?.reason || "-"}</p>
            {req?.note ?
              <p className='text-sm text-amber-900/90 mt-1 whitespace-pre-wrap'>
                <span className='text-[11px] font-semibold uppercase tracking-wide text-amber-700/80'>
                  {req.requestedBy === "admin" ? "Internal note · " : "Customer note · "}
                </span>
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
          {req?.pickedUpAt ?
            <div className='rounded-xl border border-gray-200 px-4 py-3'>
              <MicroLabel className='mb-1'>Picked up</MicroLabel>
              <p className='text-sm text-gray-900'>
                {formatDateTime(req.pickedUpAt)}
              </p>
              {req.pickupCarrier || req.pickupAwb ?
                <p className='text-xs text-gray-600 mt-0.5 font-mono'>
                  {[req.pickupCarrier, req.pickupAwb].filter(Boolean).join(" · ")}
                </p>
              : null}
            </div>
          : null}
          {req?.receivedAt ?
            <div className='rounded-xl border border-gray-200 px-4 py-3'>
              <MicroLabel className='mb-1'>Received at warehouse</MicroLabel>
              <p className='text-sm text-gray-900'>
                {formatDateTime(req.receivedAt)}
              </p>
              <p
                className={cn(
                  "text-xs mt-0.5 font-semibold",
                  req.itemCondition === "damaged" ? "text-red-700" : "text-emerald-700",
                )}
              >
                {req.itemCondition === "damaged" ?
                  "Damaged — not restocked"
                : req.restocked ?
                  "Resellable — restocked"
                : "Resellable"}
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
            <MicroLabel className='text-amber-700/80'>Step 1 · Decide</MicroLabel>
            {noteBox("Note to customer (optional) - included in the email")}
            <div className='flex flex-col sm:flex-row gap-2'>
              <Button
                type='button'
                className='flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5'
                loading={busy === "approve"}
                disabled={busy !== null}
                onClick={() => resolve("approve")}
              >
                <Check className='h-4 w-4' /> Approve return
              </Button>
              <Button
                type='button'
                variant='outline'
                className='flex-1 rounded-xl border-red-200 text-red-700 hover:bg-red-50 gap-1.5'
                loading={busy === "reject"}
                disabled={busy !== null}
                onClick={() => resolve("reject")}
              >
                <X className='h-4 w-4' /> Reject
              </Button>
            </div>
          </div>
        : null}

        {status === "approved" ?
          <div className='rounded-xl border border-dashed border-sky-200 bg-sky-50/40 p-4 space-y-3'>
            <MicroLabel className='text-sky-800/80'>Step 2 · Reverse pickup</MicroLabel>
            <p className='text-xs text-sky-900/80'>
              Book the pickup with your courier, then mark it collected. If the
              customer dropped it off in person, skip straight to “Received”.
            </p>
            <div className='grid sm:grid-cols-2 gap-2'>
              <input
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                placeholder='Courier (e.g. Delhivery)'
                className={inputClass}
              />
              <input
                value={awb}
                onChange={(e) => setAwb(e.target.value)}
                placeholder='Reverse AWB / tracking (optional)'
                className={cn(inputClass, "font-mono")}
              />
            </div>
            {noteBox("Internal / customer note (optional)")}
            <div className='flex flex-col sm:flex-row gap-2'>
              <Button
                type='button'
                className='flex-1 rounded-xl bg-sky-700 hover:bg-sky-800 text-white gap-1.5'
                loading={busy === "pickup"}
                disabled={busy !== null}
                onClick={markPickedUp}
              >
                <Truck className='h-4 w-4' /> Mark picked up
              </Button>
            </div>
          </div>
        : null}

        {status === "approved" || status === "picked_up" ?
          <div className='rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 p-4 space-y-3'>
            <MicroLabel className='text-emerald-800/80'>
              Step 3 · Receive & inspect
            </MicroLabel>
            <div className='grid grid-cols-2 gap-2'>
              {(
                [
                  ["resellable", "Resellable — restock"],
                  ["damaged", "Damaged — write off"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type='button'
                  onClick={() => setCondition(value)}
                  className={cn(
                    "rounded-xl py-2 text-xs font-semibold ring-1",
                    condition === value ?
                      value === "damaged" ?
                        "bg-red-600 text-white ring-red-600"
                      : "bg-emerald-700 text-white ring-emerald-700"
                    : "bg-white text-gray-700 ring-gray-200",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            {status === "picked_up" ? noteBox("Inspection note (optional)") : null}
            <Button
              type='button'
              className='w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5'
              loading={busy === "receive"}
              disabled={busy !== null}
              onClick={markReceived}
            >
              <PackageCheck className='h-4 w-4' /> Mark received at warehouse
            </Button>
          </div>
        : null}

        {status === "received" && order.status !== "refunded" ?
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3'>
            <p className='text-sm text-emerald-950'>
              Step 4 · Item received — refund is unlocked. Eligible amount
              excludes shipping / COD fees.
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
