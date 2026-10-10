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

export function composeCancelReason(
  selected: CancelReasonOption,
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
