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

export default function CancelOrderModal({
  order,
  open,
  isSubmitting,
  onClose,
  onConfirm,
}: Props) {
  const [selected, setSelected] = useState<CancelReasonOption>(
    CANCEL_REASON_OPTIONS[0],
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
        className="bg-white w-full sm:max-w-[520px] sm:mx-auto rounded-t-3xl sm:rounded-3xl flex flex-col max-h-[min(92dvh,920px)] sm:max-h-[90vh] shadow-2xl"
        data-lenis-prevent
        role="dialog"
        aria-labelledby="cancel-order-title"
      >
        <div className="shrink-0 px-5 sm:px-8 pt-5 sm:pt-8 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2
                id="cancel-order-title"
                className="text-lg sm:text-xl font-bold text-gray-900"
              >
                Cancel order {order.orderNumber}?
              </h2>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                This cannot be undone once confirmed. Tell us why you&apos;re
                cancelling — we share this with our team to improve your
                experience.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-8 py-5 space-y-5 min-h-0">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Items in this order
            </p>
            <ul className="space-y-2 rounded-2xl border border-gray-100 bg-gray-50/80 p-3">
              {order.items.map((item: OrderItem, i: number) => {
                const img =
                  item.image ||
                  (typeof item.product !== "string" &&
                    item.product?.images?.[0]?.url) ||
                  "";
                return (
                  <li key={i} className="flex gap-3 items-center min-w-0">
                    <div className="relative h-14 w-11 rounded-lg overflow-hidden bg-white border border-gray-100 shrink-0">
                      {img ?
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      : <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                          <Package className="h-5 w-5 text-gray-200" />
                        </div>
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Qty {item.quantity} · {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <fieldset>
            <legend className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
              Reason for cancellation
            </legend>
            <div className="space-y-2">
              {CANCEL_REASON_OPTIONS.map((opt) => (
                <label
                  key={opt}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors",
                    selected === opt ?
                      "border-red-300 bg-red-50/80"
                    : "border-gray-200 hover:border-gray-300",
                  )}
                >
                  <input
                    type="radio"
                    name="cancel-reason"
                    value={opt}
                    checked={selected === opt}
                    onChange={() => {
                      setSelected(opt);
                      setError(null);
                    }}
                    className="mt-1"
                  />
                  <span className="text-sm text-gray-800">{opt}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {selected === "Other" ?
            <div>
              <label
                htmlFor="cancel-other-detail"
                className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 block"
              >
                Please describe
              </label>
              <textarea
                id="cancel-other-detail"
                rows={4}
                value={otherDetail}
                onChange={(e) => {
                  setOtherDetail(e.target.value);
                  setError(null);
                }}
                placeholder="Tell us what went wrong…"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
              />
            </div>
          : <div>
              <label
                htmlFor="cancel-extra-detail"
                className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 block"
              >
                Anything else? (optional)
              </label>
              <textarea
                id="cancel-extra-detail"
                rows={2}
                value={otherDetail}
                onChange={(e) => setOtherDetail(e.target.value)}
                placeholder="Optional details for our team…"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
              />
            </div>
          }

          {error && (
            <p className="text-sm text-red-600 font-medium" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="shrink-0 px-5 sm:px-8 py-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50"
          >
            Keep order
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50"
          >
            {isSubmitting ? "Cancelling…" : "Confirm cancellation"}
          </button>
        </div>
      </div>
    </div>
  );
}
