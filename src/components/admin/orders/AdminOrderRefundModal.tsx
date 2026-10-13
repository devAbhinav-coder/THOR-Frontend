"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Undo2 } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/api";
import type { Order } from "@/types";
import { Button } from "@/components/ui/button";
import { cn, formatPrice } from "@/lib/utils";
import {
  getMaxRefundableInr,
  getNonRefundableFeesInr,
} from "@/lib/orderRefundPolicy";
import AdminOrderModalShell, {
  modalInputClass,
  modalLabelClass,
} from "./AdminOrderModalShell";

type OfflineMethod = "cash" | "bank_transfer" | "upi_manual";

const OFFLINE_METHODS: { id: OfflineMethod; label: string; hint: string }[] = [
  { id: "bank_transfer", label: "Bank transfer", hint: "NEFT / IMPS to customer account" },
  { id: "upi_manual", label: "UPI (manual)", hint: "Send to customer UPI ID" },
  { id: "cash", label: "Cash", hint: "Handed over in person" },
];

export default function AdminOrderRefundModal({
  order,
  open,
  onClose,
  onRefunded,
}: {
  order: Order;
  open: boolean;
  onClose: () => void;
  onRefunded: (order: Order) => void;
}) {
  const [method, setMethod] = useState<OfflineMethod>("bank_transfer");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNotes("");
    const requested = order.returnRequest?.refundMethod;
    if (requested === "upi") setMethod("upi_manual");
    else if (requested === "bank" || requested === "bank_transfer")
      setMethod("bank_transfer");
    else setMethod("bank_transfer");
  }, [open, order._id, order.returnRequest?.refundMethod]);

  const isRazorpay = order.paymentMethod === "razorpay";
  const nonRefundable = getNonRefundableFeesInr(order);
  const maxRefundable = getMaxRefundableInr(order);
  const bank = order.returnRequest?.userBankDetails;

  const submit = async () => {
    if (maxRefundable <= 0) {
      toast.error(
        "Nothing eligible to refund (non-refundable fees may equal order total).",
      );
      return;
    }
    setBusy(true);
    try {
      await adminApi.processRefund(order._id, {
        amount: maxRefundable,
        refundMethod: isRazorpay ? "razorpay_auto" : method,
        notes,
      });
      toast.success("Refund processed");
      const res = await adminApi.getOrderDetails(order._id);
      onRefunded(res.data.order);
      onClose();
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message || "Failed to process refund",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminOrderModalShell
      open={open}
      onClose={onClose}
      busy={busy}
      icon={Undo2}
      tone='red'
      eyebrow='Refund'
      title='Process refund'
      description='Marks the order refunded and logs the amount for audit.'
      footer={
        <>
          <Button
            type='button'
            variant='outline'
            className='flex-1 rounded-xl h-11'
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type='button'
            className='flex-1 rounded-xl h-11 bg-red-600 hover:bg-red-700 text-white'
            loading={busy}
            onClick={() => void submit()}
          >
            Refund {formatPrice(maxRefundable)}
          </Button>
        </>
      }
    >
      <div className='space-y-5'>
        <div className='rounded-2xl border border-gray-200 bg-gray-50/80 p-4'>
          <div className='flex items-end justify-between gap-3'>
            <div>
              <p className='text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400'>
                Eligible refund
              </p>
              <p className='text-2xl font-bold text-gray-900 tabular-nums mt-0.5'>
                {formatPrice(maxRefundable)}
              </p>
            </div>
            <p className='text-xs text-gray-500 text-right'>
              Order total {formatPrice(order.total)}
            </p>
          </div>
          {nonRefundable > 0 ?
            <p className='mt-3 text-[11px] text-amber-900 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 leading-snug'>
              Retained (non-refundable): shipping{" "}
              {formatPrice(order.shippingCharge || 0)}
              {(order.codFee || 0) > 0 ?
                ` + COD fee ${formatPrice(order.codFee || 0)}`
              : ""}
              .
            </p>
          : null}
        </div>

        {isRazorpay ?
          <div className='flex gap-3 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-900'>
            <ShieldCheck className='h-5 w-5 shrink-0 text-sky-600' aria-hidden />
            <p className='leading-snug'>
              Paid via Razorpay — the refund goes straight back to the original
              payment source. No bank details needed.
            </p>
          </div>
        : <div>
            <p className={modalLabelClass}>Refund method</p>
            <div className='grid gap-2'>
              {OFFLINE_METHODS.map((m) => (
                <label
                  key={m.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-3.5 py-2.5 cursor-pointer transition-colors",
                    method === m.id ?
                      "border-brand-300 bg-brand-50/60 ring-1 ring-brand-200"
                    : "border-gray-200 hover:bg-gray-50",
                  )}
                >
                  <input
                    type='radio'
                    name='refund-method'
                    className='accent-brand-600'
                    checked={method === m.id}
                    onChange={() => setMethod(m.id)}
                  />
                  <span className='min-w-0'>
                    <span className='block text-sm font-semibold text-gray-900'>
                      {m.label}
                    </span>
                    <span className='block text-[11px] text-gray-500'>{m.hint}</span>
                  </span>
                </label>
              ))}
            </div>
            {bank && Object.values(bank).some(Boolean) ?
              <div className='mt-3 rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-xs space-y-1'>
                <p className='text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1'>
                  Customer-provided details
                </p>
                {bank.upiId ?
                  <p>
                    <span className='text-gray-500'>UPI:</span>{" "}
                    <span className='font-mono font-semibold text-gray-900'>{bank.upiId}</span>
                  </p>
                : null}
                {bank.accountName ?
                  <p>
                    <span className='text-gray-500'>Name:</span>{" "}
                    <span className='font-semibold text-gray-900'>{bank.accountName}</span>
                  </p>
                : null}
                {bank.accountNumber ?
                  <p>
                    <span className='text-gray-500'>A/c:</span>{" "}
                    <span className='font-mono font-semibold text-gray-900'>{bank.accountNumber}</span>
                  </p>
                : null}
                {bank.ifscCode ?
                  <p>
                    <span className='text-gray-500'>IFSC:</span>{" "}
                    <span className='font-mono font-semibold text-gray-900'>{bank.ifscCode}</span>
                  </p>
                : null}
                {bank.bankName ?
                  <p>
                    <span className='text-gray-500'>Bank:</span>{" "}
                    <span className='font-semibold text-gray-900'>{bank.bankName}</span>
                  </p>
                : null}
              </div>
            : null}
          </div>
        }

        <div>
          <label className={modalLabelClass} htmlFor='refund-notes'>
            Note for audit log
          </label>
          <input
            id='refund-notes'
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder='Reason / reference (e.g. UTR number)'
            className={cn(modalInputClass, "border-gray-200")}
          />
        </div>
      </div>
    </AdminOrderModalShell>
  );
}
