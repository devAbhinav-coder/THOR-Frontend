"use client";

import { useEffect, useState } from "react";
import { Truck } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/api";
import type { Order } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import AdminOrderModalShell, {
  modalInputClass,
  modalLabelClass,
} from "./AdminOrderModalShell";

const COURIER_SUGGESTIONS = [
  "Delhivery",
  "BlueDart",
  "DTDC",
  "Ecom Express",
  "India Post",
  "FedEx",
  "DHL",
];

type Errors = {
  shippingCarrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
};

export default function AdminOrderTrackingModal({
  order,
  open,
  onClose,
  onSaved,
}: {
  order: Order;
  open: boolean;
  onClose: () => void;
  onSaved: (order: Order) => void;
}) {
  const [carrier, setCarrier] = useState(order.shippingCarrier || "");
  const [awb, setAwb] = useState(order.trackingNumber || "");
  const [url, setUrl] = useState(order.trackingUrl || "");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCarrier(order.shippingCarrier || "");
    setAwb(order.trackingNumber || "");
    setUrl(order.trackingUrl || "");
    setNote("");
    setErrors({});
  }, [open, order._id, order.shippingCarrier, order.trackingNumber, order.trackingUrl]);

  const alreadyShipped = order.status === "shipped";

  const submit = async () => {
    const errs: Errors = {};
    if (!carrier.trim()) errs.shippingCarrier = "Courier is required";
    if (!awb.trim()) errs.trackingNumber = "Tracking / AWB is required";
    if (url.trim() && !/^https?:\/\//i.test(url.trim())) {
      errs.trackingUrl = "Tracking URL must start with http(s)://";
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      await adminApi.updateOrderStatus(order._id, {
        status: "shipped",
        note: note.trim() || undefined,
        shippingCarrier: carrier.trim() || undefined,
        trackingNumber: awb.trim() || undefined,
        trackingUrl: url.trim() || undefined,
      });
      toast.success(alreadyShipped ? "Tracking updated" : "Marked as shipped");
      const res = await adminApi.getOrderDetails(order._id);
      onSaved(res.data.order);
      onClose();
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminOrderModalShell
      open={open}
      onClose={onClose}
      busy={saving}
      icon={Truck}
      tone='brand'
      eyebrow='Shipping'
      title={alreadyShipped ? "Edit tracking details" : "Mark shipped"}
      description='Customer sees courier + AWB in the shipped email and on their order page.'
      footer={
        <>
          <Button
            type='button'
            variant='outline'
            className='flex-1 rounded-xl h-11'
            disabled={saving}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type='button'
            variant='brand'
            className='flex-1 rounded-xl h-11'
            loading={saving}
            onClick={() => void submit()}
          >
            {alreadyShipped ? "Save tracking" : "Mark shipped & notify"}
          </Button>
        </>
      }
    >
      <div className='space-y-4'>
        <div>
          <label className={modalLabelClass} htmlFor='trk-carrier'>
            Courier
          </label>
          <input
            id='trk-carrier'
            list='trk-carrier-list'
            value={carrier}
            onChange={(e) => {
              setErrors((p) => ({ ...p, shippingCarrier: undefined }));
              setCarrier(e.target.value);
            }}
            placeholder='e.g. Delhivery, BlueDart, DTDC'
            className={cn(
              modalInputClass,
              errors.shippingCarrier ?
                "border-red-300 bg-red-50/40"
              : "border-gray-200",
            )}
          />
          <datalist id='trk-carrier-list'>
            {COURIER_SUGGESTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <div className='mt-2 flex flex-wrap gap-1.5'>
            {COURIER_SUGGESTIONS.slice(0, 5).map((c) => (
              <button
                key={c}
                type='button'
                onClick={() => {
                  setCarrier(c);
                  setErrors((p) => ({ ...p, shippingCarrier: undefined }));
                }}
                className={cn(
                  "px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-colors",
                  carrier === c ?
                    "border-brand-300 bg-brand-50 text-brand-800"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50",
                )}
              >
                {c}
              </button>
            ))}
          </div>
          {errors.shippingCarrier ?
            <p className='text-xs text-red-600 mt-1'>{errors.shippingCarrier}</p>
          : null}
        </div>

        <div>
          <label className={modalLabelClass} htmlFor='trk-awb'>
            Tracking / AWB number
          </label>
          <input
            id='trk-awb'
            value={awb}
            onChange={(e) => {
              setErrors((p) => ({ ...p, trackingNumber: undefined }));
              setAwb(e.target.value);
            }}
            placeholder='e.g. 1234567890'
            className={cn(
              modalInputClass,
              "font-mono tracking-wide",
              errors.trackingNumber ?
                "border-red-300 bg-red-50/40"
              : "border-gray-200",
            )}
          />
          {errors.trackingNumber ?
            <p className='text-xs text-red-600 mt-1'>{errors.trackingNumber}</p>
          : null}
        </div>

        <div>
          <label className={modalLabelClass} htmlFor='trk-url'>
            Tracking URL <span className='normal-case font-normal'>(optional)</span>
          </label>
          <input
            id='trk-url'
            value={url}
            onChange={(e) => {
              setErrors((p) => ({ ...p, trackingUrl: undefined }));
              setUrl(e.target.value);
            }}
            placeholder='https://…'
            className={cn(
              modalInputClass,
              errors.trackingUrl ? "border-red-300 bg-red-50/40" : "border-gray-200",
            )}
          />
          <p className='text-[11px] text-gray-500 mt-1'>
            Leave blank to auto-build a link from the courier name.
          </p>
          {errors.trackingUrl ?
            <p className='text-xs text-red-600 mt-1'>{errors.trackingUrl}</p>
          : null}
        </div>

        <div>
          <label className={modalLabelClass} htmlFor='trk-note'>
            Internal note <span className='normal-case font-normal'>(optional)</span>
          </label>
          <textarea
            id='trk-note'
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder='Logged in the order activity (e.g. “Handed to courier 6pm”)'
            className={cn(modalInputClass, "h-auto py-2.5 resize-none border-gray-200")}
          />
        </div>
      </div>
    </AdminOrderModalShell>
  );
}
