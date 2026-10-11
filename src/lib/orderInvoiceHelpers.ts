import type { Order } from "@/types";

type InvoiceOrderFields = Pick<Order, "status" | "paymentStatus" | "invoice">;

/** Storefront: when customer may view or download a tax invoice. */
export function isOrderInvoiceAvailable(order: InvoiceOrderFields): boolean {
  if (order.status === "cancelled" || order.status === "refunded") {
    return false;
  }
  return (
    !!order.invoice?.isGenerated &&
    (order.paymentStatus === "paid" || order.status === "delivered")
  );
}
