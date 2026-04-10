import type { Order } from "@/types";

export const RETURN_REASON_OPTIONS = [
  "Size/Fit Issue",
  "Defective/Damaged",
  "Wrong Item Received",
  "Changed My Mind",
  "Other",
] as const;

export type ReturnReasonOption = (typeof RETURN_REASON_OPTIONS)[number];

export function getReturnReasonByIndex(index: number): string | undefined {
  return RETURN_REASON_OPTIONS[index];
}

/** Same rules as backend: delivered, within 7 days of deliveredAt, no active return. */
export function isOrderReturnEligible(order: Order): boolean {
  if (order.status !== "delivered" || !order.deliveredAt) return false;
  const rs = (order as { returnStatus?: string }).returnStatus;
  if (rs && rs !== "none") return false;
  const deliveredTime = new Date(order.deliveredAt).getTime();
  const daysSinceDelivery =
    (Date.now() - deliveredTime) / (1000 * 60 * 60 * 24);
  return daysSinceDelivery <= 7;
}
