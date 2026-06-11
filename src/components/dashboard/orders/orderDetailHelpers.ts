import { Order } from "@/types";
import { formatDate } from "@/lib/utils";

export type TrackingEvent = {
  key: string;
  label: string;
  detail?: string;
  timestamp?: string;
  state: "done" | "current" | "upcoming";
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Order Placed",
  confirmed: "Order Confirmed",
  processing: "Processing at Atelier",
  shipped: "Order Shipped",
  delivered: "Delivered",
};

export function getExpectedDeliveryLabel(order: Order): string | null {
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

export function buildTrackingTimeline(order: Order): TrackingEvent[] {
  const scans = order.delhivery?.trackScansSnapshot ?? [];
  if (scans.length > 0) {
    return scans.map((scan, i) => ({
      key: `scan-${i}`,
      label: scan.status || "Update",
      detail: [scan.location, scan.detail].filter(Boolean).join(" · ") || undefined,
      timestamp: scan.time,
      state: i < scans.length - 1 ? "done" : order.status === "delivered" ? "done" : "current",
    }));
  }

  const history = [...(order.statusHistory || [])].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  if (history.length > 0) {
    const lastIdx = history.length - 1;
    return history.map((h, i) => ({
      key: `${h.status}-${i}`,
      label: STATUS_LABELS[h.status] || h.status,
      detail: h.note,
      timestamp: h.timestamp,
      state:
        order.status === "delivered" ? "done"
        : i < lastIdx ? "done"
        : i === lastIdx ? "current"
        : "upcoming",
    }));
  }

  const steps = ["pending", "confirmed", "processing", "shipped", "delivered"];
  const current = steps.indexOf(order.status);
  return steps.map((step, i) => ({
    key: step,
    label: STATUS_LABELS[step] || step,
    state:
      current < 0 ? "upcoming"
      : i < current ? "done"
      : i === current ? "current"
      : "upcoming",
  }));
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
