export const CANCEL_REASON_OPTIONS = [
  "Changed my mind",
  "Ordered by mistake",
  "Need to change size / colour / items",
  "Delivery is taking too long",
  "Found a better price elsewhere",
  "Payment or duplicate order issue",
  "Other",
] as const;

export type CancelReasonOption = (typeof CANCEL_REASON_OPTIONS)[number];

/** Admin-initiated cancellation — operational reasons (shown in customer email + timeline). */
export const ADMIN_CANCEL_REASON_OPTIONS = [
  "Out of stock / cannot fulfill",
  "Payment could not be verified",
  "Fraud or risk review",
  "Duplicate order",
  "Invalid or undeliverable address",
  "Customer requested via support",
  "Production or quality issue",
  "Pricing or listing error",
  "Other",
] as const;

export type AdminCancelReasonOption =
  (typeof ADMIN_CANCEL_REASON_OPTIONS)[number];

function composeReasonFromSelection(
  selected: string,
  otherDetail: string,
): string {
  const detail = otherDetail.trim();
  if (selected === "Other") {
    return detail;
  }
  if (selected && detail) {
    return `${selected} — ${detail}`;
  }
  return selected;
}

export function composeCancelReason(
  selected: CancelReasonOption,
  otherDetail: string,
): string {
  return composeReasonFromSelection(selected, otherDetail);
}

export function composeAdminCancelReason(
  selected: AdminCancelReasonOption,
  otherDetail: string,
): string {
  return composeReasonFromSelection(selected, otherDetail);
}

export function getCancelReasonByIndex(index: number): CancelReasonOption | undefined {
  if (!Number.isInteger(index) || index < 0 || index >= CANCEL_REASON_OPTIONS.length) {
    return undefined;
  }
  return CANCEL_REASON_OPTIONS[index];
}

export function validateCancelReason(reason: string): string | null {
  const trimmed = reason.trim();
  if (trimmed.length < 5) {
    return "Please tell us a bit more (at least 5 characters).";
  }
  if (trimmed.length > 500) {
    return "Reason is too long (max 500 characters).";
  }
  return null;
}

export function validateAdminCancelReason(reason: string): string | null {
  const trimmed = reason.trim();
  if (trimmed.length < 5) {
    return "Add a short note for the record (at least 5 characters).";
  }
  if (trimmed.length > 500) {
    return "Reason is too long (max 500 characters).";
  }
  return null;
}
