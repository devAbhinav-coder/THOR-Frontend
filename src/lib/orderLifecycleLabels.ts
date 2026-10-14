const LABELS: Record<string, string> = {
  pending: "Order placed",
  confirmed: "Order confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
  return_requested: "Return requested",
  return_approved: "Return approved",
  return_rejected: "Return rejected",
  return_picked_up: "Return picked up",
  return_received: "Return received",
};

export function formatLifecycleStatus(status: string): string {
  return (
    LABELS[status] ||
    status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}
