"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Mail,
  Send,
  Truck,
  RefreshCw,
  Loader2,
  Sparkles,
  ChevronDown,
  BellRing,
  MessageCircle,
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { Order } from "@/types";
import { Button } from "@/components/ui/button";
import { formatDateTime, cn } from "@/lib/utils";
import AdminOrderSectionCard, { MicroLabel } from "./AdminOrderSectionCard";

const TEMPLATE_OPTIONS = [
  { id: "processing", label: "Preparing (processing)" },
  { id: "processing_awb", label: "Processing + AWB assigned" },
  { id: "tracking_updated", label: "Tracking updated (manual courier)" },
  { id: "shipped", label: "Shipped / on the way" },
  { id: "first_purchase_welcome", label: "First order welcome" },
  { id: "confirmed", label: "Order confirmed" },
  { id: "cancelled", label: "Cancelled" },
  { id: "refunded", label: "Refund update" },
  { id: "custom", label: "Custom message" },
] as const;

type TemplateId = (typeof TEMPLATE_OPTIONS)[number]["id"];

type NotifyMode = "none" | "processing_awb" | "shipped" | "tracking_updated";

const NOTIFY_OPTIONS: { id: NotifyMode; label: string; help: string }[] = [
  { id: "none", label: "No email", help: "Save only — nothing sent." },
  {
    id: "processing_awb",
    label: "Fulfilment + AWB",
    help: "AWB text in email, no track button on site. Status stays Processing.",
  },
  {
    id: "tracking_updated",
    label: "Tracking updated",
    help: "Neutral update: courier + AWB (+ link if URL). No “on the way” claim.",
  },
  {
    id: "shipped",
    label: "On the way",
    help: "Full track link; site shows Shipped. Pair with “Mark shipped”.",
  },
];

function kindLabel(kind: string): string {
  const hit = TEMPLATE_OPTIONS.find((t) => t.id === kind);
  return hit?.label ?? kind.replace(/_/g, " ");
}

const inputClass =
  "w-full h-10 px-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300";

