"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Mail, Send, Truck, RefreshCw, Loader2 } from "lucide-react";
import { adminApi } from "@/lib/api";
import { Order } from "@/types";
import { Button } from "@/components/ui/button";
import { formatDateTime, cn } from "@/lib/utils";

const TEMPLATE_OPTIONS = [
  { id: "processing", label: "Preparing (processing)" },
  { id: "processing_awb", label: "Processing + AWB assigned" },
  { id: "shipped", label: "Shipped / on the way" },
  { id: "confirmed", label: "Order confirmed" },
  { id: "cancelled", label: "Cancelled" },
  { id: "refunded", label: "Refund update" },
  { id: "custom", label: "Custom message" },
] as const;

type TemplateId = (typeof TEMPLATE_OPTIONS)[number]["id"];

function kindLabel(kind: string): string {
  const hit = TEMPLATE_OPTIONS.find((t) => t.id === kind);
  return hit?.label ?? kind.replace(/_/g, " ");
}

export default function AdminOrderCustomerCommsPanel({
  order,
  onRefresh,
}: {
  order: Order;
  onRefresh: () => Promise<void>;
}) {
  const [template, setTemplate] = useState<TemplateId>("shipped");
  const [customSubject, setCustomSubject] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [sendInApp, setSendInApp] = useState(true);
  const [sending, setSending] = useState(false);

  const [carrier, setCarrier] = useState(order.shippingCarrier ?? "");
  const [awb, setAwb] = useState(order.trackingNumber ?? "");
  const [trackUrl, setTrackUrl] = useState(order.trackingUrl ?? "");
  const [notifyOnSave, setNotifyOnSave] = useState(false);
  const [shippingSaving, setShippingSaving] = useState(false);
  const [forceShipLoading, setForceShipLoading] = useState(false);

  const comms = useMemo(
    () =>
      [...(order.customerCommunications ?? [])].sort(
        (a, b) =>
          new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
      ),
    [order.customerCommunications],
  );

  const delhiveryStatus = order.delhivery?.lastPackageStatus;
  const lastSync = order.delhivery?.lastTrackSyncAt;

  const resend = async () => {
    setSending(true);
    try {
      await adminApi.resendCustomerOrderEmail(order._id, {
        template,
        subject: template === "custom" ? customSubject : undefined,
        htmlBody: template === "custom" ? customBody : undefined,
        sendInApp,
      });
      await onRefresh();
      toast.success("Customer notification queued");
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message || "Send failed");
    } finally {
      setSending(false);
    }
  };

  const saveShipping = async () => {
    setShippingSaving(true);
    try {
      await adminApi.updateOrderShipping(order._id, {
        shippingCarrier: carrier.trim() || undefined,
        trackingNumber: awb.trim() || undefined,
        trackingUrl: trackUrl.trim() || undefined,
        notifyCustomer: notifyOnSave,
      });
      await onRefresh();
      toast.success(
        notifyOnSave ?
          "Shipping saved & customer notified"
        : "Shipping details saved",
      );
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message || "Save failed");
    } finally {
      setShippingSaving(false);
    }
  };

  const forceShip = async () => {
    if (
      !window.confirm(
        "Mark this order as Shipped and notify the customer? Use when Delhivery has truly picked up the parcel.",
      )
    ) {
      return;
    }
    setForceShipLoading(true);
    try {
      await adminApi.forceMarkOrderShipped(order._id, { notifyCustomer: true });
      await onRefresh();
      toast.success("Order marked shipped");
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message || "Could not mark shipped");
    } finally {
      setForceShipLoading(false);
    }
  };

  return (
    <div className='rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden'>
      <div className='px-4 py-3 border-b border-gray-100 flex items-center gap-2 bg-gradient-to-r from-slate-50 to-white'>
        <Mail className='h-4 w-4 text-brand-600' />
        <div>
          <p className='text-sm font-semibold text-gray-900'>
            Customer communications
          </p>
          <p className='text-[11px] text-gray-500'>
            Emails & in-app · full resend control
          </p>
        </div>
      </div>

      {(delhiveryStatus || lastSync) && (
        <div className='px-4 py-2.5 bg-amber-50/80 border-b border-amber-100 text-[11px] text-amber-950'>
          {delhiveryStatus && (
            <span className='font-medium'>Delhivery: {delhiveryStatus}</span>
          )}
          {lastSync && (
            <span className={delhiveryStatus ? " · " : ""}>
              Last sync {formatDateTime(lastSync)}
            </span>
          )}
          {order.status === "processing" && order.trackingNumber && (
            <p className='mt-1 text-amber-900/80'>
              Storefront stays on Processing until pickup is confirmed (auto or
              manual ship below).
            </p>
          )}
        </div>
      )}

      <div className='p-4 space-y-4'>
        <div>
          <p className='text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2'>
            Sent to customer
          </p>
          {comms.length === 0 ?
            <p className='text-xs text-gray-500'>No logged communications yet.</p>
          : <ul className='space-y-2 max-h-40 overflow-y-auto'>
              {comms.map((c, i) => (
                <li
                  key={`${c.kind}-${c.sentAt}-${i}`}
                  className='flex items-start gap-2 text-xs border border-gray-100 rounded-lg px-2.5 py-2'
                >
                  <span
                    className={cn(
                      "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
                      c.channel === "email" ?
                        "bg-indigo-50 text-indigo-800"
                      : "bg-slate-100 text-slate-700",
                    )}
                  >
                    {c.channel}
                  </span>
                  <div className='min-w-0'>
                    <p className='font-medium text-gray-800 truncate'>
                      {c.subject || kindLabel(c.kind)}
                    </p>
                    <p className='text-gray-500'>
                      {kindLabel(c.kind)} · {formatDateTime(c.sentAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          }
        </div>

        <div className='border-t border-gray-100 pt-4 space-y-2'>
          <p className='text-[10px] font-semibold uppercase tracking-wider text-gray-400'>
            Edit tracking (any status)
          </p>
          <input
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            placeholder='Courier'
            className='w-full h-10 px-3 border border-gray-200 rounded-xl text-sm'
          />
          <input
            value={awb}
            onChange={(e) => setAwb(e.target.value)}
            placeholder='AWB / tracking number'
            className='w-full h-10 px-3 border border-gray-200 rounded-xl text-sm'
          />
          <input
            value={trackUrl}
            onChange={(e) => setTrackUrl(e.target.value)}
            placeholder='Tracking URL (optional)'
            className='w-full h-10 px-3 border border-gray-200 rounded-xl text-sm'
          />
          <label className='flex items-center gap-2 text-xs text-gray-600'>
            <input
              type='checkbox'
              checked={notifyOnSave}
              onChange={(e) => setNotifyOnSave(e.target.checked)}
            />
            Email customer after save
          </label>
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='w-full'
            disabled={shippingSaving}
            onClick={() => void saveShipping()}
          >
            {shippingSaving ?
              <Loader2 className='h-4 w-4 animate-spin' />
            : <Truck className='h-4 w-4' />}
            Save shipping
          </Button>
        </div>

        {order.status === "processing" && order.trackingNumber && (
          <Button
            type='button'
            variant='brand'
            size='sm'
            className='w-full'
            disabled={forceShipLoading}
            onClick={() => void forceShip()}
          >
            {forceShipLoading ?
              <Loader2 className='h-4 w-4 animate-spin' />
            : <RefreshCw className='h-4 w-4' />}
            Mark shipped & notify (manual)
          </Button>
        )}

        <div className='border-t border-gray-100 pt-4 space-y-2'>
          <p className='text-[10px] font-semibold uppercase tracking-wider text-gray-400'>
            Resend / send email
          </p>
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value as TemplateId)}
            className='w-full h-10 px-3 border border-gray-200 rounded-xl text-sm bg-white'
          >
            {TEMPLATE_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
          {template === "custom" && (
            <>
              <input
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder='Subject'
                className='w-full h-10 px-3 border border-gray-200 rounded-xl text-sm'
              />
              <textarea
                value={customBody}
                onChange={(e) => setCustomBody(e.target.value)}
                placeholder='HTML or plain text body'
                rows={4}
                className='w-full px-3 py-2 border border-gray-200 rounded-xl text-sm'
              />
            </>
          )}
          <label className='flex items-center gap-2 text-xs text-gray-600'>
            <input
              type='checkbox'
              checked={sendInApp}
              onChange={(e) => setSendInApp(e.target.checked)}
            />
            Also send in-app notification
          </label>
          <Button
            type='button'
            size='sm'
            className='w-full'
            disabled={sending}
            onClick={() => void resend()}
          >
            {sending ?
              <Loader2 className='h-4 w-4 animate-spin' />
            : <Send className='h-4 w-4' />}
            Queue email
          </Button>
        </div>
      </div>
    </div>
  );
}
