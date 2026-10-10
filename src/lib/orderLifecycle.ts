import { Order } from "@/types";

export type OrderLifecycleEvent = {
  key: string;
  status: string;
  label: string;
  detail?: string;
  timestamp?: string;
  state: "done" | "current" | "upcoming";
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Order placed",
  confirmed: "Order confirmed",
  processing: "Processing at atelier",
  shipped: "Order shipped",
  delivered: "Delivered",
  cancelled: "Order cancelled",
  refunded: "Refund processed",
  return_requested: "Return requested",
  return_approved: "Return approved",
  return_rejected: "Return rejected",
  returned: "Return completed",
};

const FULFILLMENT_STEPS = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
] as const;

function labelForStatus(status: string): string {
  return (
    STATUS_LABELS[status] ||
    status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function sortHistory(order: Order): { status: string; timestamp: string; note?: string }[] {
  const raw = order.statusHistory ?? [];
  return [...raw].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
}

/** Customer cancellation reason stored on the cancelled statusHistory entry. */
export function getOrderCancelReason(order: Pick<Order, "statusHistory">): string | undefined {
  const entries = order.statusHistory ?? [];
  for (let i = entries.length - 1; i >= 0; i--) {
    const h = entries[i];
    if (h.status === "cancelled" && h.note?.trim()) {
      return h.note.trim();
    }
  }
  return undefined;
}

/**
 * Timeline from real statusHistory only — never paints processing/shipped/delivered
 * unless those statuses were actually recorded.
 */
export function buildOrderLifecycleTimeline(order: Order): OrderLifecycleEvent[] {
  const status = order.status;
  const terminal = status === "cancelled" || status === "refunded";

  const scans = order.delhivery?.trackScansSnapshot ?? [];
  const useCourierScans =
    scans.length > 0 &&
    !terminal &&
    (status === "shipped" || status === "delivered");

  if (useCourierScans) {
    return scans.map((scan, i) => ({
      key: `scan-${i}`,
      status: "courier_scan",
      label: scan.status || "Courier update",
      detail: [scan.location, scan.detail].filter(Boolean).join(" · ") || undefined,
      timestamp: scan.time,
      state:
        i < scans.length - 1 ? "done"
        : status === "delivered" ? "done"
        : "current",
    }));
  }

  let history = sortHistory(order);

  if (history.length === 0 && order.createdAt) {
    history = [
      {
        status: FULFILLMENT_STEPS.includes(status as (typeof FULFILLMENT_STEPS)[number])
          ? status
          : "pending",
        timestamp: order.createdAt,
      },
    ];
  }

  if (history.length === 0) return [];

  const lastIdx = history.length - 1;
  const allDelivered = status === "delivered";

  return history.map((h, i) => {
    const isLast = i === lastIdx;
    let state: OrderLifecycleEvent["state"];
    if (allDelivered) state = "done";
    else if (isLast) state = "current";
    else state = "done";

    const detail =
      h.status === "cancelled" && h.note?.trim() ?
        `Reason: ${h.note.trim()}`
      : h.note?.trim() || undefined;

    return {
      key: `${h.status}-${i}-${h.timestamp}`,
      status: h.status,
      label: labelForStatus(h.status),
      detail,
      timestamp: h.timestamp,
      state,
    };
  });
}

/** Legacy fallback: only steps up to current status (no future milestones). */
export function buildSyntheticFulfillmentUpToCurrent(
  status: string,
): OrderLifecycleEvent[] {
  if (status === "cancelled" || status === "refunded") {
    return [];
  }
  const idx = FULFILLMENT_STEPS.indexOf(status as (typeof FULFILLMENT_STEPS)[number]);
  if (idx < 0) return [];
  return FULFILLMENT_STEPS.slice(0, idx + 1).map((step, i) => ({
    key: step,
    status: step,
    label: labelForStatus(step),
    state: i < idx ? "done" : "current",
  }));
}
