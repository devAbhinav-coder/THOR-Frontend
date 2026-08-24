/** Delivery estimate payload from GET /storefront/shipping/estimate */
export type DeliveryEstimate = {
  serviceable: boolean;
  pincode: string;
  city?: string;
  state?: string;
  zone?: string;
  zoneLabel?: string;
  tatDaysMin: number;
  tatDaysMax: number;
  estimatedDelivery: { from: string; to: string };
  promisedDate?: string;
  dispatchDaysMin: number;
  dispatchDaysMax: number;
  carrier: string;
  source?: "learned" | "carrier" | "zone";
  fallback: boolean;
  message?: string;
};

const DATE_FMT: Intl.DateTimeFormatOptions = {
  weekday: "short",
  day: "numeric",
  month: "short",
};

function parseIsoDate(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

/** e.g. "Wed, 28 Aug – Sat, 31 Aug" */
export function formatDeliveryDateRange(from: string, to: string): string {
  const fromStr = parseIsoDate(from).toLocaleDateString("en-IN", DATE_FMT);
  const toStr = parseIsoDate(to).toLocaleDateString("en-IN", DATE_FMT);
  if (from === to) return fromStr;
  return `${fromStr} – ${toStr}`;
}

/** Short chip label e.g. "by 31 Aug" */
export function formatEtaShort(to: string): string {
  return `by ${parseIsoDate(to).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  })}`;
}

/** Amazon-style promised date e.g. "Thu, 28 Aug" */
export function formatPromisedDate(iso: string): string {
  return parseIsoDate(iso).toLocaleDateString("en-IN", DATE_FMT);
}

export function formatTatDays(min: number, max: number): string {
  if (min <= 0 && max <= 0) return "";
  if (min === max) return `${min} business day${min === 1 ? "" : "s"}`;
  return `${min}–${max} business days`;
}
