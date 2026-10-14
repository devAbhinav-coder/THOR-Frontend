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
  return_picked_up: "Return picked up",
  return_received: "Return received",
  returned: "Return completed",
};

export function isPostDeliveryStatus(status: string): boolean {
  return status.startsWith("return_") || status === "refunded";
}

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

export type OrderCancelInitiatedBy = "customer" | "admin";

export type OrderCancellationInfo = {
  reason?: string;
  initiatedBy?: OrderCancelInitiatedBy;
};

type HistoryEntry = {
  status: string;
  timestamp: string;
  note?: string;
  actor?: OrderCancelInitiatedBy;
};

function sortHistory(order: Pick<Order, "statusHistory">): HistoryEntry[] {
  const raw = order.statusHistory ?? [];
  const time = (ts: string) => {
    const t = new Date(ts).getTime();
    return Number.isNaN(t) ? 0 : t;
  };
  return raw
    .map((h, i) => ({ h, i }))
    .sort((a, b) => time(a.h.timestamp) - time(b.h.timestamp) || a.i - b.i)
    .map(({ h }) => h);
}

/**
 * Shipping-detail edits re-log the current status ("delivered" again after a
 * return, etc.). Each fulfilment milestone is shown once, at its first time.
 */
function dedupeFulfilmentMilestones(history: HistoryEntry[]): HistoryEntry[] {
  const seen = new Set<string>();
  return history.filter((h) => {
    if (!FULFILLMENT_STEPS.includes(h.status as (typeof FULFILLMENT_STEPS)[number])) {
      return true;
    }
    if (seen.has(h.status)) return false;
    seen.add(h.status);
    return true;
  });
}

/** Latest cancelled statusHistory entry (reason + who initiated). */
export function getOrderCancellationInfo(
  order: Pick<Order, "statusHistory">,
): OrderCancellationInfo {
  const entries = order.statusHistory ?? [];
  for (let i = entries.length - 1; i >= 0; i--) {
    const h = entries[i];
    if (h.status === "cancelled") {
      const reason = h.note?.trim() || undefined;
      const initiatedBy =
        h.actor === "admin" || h.actor === "customer" ? h.actor : undefined;
      if (reason || initiatedBy) {
        return { reason, initiatedBy };
      }
    }
  }
  return {};
}

/** @deprecated Prefer getOrderCancellationInfo for initiatedBy-aware UI. */
export function getOrderCancelReason(
  order: Pick<Order, "statusHistory">,
): string | undefined {
  return getOrderCancellationInfo(order).reason;
}

function historyToLifecycleEvents(
  history: HistoryEntry[],
  orderStatus: string,
): OrderLifecycleEvent[] {
  if (history.length === 0) return [];

  const lastIdx = history.length - 1;
  const terminal = orderStatus === "cancelled" || orderStatus === "refunded";
  const returnInProgress =
    orderStatus === "delivered" &&
    (history[lastIdx]?.status ?? "").startsWith("return_") &&
    history[lastIdx]?.status !== "return_rejected";
  const allDone =
    terminal || (orderStatus === "delivered" && !returnInProgress);

  const events: OrderLifecycleEvent[] = history.map((h, i) => {
    const isLast = i === lastIdx;
    let state: OrderLifecycleEvent["state"];
    if (allDone) state = "done";
    else if (isLast) state = "current";
    else state = "done";

    const detail = (() => {
      if (h.status === "refunded" && /^[a-z_]+$/.test(h.note?.trim() ?? "")) {
        return undefined;
      }
      if (h.status !== "cancelled" || !h.note?.trim()) {
        return h.note?.trim() || undefined;
      }
      const note = h.note.trim();
      if (h.actor === "admin") {
        return `Cancelled by team — ${note}`;
      }
      if (h.actor === "customer") {
        return `Customer reason — ${note}`;
      }
      return `Reason: ${note}`;
    })();

    return {
      key: `${h.status}-${i}-${h.timestamp}`,
      status: h.status,
      label: labelForStatus(h.status),
      detail,
      timestamp: h.timestamp,
      state,
    };
  });

  const lastHistoryStatus = history[lastIdx]?.status;
  if (
    !terminal &&
    lastHistoryStatus &&
    lastHistoryStatus !== orderStatus &&
    !isPostDeliveryStatus(lastHistoryStatus) &&
    !history.some((h) => h.status === orderStatus)
  ) {
    if (events.length > 0) {
      events[events.length - 1]!.state = "done";
    }
    const syncStep: OrderLifecycleEvent = {
      key: `status-sync-${orderStatus}`,
      status: orderStatus,
      label: labelForStatus(orderStatus),
      state: "current",
    };
    events.push(syncStep);
  }

  return events;
}

function courierScanEvents(
  scans: NonNullable<Order["delhivery"]>["trackScansSnapshot"],
  orderStatus: string,
): OrderLifecycleEvent[] {
  const list = scans ?? [];
  return list.map((scan, i) => ({
    key: `scan-${i}`,
    status: "courier_scan",
    label: scan.status || "Courier update",
    detail: [scan.location, scan.detail].filter(Boolean).join(" · ") || undefined,
    timestamp: scan.time,
    state:
      i < list.length - 1 ? "done"
      : orderStatus === "delivered" ? "done"
      : "current",
  }));
}

