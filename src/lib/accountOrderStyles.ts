/** Luxury account-area order status labels and badge classes (House of Ani design). */

export const ACTIVE_ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
] as const;

export const CANCELLABLE_ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
] as const;

export function getOrderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Pending",
    confirmed: "Confirmed",
    processing: "Processing",
    shipped: "In Transit",
    delivered: "Delivered",
    cancelled: "Cancelled",
    refunded: "Refunded",
  };
  return labels[status] ?? status;
}

export function getOrderStatusBadgeClass(status: string): string {
  switch (status) {
    case "shipped":
      return "bg-account-secondary-container text-account-on-secondary-container";
    case "delivered":
      return "bg-account-outline-variant/50 text-account-primary backdrop-blur-sm";
    case "processing":
    case "pending":
    case "confirmed":
      return "bg-account-primary text-white";
    case "cancelled":
    case "refunded":
      return "bg-red-100 text-red-800";
    default:
      return "bg-account-surface-container text-account-on-surface-variant";
  }
}

export function getPrimaryProductName(
  items: { name: string }[],
): string {
  if (!items.length) return "Order";
  if (items.length === 1) return items[0].name;
  return `${items[0].name} +${items.length - 1} more`;
}

export function getProductShopHref(
  product: string | { slug?: string; _id?: string },
): string {
  if (typeof product === "object" && product?.slug) {
    return `/shop/${product.slug}`;
  }
  return "/shop";
}
