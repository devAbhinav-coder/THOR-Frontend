"use client";

import { useState } from "react";
import { Package, X } from "lucide-react";
import { Order, OrderItem } from "@/types";
import { cn, formatPrice } from "@/lib/utils";
import {
  CANCEL_REASON_OPTIONS,
  CancelReasonOption,
  composeCancelReason,
  validateCancelReason,
} from "@/lib/orderCancelHelpers";

type Props = {
  order: Order;
  open: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
};

/** Admin cancellation — same reason capture as storefront; stored on statusHistory + outbox. */
export default function AdminCancelOrderModal({
  order,
  open,
  isSubmitting,
  onClose,
  onConfirm,
}: Props) {
  const [selected, setSelected] = useState<CancelReasonOption>(
    "Ordered by mistake",
  );
  const [otherDetail, setOtherDetail] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = () => {
    const reason = composeCancelReason(selected, otherDetail);
    const validation = validateCancelReason(
      selected === "Other" ? otherDetail : reason,
    );
    if (validation) {
      setError(validation);
      return;
    }
    setError(null);
    onConfirm(reason.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        className="bg-white w-full sm:max-w-[520px] sm:mx-auto rounded-t-3xl sm:rounded-3xl flex flex-col max-h-[min(92dvh,920px)] shadow-2xl"
        data-lenis-prevent
        role="dialog"
        aria-labelledby="admin-cancel-title"
      >
        <div className="shrink-0 px-5 sm:px-8 pt-5 sm:pt-8 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2
                id="admin-cancel-title"
                className="text-lg sm:text-xl font-bold text-gray-900"
              >
                Cancel order {order.orderNumber}
              </h2>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                This is recorded on the order timeline and sent to the customer
                by email. Required before status changes to cancelled.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-full p-2 text-gray-400 hover:bg-gray-100"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-5 space-y-5 min-h-0">
          <ul className="space-y-2 rounded-2xl border border-gray-100 bg-gray-50/80 p-3">
            {order.items.map((item: OrderItem, i: number) => (
              <li key={i} className="flex gap-3 items-center text-sm">
                <Package className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="font-medium text-gray-900 line-clamp-1">
                  {item.name}
                </span>
                <span className="text-gray-500 ml-auto tabular-nums">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <fieldset>
            <legend className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
              Reason (customer-visible)
            </legend>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {CANCEL_REASON_OPTIONS.map((opt) => (
                <label
                  key={opt}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border px-4 py-2.5 cursor-pointer text-sm",
                    selected === opt ?
                      "border-red-300 bg-red-50/80"
                    : "border-gray-200",
                  )}
                >
                  <input
                    type="radio"
                    name="admin-cancel-reason"
                    checked={selected === opt}
                    onChange={() => {
                      setSelected(opt);
                      setError(null);
                    }}
                    className="mt-0.5"
                  />
                  {opt}
                </label>
              ))}
            </div>
          </fieldset>

          {selected === "Other" ?
            <textarea
              rows={3}
              value={otherDetail}
              onChange={(e) => {
                setOtherDetail(e.target.value);
                setError(null);
              }}
              placeholder="Describe why this order is being cancelled…"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
            />
          : <textarea
              rows={2}
              value={otherDetail}
              onChange={(e) => setOtherDetail(e.target.value)}
              placeholder="Optional internal note for the customer record…"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
            />
          }

          {error && (
            <p className="text-sm text-red-600 font-medium" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="shrink-0 px-5 sm:px-8 py-4 border-t flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50"
          >
            {isSubmitting ? "Cancelling…" : "Confirm cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}
