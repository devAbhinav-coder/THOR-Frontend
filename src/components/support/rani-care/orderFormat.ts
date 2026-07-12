import type { Order } from "@/types";
import { formatDate, formatPrice } from "@/lib/utils";
import type { ChatMessage, OrderSummary, QuickAction } from "./types";

export function botMessage(text: string, actions?: QuickAction[], orders?: OrderSummary[]): ChatMessage {
  return {
    id: `b_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    sender: "bot",
    text,
    timestamp: Date.now(),
    actions,
    orders,
  };
}

export function userMessage(text: string): ChatMessage {
  return { id: `u_${Date.now()}_${Math.random().toString(36).slice(2)}`, sender: "user", text, timestamp: Date.now() };
}

export function summarizeOrder(o: Order): OrderSummary {
  const names = (o.items || []).map((i) => i.name).filter(Boolean);
  const preview =
    names.length === 0
      ? "Items in order"
      : names.slice(0, 2).join(" · ") + (names.length > 2 ? ` +${names.length - 2} more` : "");

  const canCancel = o.status === "pending" || o.status === "confirmed";

  return {
    id: o._id,
    orderNumber: o.orderNumber,
    status: o.status,
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod,
    total: o.total,
    createdAt: o.createdAt,
    preview,
    canCancel,
    trackingNumber: o.trackingNumber,
    shippingCarrier: o.shippingCarrier,
  };
}

function payMethodLabel(o: Order): string {
  switch (o.paymentMethod) {
    case "cod":
      return "COD";
    case "razorpay":
      return "Online";
    case "offline_upi":
      return "UPI";
    case "offline_cash":
      return "Cash";
    default:
      return "—";
  }
}

function titleCase(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function itemLines(o: Order): string[] {
  const items = o.items || [];
  const shown = items.slice(0, 6).map((i) => `• ${i.name} × ${i.quantity}`);
  if (items.length > 6) shown.push(`• +${items.length - 6} more`);
  return shown;
}

export function formatOrderDetailText(o: Order): string {
  const trackingLine = o.trackingNumber
    ? `Tracking: ${o.trackingNumber}${o.shippingCarrier ? ` · ${o.shippingCarrier}` : ""}`
    : "Tracking: not assigned yet (appears after dispatch).";

  const lines = [
    `📦 Order ${o.orderNumber}`,
    `Placed: ${formatDate(o.createdAt)}`,
    `Status: ${titleCase(o.status)}`,
    `Payment: ${payMethodLabel(o)} · ${titleCase(o.paymentStatus || "—")}`,
    `Total: ${formatPrice(o.total)}`,
    trackingLine,
    "",
    "Items:",
    ...itemLines(o),
  ].filter(Boolean);

  return lines.join("\n");
}

/** Compact facts (no status/tracking sentence) — used when a headline blurb
 *  already states the status, to avoid repeating everything. */
export function formatOrderFacts(o: Order): string {
  const lines = [
    `📦 ${o.orderNumber}`,
    `Placed: ${formatDate(o.createdAt)}`,
    `Payment: ${payMethodLabel(o)} · ${titleCase(o.paymentStatus || "—")}`,
    `Total: ${formatPrice(o.total)}`,
    "",
    "Items:",
    ...itemLines(o),
  ].filter(Boolean);
  return lines.join("\n");
}
