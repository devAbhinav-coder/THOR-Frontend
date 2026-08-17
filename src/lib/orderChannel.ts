import type { Order } from "@/types";

export type AdminOrderChannel = "online" | "offline" | "b2b";

/** Filter for admin orders/revenue lists — all channels or one. */
export type OrderChannelFilter = "all" | AdminOrderChannel;

export function orderSalesChannel(order: Pick<Order, "offlineMeta">): AdminOrderChannel {
  if (!order.offlineMeta) return "online";
  if (order.offlineMeta.source === "b2b") return "b2b";
  return "offline";
}

export function orderChannelBadge(order: Pick<Order, "offlineMeta">): {
  label: string;
  className: string;
} | null {
  const channel = orderSalesChannel(order);
  if (channel === "online") return null;
  if (channel === "b2b") {
    return {
      label: "B2B",
      className: "bg-violet-100 text-violet-900 border-violet-200",
    };
  }
  return {
    label: "Offline",
    className: "bg-amber-50 text-amber-900 border-amber-200",
  };
}