export default function AdminOrderCustomerCommsPanel({
  order,
  customerSegment,
  onRefresh,
}: {
  order: Order;
  customerSegment?: string | null;
  onRefresh: () => Promise<void>;
}) {
  const [template, setTemplate] = useState<TemplateId>("shipped");
  const [customSubject, setCustomSubject] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [sendInApp, setSendInApp] = useState(true);
  const [sending, setSending] = useState(false);
  const [resendOpen, setResendOpen] = useState(false);

  const [carrier, setCarrier] = useState(order.shippingCarrier ?? "");
  const [awb, setAwb] = useState(order.trackingNumber ?? "");
  const [trackUrl, setTrackUrl] = useState(order.trackingUrl ?? "");
  const [notifyMode, setNotifyMode] = useState<NotifyMode>("none");
  const [markShipped, setMarkShipped] = useState(false);
  const [shippingSaving, setShippingSaving] = useState(false);
  const [forceShipLoading, setForceShipLoading] = useState(false);

  useEffect(() => {
    setCarrier(order.shippingCarrier ?? "");
    setAwb(order.trackingNumber ?? "");
    setTrackUrl(order.trackingUrl ?? "");
  }, [order._id, order.shippingCarrier, order.trackingNumber, order.trackingUrl]);

  const isFirstBuyer =
    customerSegment === "new_buyer" || customerSegment === "prospect";

  const comms = useMemo(
    () =>
      [...(order.customerCommunications ?? [])].sort(
        (a, b) =>
          new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
      ),
    [order.customerCommunications],
  );

  const isDelhivery = (order.shippingCarrier || "")
    .toLowerCase()
    .includes("delhivery");
  const canManualShip =
    order.status !== "cancelled" &&
    order.status !== "refunded" &&
    order.status !== "delivered";

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

  const sendFirstWelcome = async () => {
    setSending(true);
    try {
      await adminApi.resendCustomerOrderEmail(order._id, {
        template: "first_purchase_welcome",
        sendInApp: true,
      });
      await onRefresh();
      toast.success("Welcome email queued");
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message || "Send failed");
    } finally {
      setSending(false);
    }
  };

  const saveShipping = async () => {
    if (markShipped && (!carrier.trim() || !awb.trim())) {
      toast.error("Courier and AWB required to mark shipped");
      return;
    }
    setShippingSaving(true);
    try {
      await adminApi.updateOrderShipping(order._id, {
        shippingCarrier: carrier.trim() || undefined,
        trackingNumber: awb.trim() || undefined,
        trackingUrl: trackUrl.trim() || undefined,
        notifyMode,
        markShipped,
      });
      await onRefresh();
      toast.success(
        notifyMode !== "none" || markShipped ?
          "Saved — customer notified as selected"
        : "Shipping details saved",
      );
      setMarkShipped(false);
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message || "Save failed");
    } finally {
      setShippingSaving(false);
    }
  };

  const forceShip = async () => {
    if (
      !window.confirm(
        "Mark as Shipped and send On the way email? (Delhivery auto path)",
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

  const channelIcon = (ch: string) =>
    ch === "email" ? Mail
    : ch === "whatsapp" ? MessageCircle
    : BellRing;

  return (
    <AdminOrderSectionCard
      id='comms'
      icon={Mail}
      tone='brand'
      title='Customer communications'
      description='Manual courier updates and template emails.'
      action={
        comms.length > 0 ?
          <span className='text-[11px] font-semibold text-gray-500 tabular-nums'>
            {comms.length} sent
          </span>
        : null
      }
      bodyClassName='space-y-5'
    >
      {isFirstBuyer ?
        <div className='rounded-xl bg-violet-50 border border-violet-100 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2'>
          <p className='text-xs text-violet-950 flex items-center gap-1.5'>
            <Sparkles className='h-3.5 w-3.5 text-violet-600' />
            First-time buyer — send a welcome note?
          </p>
          <Button
            type='button'
            size='sm'
            variant='outline'
            className='h-8 text-xs rounded-lg bg-white'
            disabled={sending}
            onClick={() => void sendFirstWelcome()}
          >
            Send welcome
          </Button>
        </div>
      : null}

      {order.status === "processing" && order.trackingNumber && isDelhivery ?
        <div className='rounded-xl border border-indigo-200 bg-indigo-50/60 px-3.5 py-3'>
          <p className='text-xs text-indigo-950 leading-snug mb-2'>
            Delhivery AWB is attached. Once the parcel is picked up, flip the
            order to Shipped and email the track link.
          </p>
          <Button
            type='button'
            variant='brand'
            size='sm'
            className='w-full rounded-xl gap-1.5'
            disabled={forceShipLoading}
            onClick={() => void forceShip()}
          >
            {forceShipLoading ?
              <Loader2 className='h-4 w-4 animate-spin' />
            : <RefreshCw className='h-4 w-4' />}
            Mark shipped &amp; notify (Delhivery)
          </Button>
        </div>
      : null}

      {/* ── Manual courier / tracking ─────────────────────────────── */}
      {canManualShip ?
        <div className='space-y-3'>
          <div>
            <MicroLabel>Manual courier / tracking</MicroLabel>
            <p className='text-[11px] text-gray-500 mt-0.5 leading-snug'>
              Non-Delhivery courier? Fill details, pick the email, tick “Mark
              shipped” if already dispatched.
            </p>
          </div>
          <div className='grid grid-cols-1 gap-2'>
            <input
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              placeholder='Courier (BlueDart, India Post, …)'
              className={inputClass}
            />
            <input
              value={awb}
              onChange={(e) => setAwb(e.target.value)}
              placeholder='AWB / tracking number'
              className={cn(inputClass, "font-mono")}
            />
            <input
              value={trackUrl}
              onChange={(e) => setTrackUrl(e.target.value)}
              placeholder='Tracking URL (optional)'
              className={inputClass}
            />
          </div>

          <div>
            <MicroLabel className='mb-1.5'>After save, email customer</MicroLabel>
            <div className='grid grid-cols-2 gap-1.5'>
              {NOTIFY_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  type='button'
                  onClick={() => setNotifyMode(o.id)}
                  className={cn(
                    "rounded-lg border px-2.5 py-1.5 text-left text-[11px] font-semibold transition-colors",
                    notifyMode === o.id ?
                      "border-brand-300 bg-brand-50 text-brand-900 ring-1 ring-brand-200"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <p className='text-[11px] text-gray-500 leading-snug mt-1.5'>
              {NOTIFY_OPTIONS.find((o) => o.id === notifyMode)?.help}
            </p>
          </div>

          <label className='flex items-start gap-2 text-xs text-gray-700 rounded-lg border border-gray-200 px-3 py-2 cursor-pointer hover:bg-gray-50'>
            <input
              type='checkbox'
              className='mt-0.5 accent-brand-600'
              checked={markShipped}
              onChange={(e) => {
                setMarkShipped(e.target.checked);
                if (e.target.checked && notifyMode === "none") {
                  setNotifyMode("shipped");
                }
              }}
            />
            <span>
              Mark order as <b>Shipped</b>
              <span className='block text-[11px] text-gray-500'>
                Customer sees the track button on the website.
              </span>
            </span>
          </label>

          <Button
            type='button'
            variant='outline'
            size='sm'
            className='w-full rounded-xl gap-1.5'
            disabled={shippingSaving}
            onClick={() => void saveShipping()}
          >
            {shippingSaving ?
              <Loader2 className='h-4 w-4 animate-spin' />
            : <Truck className='h-4 w-4' />}
            Save shipping details
          </Button>
        </div>
      : null}

      {/* ── Sent log ──────────────────────────────────────────────── */}
      <div className={cn(canManualShip && "pt-4 border-t border-gray-100")}>
        <MicroLabel className='mb-2'>Sent to customer</MicroLabel>
        {comms.length === 0 ?
          <p className='text-xs text-gray-500'>No logged communications yet.</p>
        : <ul className='space-y-1.5 max-h-40 overflow-y-auto pr-0.5'>
            {comms.map((c, i) => {
              const Icon = channelIcon(c.channel);
              return (
                <li
                  key={`${c.kind}-${c.sentAt}-${i}`}
                  className='flex items-start gap-2.5 text-xs rounded-lg border border-gray-100 bg-gray-50/60 px-2.5 py-2'
                >
                  <span className='mt-0.5 h-5 w-5 rounded-md bg-white border border-gray-200 flex items-center justify-center text-gray-500 shrink-0'>
                    <Icon className='h-3 w-3' />
                  </span>
                  <div className='min-w-0 flex-1'>
                    <p className='font-medium text-gray-800 truncate'>
                      {c.subject || kindLabel(c.kind)}
                    </p>
                    <p className='text-[11px] text-gray-500'>
                      {kindLabel(c.kind)} · {formatDateTime(c.sentAt)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        }
      </div>

      {/* ── Resend / template ─────────────────────────────────────── */}
      <div className='pt-4 border-t border-gray-100'>
        <button
          type='button'
          onClick={() => setResendOpen((v) => !v)}
          className='w-full flex items-center justify-between text-left'
          aria-expanded={resendOpen}
        >
          <MicroLabel>Send / resend a template</MicroLabel>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-gray-400 transition-transform",
              resendOpen && "rotate-180",
            )}
          />
        </button>
        {resendOpen ?
          <div className='mt-3 space-y-2'>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value as TemplateId)}
              className={inputClass}
            >
              {TEMPLATE_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
            {template === "custom" ?
              <>
                <input
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder='Subject'
                  className={inputClass}
                />
                <textarea
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                  placeholder='Message (plain text or HTML)'
                  rows={4}
                  className={cn(inputClass, "h-auto py-2")}
                />
              </>
            : null}
            <label className='flex items-center gap-2 text-xs text-gray-600'>
              <input
                type='checkbox'
                className='accent-brand-600'
                checked={sendInApp}
                onChange={(e) => setSendInApp(e.target.checked)}
              />
              Also send in-app notification
            </label>
            <Button
              type='button'
              size='sm'
              variant='brand'
              className='w-full rounded-xl gap-1.5'
              disabled={sending}
              onClick={() => void resend()}
            >
              {sending ?
                <Loader2 className='h-4 w-4 animate-spin' />
              : <Send className='h-4 w-4' />}
              Queue email
            </Button>
          </div>
        : null}
      </div>
    </AdminOrderSectionCard>
  );
}
