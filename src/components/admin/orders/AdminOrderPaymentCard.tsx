"use client";

import { CreditCard, TicketPercent, Undo2 } from "lucide-react";
import type { Order } from "@/types";
import { Button } from "@/components/ui/button";
import { cn, formatDateTime, formatPrice } from "@/lib/utils";
import {
  getMaxRefundableInr,
  getNonRefundableFeesInr,
} from "@/lib/orderRefundPolicy";
import AdminOrderSectionCard, { MicroLabel } from "./AdminOrderSectionCard";
import AdminCopyButton from "./AdminCopyButton";
import { PaymentStatusBadge, paymentMethodLabel } from "./AdminOrderStatusBadge";

function couponCode(order: Order): string | null {
  const c = order.coupon;
  if (!c) return null;
  if (typeof c === "string") return c;
  return c.code ?? null;
}

export default function AdminOrderPaymentCard({
  order,
  onProcessRefund,
  refundCtaVisible,
}: {
  order: Order;
  onProcessRefund: () => void;
  /** Show the refund CTA inside the card (e.g. paid Razorpay order cancelled) */
  refundCtaVisible: boolean;
}) {
  const nonRefundable = getNonRefundableFeesInr(order);
  const maxRefundable = getMaxRefundableInr(order);
  const coupon = couponCode(order);
  const refund = order.refundData;

  const rows: { label: React.ReactNode; value: React.ReactNode; tone?: string }[] = [
    { label: "Subtotal", value: formatPrice(order.subtotal) },
  ];
  if (order.discount > 0) {
    rows.push({
      label: (
        <span className='inline-flex items-center gap-1.5'>
          Discount
          {coupon ?
            <span className='inline-flex items-center gap-1 rounded-md bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-100 px-1.5 py-px text-[10px] font-bold font-mono uppercase'>
              <TicketPercent className='h-3 w-3' /> {coupon}
            </span>
          : null}
        </span>
      ),
      value: `− ${formatPrice(order.discount)}`,
      tone: "text-emerald-700",
    });
  }
  rows.push({
    label: (
      <span>
        Shipping
        <span className='block text-[10px] text-amber-700/90 font-normal'>
          Non-refundable on returns
        </span>
      </span>
    ),
    value:
      order.shippingCharge === 0 ?
        <span className='text-emerald-700 font-semibold'>FREE</span>
      : formatPrice(order.shippingCharge || 0),
  });
  if ((order.codFee || 0) > 0) {
    rows.push({
      label: (
        <span>
          COD handling fee
          <span className='block text-[10px] text-amber-700/90 font-normal'>
            Non-refundable on returns
          </span>
        </span>
      ),
      value: formatPrice(order.codFee || 0),
    });
  }
  if ((order.tax || 0) > 0) {
    rows.push({ label: "Tax", value: formatPrice(order.tax) });
  }

  return (
    <AdminOrderSectionCard
      id='payment'
      icon={CreditCard}
      tone='navy'
      title='Payment'
      description={paymentMethodLabel(order.paymentMethod)}
      action={<PaymentStatusBadge status={order.paymentStatus} order={order} size='sm' />}
      bodyClassName='space-y-4'
    >
      <dl className='space-y-2 text-sm'>
        {rows.map((r, i) => (
          <div key={i} className='flex items-start justify-between gap-3'>
            <dt className='text-gray-600'>{r.label}</dt>
            <dd className={cn("tabular-nums text-right text-gray-900", r.tone)}>
              {r.value}
            </dd>
          </div>
        ))}
        <div className='pt-3 mt-1 border-t border-gray-200 flex items-baseline justify-between'>
          <dt className='text-sm font-semibold text-gray-900'>Total</dt>
          <dd className='text-xl font-bold text-gray-900 tabular-nums'>
            {formatPrice(order.total)}
          </dd>
        </div>
      </dl>

      {(order.razorpayOrderId || order.razorpayPaymentId) && (
        <div className='rounded-xl border border-gray-200 bg-gray-50/70 px-3.5 py-2.5 space-y-1.5'>
          <MicroLabel>Razorpay</MicroLabel>
          {order.razorpayPaymentId ?
            <IdRow label='Payment' value={order.razorpayPaymentId} />
          : null}
          {order.razorpayOrderId ?
            <IdRow label='Order' value={order.razorpayOrderId} />
          : null}
        </div>
      )}

      {nonRefundable > 0 && !refund ?
        <p className='rounded-xl bg-amber-50/80 border border-amber-100 px-3 py-2 text-[11px] text-amber-900 leading-snug'>
          <span className='font-semibold'>Return refunds:</span> max{" "}
          <span className='tabular-nums font-bold'>{formatPrice(maxRefundable)}</span>{" "}
          to customer (shipping {formatPrice(order.shippingCharge || 0)}
          {(order.codFee || 0) > 0 ? ` + COD ${formatPrice(order.codFee || 0)}` : ""}{" "}
          retained).
        </p>
      : null}

      {refund ?
        <div className='rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs space-y-1'>
          <div className='flex items-center justify-between gap-2'>
            <span className='inline-flex items-center gap-1.5 font-semibold text-gray-900'>
              <Undo2 className='h-3.5 w-3.5 text-gray-500' /> Refunded{" "}
              <span className='tabular-nums'>{formatPrice(refund.amount)}</span>
            </span>
            <span className='capitalize text-gray-600'>
              {String(refund.method).replace(/_/g, " ")}
            </span>
          </div>
          {refund.processedAt ?
            <p className='text-gray-500'>{formatDateTime(refund.processedAt)}</p>
          : null}
        </div>
      : null}

      {refundCtaVisible ?
        <Button
          type='button'
          className='w-full rounded-xl bg-red-600 hover:bg-red-700 text-white gap-1.5'
          onClick={onProcessRefund}
        >
          <Undo2 className='h-4 w-4' /> Process refund · {formatPrice(maxRefundable)}
        </Button>
      : null}
    </AdminOrderSectionCard>
  );
}

function IdRow({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex items-center justify-between gap-2 text-xs min-w-0'>
      <span className='text-gray-500 shrink-0'>{label}</span>
      <span className='inline-flex items-center gap-1 min-w-0'>
        <span className='font-mono text-gray-800 truncate'>{value}</span>
        <AdminCopyButton value={value} label={`Copy ${label} ID`} iconOnly />
      </span>
    </div>
  );
}