/**
 * Timeline from real statusHistory only — never paints processing/shipped/delivered
 * unless those statuses were actually recorded.
 */
export function buildOrderLifecycleTimeline(order: Order): OrderLifecycleEvent[] {
  const status = order.status;
  const terminal = status === "cancelled" || status === "refunded";

  let history = dedupeFulfilmentMilestones(sortHistory(order));

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

  const historyEvents = historyToLifecycleEvents(history, status);

  const scans = order.delhivery?.trackScansSnapshot ?? [];
  const useCourierScans =
    scans.length > 0 &&
    !terminal &&
    (status === "shipped" || status === "delivered");

  if (useCourierScans) {
    const postDelivery = historyEvents.filter((e) =>
      isPostDeliveryStatus(e.status),
    );
    const milestones = historyEvents
      .filter((e) => !isPostDeliveryStatus(e.status))
      .map((e) => ({ ...e, state: "done" as const }));
    const scansEv = courierScanEvents(scans, status);
    const lastScan = scansEv[scansEv.length - 1];
    if (lastScan) lastScan.state = status === "delivered" ? "done" : "current";
    return [...milestones, ...scansEv, ...postDelivery];
  }

  return historyEvents;
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

export type ReturnJourneyStepKey =
  | "requested"
  | "approved"
  | "picked_up"
  | "received"
  | "refunded"
  | "rejected";

export type ReturnJourneyStep = {
  key: ReturnJourneyStepKey;
  label: string;
  /** Shown instead of a timestamp while the step is the one being worked on. */
  pendingLabel?: string;
  state: "done" | "current" | "upcoming" | "failed";
  timestamp?: string;
  detail?: string;
};

const RETURN_JOURNEY: {
  key: Exclude<ReturnJourneyStepKey, "rejected">;
  label: string;
  pendingLabel: string;
  historyStatus: string;
}[] = [
  { key: "requested", label: "Return requested", pendingLabel: "", historyStatus: "return_requested" },
  { key: "approved", label: "Approved", pendingLabel: "Under review", historyStatus: "return_approved" },
  { key: "picked_up", label: "Picked up", pendingLabel: "Pickup being arranged", historyStatus: "return_picked_up" },
  { key: "received", label: "Received & checked", pendingLabel: "On its way to us", historyStatus: "return_received" },
  { key: "refunded", label: "Refunded", pendingLabel: "After quality check", historyStatus: "refunded" },
];

const RETURN_REACHED_INDEX: Record<string, number> = {
  requested: 0,
  approved: 1,
  picked_up: 2,
  received: 3,
  returned: 4,
};

/**
 * Full return path (done + what's still ahead) for the active return.
 * Refund is always the last step — it only unlocks after the item is received.
 */
export function buildReturnJourney(order: Order): ReturnJourneyStep[] | null {
  const rs = order.returnStatus;
  if (!rs || rs === "none") return null;

  const history = sortHistory(order);
  let start = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i]!.status === "return_requested") {
      start = i;
      break;
    }
  }
  const currentReturn = history.slice(start);
  const latest = (status: string) => {
    for (let i = currentReturn.length - 1; i >= 0; i--) {
      if (currentReturn[i]!.status === status) return currentReturn[i];
    }
    return undefined;
  };

  const req = order.returnRequest;
  const fallbackTime: Record<string, string | undefined> = {
    requested: req?.requestedAt,
    approved: req?.resolvedAt,
    picked_up: req?.pickedUpAt,
    received: req?.receivedAt,
    refunded: order.refundData?.processedAt,
  };

  const requested = latest("return_requested");
  if (rs === "rejected") {
    const rejected = latest("return_rejected");
    return [
      {
        key: "requested",
        label: "Return requested",
        state: "done",
        timestamp: requested?.timestamp ?? req?.requestedAt,
        detail: requested?.note?.trim() || req?.reason,
      },
      {
        key: "rejected",
        label: "Return rejected",
        state: "failed",
        timestamp: rejected?.timestamp ?? req?.resolvedAt,
        detail: rejected?.note?.trim() || req?.adminNote,
      },
    ];
  }

  const reached = RETURN_REACHED_INDEX[rs] ?? 0;
  const pickupSkipped =
    reached > 2 && !latest("return_picked_up") && !req?.pickedUpAt;

  return RETURN_JOURNEY.filter((s) => !(s.key === "picked_up" && pickupSkipped)).map(
    (step) => {
      const index = RETURN_JOURNEY.findIndex((s) => s.key === step.key);
      const entry = latest(step.historyStatus);
      const state: ReturnJourneyStep["state"] =
        index <= reached ? "done"
        : index === reached + 1 ? "current"
        : "upcoming";
      return {
        key: step.key,
        label: step.label,
        pendingLabel: step.pendingLabel || undefined,
        state,
        timestamp:
          state === "done" ? entry?.timestamp ?? fallbackTime[step.key] : undefined,
        detail:
          state !== "done" || step.key === "refunded" ? undefined
          : entry?.note?.trim() ||
            (step.key === "requested" ? req?.reason : undefined),
      };
    },
  );
}
