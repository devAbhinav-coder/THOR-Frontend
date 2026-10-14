"use client";

import { useState } from "react";
import { Phone, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/api";
import type { Order } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ADMIN_RETURN_CHANNELS,
  ADMIN_RETURN_OTHER,
  ADMIN_RETURN_REASON_GROUPS,
  type AdminReturnChannel,
} from "@/lib/orderReturnHelpers";
import AdminOrderSectionCard, { MicroLabel } from "./AdminOrderSectionCard";

const chipClass = (active: boolean) =>
  cn(
    "rounded-xl px-3 py-2 text-left ring-1 transition-colors",
    active ?
      "bg-amber-50 ring-2 ring-amber-500 text-amber-950"
    : "bg-white ring-gray-200 text-gray-800 hover:ring-gray-300 hover:bg-gray-50",
  );

export default function AdminOrderInitiateReturnCard({
  order,
  onUpdated,
}: {
  order: Order;
  onUpdated: (order: Order) => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [otherReason, setOtherReason] = useState("");
  const [channel, setChannel] = useState<AdminReturnChannel>("phone");
  const [note, setNote] = useState("");
  const [autoApprove, setAutoApprove] = useState(true);
  const [refundMethod, setRefundMethod] = useState<"upi" | "bank_transfer">("upi");
  const [upiId, setUpiId] = useState("");
  const [accName, setAccName] = useState("");
  const [accNumber, setAccNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [bankName, setBankName] = useState("");
  const [busy, setBusy] = useState(false);

  const rs = order.returnStatus || "none";
  const canInitiate =
    order.status === "delivered" &&
    (rs === "none" || rs === "rejected") &&
    !(order.refundData?.amount && order.refundData.amount > 0);

  if (!canInitiate) return null;

  const isCod = order.paymentMethod === "cod";

  const finalReason =
    reason === ADMIN_RETURN_OTHER ? otherReason.trim() : reason;

  const submit = async () => {
    if (!reason) {
      toast.error("Select a return reason");
      return;
    }
    if (reason === ADMIN_RETURN_OTHER && finalReason.length < 3) {
      toast.error("Describe the reason (at least 3 characters)");
      return;
    }
    if (isCod && refundMethod === "upi" && !upiId.trim()) {
      toast.error("UPI ID is required for COD refund");
      return;
    }
    if (
      isCod &&
      refundMethod === "bank_transfer" &&
      (!accName.trim() || !accNumber.trim() || !ifsc.trim())
    ) {
      toast.error("Bank account details are required");
      return;
    }

    setBusy(true);
    try {
      const res = await adminApi.initiateReturn(order._id, {
        reason: finalReason,
        requestChannel: channel,
        note: note.trim() || undefined,
        autoApprove,
        ...(isCod ?
          {
            refundMethod,
            userBankDetails:
              refundMethod === "upi" ?
                { upiId: upiId.trim() }
              : {
                  accountName: accName.trim(),
                  accountNumber: accNumber.trim(),
                  ifscCode: ifsc.trim(),
                  bankName: bankName.trim() || undefined,
                },
          }
        : {}),
      });
      toast.success(
        autoApprove ?
          "Return recorded and approved — next: arrange pickup."
        : "Return recorded — approve from the return card.",
      );
      onUpdated(res.data.order);
      setOpen(false);
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message || "Failed to record return",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminOrderSectionCard
      id='admin-return'
      icon={RotateCcw}
      tone='amber'
      title='Record return (admin)'
      description='Customer asked on call / WhatsApp — start return without app request'
      className='border-slate-200'
      action={
        !open ?
          <Button
            type='button'
            variant='outline'
            className='rounded-xl gap-1.5'
            onClick={() => setOpen(true)}
          >
            <Phone className='h-4 w-4' /> Record return
          </Button>
        : null
      }
    >
      {open ?
        <div className='space-y-3'>
          <div>
            <MicroLabel className='mb-1.5'>Customer reached us via</MicroLabel>
            <div className='flex flex-wrap gap-1.5'>
              {ADMIN_RETURN_CHANNELS.map((c) => (
                <button
                  key={c.value}
                  type='button'
                  onClick={() => setChannel(c.value)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition-colors",
                    channel === c.value ?
                      "bg-gray-900 text-white ring-gray-900"
                    : "bg-white text-gray-700 ring-gray-200 hover:bg-gray-50",
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className='space-y-3'>
            <MicroLabel>Return reason</MicroLabel>
            {ADMIN_RETURN_REASON_GROUPS.map((g) => (
              <div key={g.group}>
                <p className='text-[11px] font-semibold text-gray-500 mb-1.5'>
                  {g.group}
                </p>
                <div className='grid sm:grid-cols-2 gap-2'>
                  {g.reasons.map((r) => (
                    <button
                      key={r.value}
                      type='button'
                      onClick={() => setReason(r.value)}
                      className={chipClass(reason === r.value)}
                    >
                      <span className='block text-sm font-semibold'>{r.value}</span>
                      <span className='block text-[11px] text-gray-500'>{r.hint}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button
              type='button'
              onClick={() => setReason(ADMIN_RETURN_OTHER)}
              className={cn(chipClass(reason === ADMIN_RETURN_OTHER), "w-full")}
            >
              <span className='block text-sm font-semibold'>Other</span>
              <span className='block text-[11px] text-gray-500'>
                Write the reason yourself
              </span>
            </button>
            {reason === ADMIN_RETURN_OTHER ?
              <input
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                maxLength={200}
                autoFocus
                placeholder='Describe the reason (shown to customer in email)'
                className='w-full rounded-xl border border-gray-200 px-3 py-2 text-sm'
              />
            : null}
          </div>

          <div>
            <MicroLabel className='mb-1'>Internal note (optional)</MicroLabel>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder='e.g. Customer called at 4pm, says kurta size L is too tight — wants refund, not exchange'
              className='w-full rounded-xl border border-gray-200 px-3 py-2 text-sm resize-none'
            />
          </div>
          <label className='flex items-center gap-2 text-sm text-gray-700'>
            <input
              type='checkbox'
              checked={autoApprove}
              onChange={(e) => setAutoApprove(e.target.checked)}
              className='rounded border-gray-300'
            />
            Auto-approve (skip review — go straight to pickup step)
          </label>
          {isCod ?
            <div className='rounded-xl border border-dashed border-gray-200 p-3 space-y-3'>
              <MicroLabel>Customer refund details (COD)</MicroLabel>
              <div className='flex gap-2'>
                {(["upi", "bank_transfer"] as const).map((m) => (
                  <button
                    key={m}
                    type='button'
                    onClick={() => setRefundMethod(m)}
                    className={`flex-1 rounded-lg py-2 text-xs font-semibold ring-1 ${
                      refundMethod === m ?
                        "bg-slate-900 text-white ring-slate-900"
                      : "bg-white text-gray-700 ring-gray-200"
                    }`}
                  >
                    {m === "upi" ? "UPI" : "Bank transfer"}
                  </button>
                ))}
              </div>
              {refundMethod === "upi" ?
                <input
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder='Customer UPI ID'
                  className='w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-mono'
                />
              : <div className='grid sm:grid-cols-2 gap-2'>
                  <input
                    value={accName}
                    onChange={(e) => setAccName(e.target.value)}
                    placeholder='Account name'
                    className='rounded-xl border border-gray-200 px-3 py-2 text-sm'
                  />
                  <input
                    value={accNumber}
                    onChange={(e) => setAccNumber(e.target.value)}
                    placeholder='Account number'
                    className='rounded-xl border border-gray-200 px-3 py-2 text-sm font-mono'
                  />
                  <input
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value)}
                    placeholder='IFSC'
                    className='rounded-xl border border-gray-200 px-3 py-2 text-sm font-mono'
                  />
                  <input
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder='Bank name (optional)'
                    className='rounded-xl border border-gray-200 px-3 py-2 text-sm'
                  />
                </div>
              }
            </div>
          : null}
          <div className='flex gap-2'>
            <Button
              type='button'
              className='flex-1 rounded-xl'
              loading={busy}
              onClick={() => void submit()}
            >
              Save return
            </Button>
            <Button
              type='button'
              variant='outline'
              className='rounded-xl'
              disabled={busy}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      : <p className='text-sm text-gray-600'>
          Delivered orders are refunded only through a return: record it here
          (customer called / WhatsApp), then pickup → received → refund. The
          customer gets an email at each step.
        </p>
      }
    </AdminOrderSectionCard>
  );
}
