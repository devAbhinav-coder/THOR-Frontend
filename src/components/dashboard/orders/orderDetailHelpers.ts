import { Order } from "@/types";
import { formatDate } from "@/lib/utils";
import {
  buildOrderLifecycleTimeline,
  buildSyntheticFulfillmentUpToCurrent,
  OrderLifecycleEvent,
} from "@/lib/orderLifecycle";

export type TrackingEvent = OrderLifecycleEvent;

export function getExpectedDeliveryLabel(order: Order): string | null {
  if (order.status === "cancelled" || order.status === "refunded") {
    return null;
  }
  if (order.status === "delivered" && order.deliveredAt) {
    return `Delivered on ${formatDate(order.deliveredAt)}`;
  }
  if (order.deliveredAt) {
    return `Expected delivery on ${formatDate(order.deliveredAt)}`;
  }
  const tat = order.delhivery?.estimatedTatDays;
  const base = order.shippedAt || order.createdAt;
  if (tat != null && base && ["shipped", "processing", "confirmed"].includes(order.status)) {
    const d = new Date(base);
    d.setDate(d.getDate() + tat);
    return `Expected delivery on ${formatDate(d.toISOString())}`;
  }
  if (order.status === "shipped") {
    return "Your package is on its way";
  }
  if (["pending", "confirmed", "processing"].includes(order.status)) {
    return "We will notify you when your order ships";
  }
  return null;
}

/** Team-entered notes (pickup courier/AWB, inspection result, refund ref) stay admin-only. */
const STAFF_ONLY_DETAIL_STATUSES = new Set([
  "return_picked_up",
  "return_received",
  "refunded",
]);

export function buildTrackingTimeline(order: Order): TrackingEvent[] {
  const fromHistory = buildOrderLifecycleTimeline(order).map((e) =>
    STAFF_ONLY_DETAIL_STATUSES.has(e.status) ? { ...e, detail: undefined } : e,
  );
  if (fromHistory.length > 0) return fromHistory;
  return buildSyntheticFulfillmentUpToCurrent(order.status);
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return phone;
  const last4 = digits.slice(-4);
  const prefix = digits.startsWith("91") ? "+91 " : "";
  return `${prefix}******${last4}`;
}

export function paymentMethodLabel(method: Order["paymentMethod"]): string {
  switch (method) {
    case "cod":
      return "Cash on Delivery";
    case "offline_upi":
      return "UPI (In-store)";
    case "offline_cash":
      return "Cash (In-store)";
    default:
      return "Online Payment";
  }
}
