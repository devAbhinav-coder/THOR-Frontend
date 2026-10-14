import type { Order } from "@/types";
import { RETURN_WINDOW_DAYS } from "@/lib/returnPolicy";

export const RETURN_REASON_OPTIONS = [
  "Size/Fit Issue",
  "Defective/Damaged",
  "Wrong Item Received",
  "Changed My Mind",
  "Other",
] as const;

export type ReturnReasonOption = (typeof RETURN_REASON_OPTIONS)[number];

/** Admin-side reasons — worded from the team's point of view, grouped for quick scanning. */
export const ADMIN_RETURN_REASON_GROUPS = [
  {
    group: "Product issue",
    reasons: [
      { value: "Damaged / defective on arrival", hint: "Broken, torn, stained, faulty" },
      { value: "Wrong item or variant sent", hint: "Different product, size or colour" },
      { value: "Quality not as described", hint: "Fabric, finish or colour mismatch" },
      { value: "Missing parts / incomplete", hint: "Piece or accessory missing" },
    ],
  },
  {
    group: "Customer preference",
    reasons: [
      { value: "Size / fit issue", hint: "Too small, too large, poor fit" },
      { value: "Customer changed mind", hint: "No longer wanted" },
      { value: "Late delivery", hint: "Arrived after needed date" },
      { value: "Duplicate / mistaken order", hint: "Ordered twice or by mistake" },
    ],
  },
] as const;

export const ADMIN_RETURN_OTHER = "Other";

export const ADMIN_RETURN_CHANNELS = [
  { value: "phone", label: "Phone call" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "instagram", label: "Instagram DM" },
  { value: "in_store", label: "In store" },
  { value: "other", label: "Other" },
] as const;

export type AdminReturnChannel = (typeof ADMIN_RETURN_CHANNELS)[number]["value"];

export function adminReturnChannelLabel(value?: string): string | undefined {
  return ADMIN_RETURN_CHANNELS.find((c) => c.value === value)?.label;
}

export const RETURN_STATUS_LABELS: Record<string, string> = {
  requested: "Return requested",
  approved: "Approved · awaiting pickup",
  picked_up: "Picked up · in transit",
  received: "Received · refund pending",
  rejected: "Rejected",
  returned: "Returned & refunded",
};

/** Ordered return workflow — refund is only unlocked at `received`. */
export const RETURN_STEPS = [
  { key: "requested", label: "Requested" },
  { key: "approved", label: "Approved" },
  { key: "picked_up", label: "Picked up" },
  { key: "received", label: "Received" },
  { key: "returned", label: "Refunded" },
] as const;

export function returnStepIndex(status: string | undefined): number {
  const i = RETURN_STEPS.findIndex((s) => s.key === status);
  return i < 0 ? 0 : i;
}

/** Refund is never promised before the item is back with us and inspected. */
export const RETURN_STATUS_CUSTOMER_COPY: Record<string, string> = {
  requested:
    "We've received your return request and our team is reviewing it — usually within 1–2 business days.",
  approved:
    "Your return is approved. We'll arrange a pickup from your delivery address. Your refund begins only after the item is picked up and passes our quality check.",
  picked_up:
    "Your item has been picked up and is on its way to us. Once it arrives and passes our quality check, we'll initiate your refund.",
  received:
    "Your item has reached us and is going through a quality check. Your refund will be initiated as soon as it's complete.",
  rejected:
    "This return request was not approved. Contact support if you need help.",
  returned: "Your return is complete and the refund has been processed.",
};

export const RETURN_STATUS_CUSTOMER_TITLE: Record<string, string> = {
  requested: "Return request received",
  approved: "Return approved · pickup next",
  picked_up: "Return on its way to us",
  received: "Quality check in progress",
  rejected: "Return not approved",
  returned: "Return complete & refunded",
};

export const RETURN_NEXT_STEPS_CUSTOMER: Record<string, string[]> = {
  requested: [
    "Our team reviews your request — usually within 1–2 business days.",
    "Once approved, we'll arrange a pickup from your delivery address.",
  ],
  approved: [
    "Our courier partner will contact you to collect the item.",
    "Keep it unused and packed, with original tags intact.",
    "Your refund starts only after the item reaches us and passes a quality check.",
  ],
  picked_up: [
    "Your parcel is travelling back to our studio.",
    "On arrival we inspect it, then initiate your refund.",
  ],
  received: [
    "We're checking the item's condition.",
    "Your refund is initiated right after — you'll get an email with the amount and method.",
  ],
};

export function refundMethodCustomerLabel(method?: string): string | undefined {
  if (!method) return undefined;
  switch (method) {
    case "original_payment":
    case "razorpay_auto":
      return "Original payment method";
    case "upi":
    case "upi_manual":
      return "UPI";
    case "bank_transfer":
      return "Bank transfer";
    case "cash":
      return "Cash";
    default:
      return method.replace(/_/g, " ");
  }
}

export function getReturnReasonByIndex(index: number): string | undefined {
  return RETURN_REASON_OPTIONS[index];
}

/** Same rules as backend: delivered, within RETURN_WINDOW_DAYS of deliveredAt, no active return. */
export function isOrderReturnEligible(order: Order): boolean {
  if (order.status !== "delivered" || !order.deliveredAt) return false;
  const rs = (order as { returnStatus?: string }).returnStatus;
  if (rs && rs !== "none") return false;
  const deliveredTime = new Date(order.deliveredAt).getTime();
  const daysSinceDelivery =
    (Date.now() - deliveredTime) / (1000 * 60 * 60 * 24);
  return daysSinceDelivery <= RETURN_WINDOW_DAYS;
}
