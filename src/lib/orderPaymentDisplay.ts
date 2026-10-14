import type { Order, PaymentStatus } from "@/types";

export type PaymentDisplay = {
  /** Badge / label key — may differ from raw paymentStatus for cancelled COD */
  status: PaymentStatus;
  label: string;
};

/**
 * Customer- and admin-facing payment line derived from order context.
 */
export function getPaymentDisplay(
  order: Pick<Order, "paymentStatus" | "paymentMethod" | "status">,
): PaymentDisplay {
  const raw = (order.paymentStatus || "pending") as PaymentStatus;

  if (
    order.status === "cancelled" &&
    order.paymentMethod === "cod" &&
    (raw === "failed" || raw === "pending")
  ) {
    return { status: "failed", label: "COD not collected" };
  }

  if (order.status === "cancelled" && raw === "pending" && order.paymentMethod === "razorpay") {
    return { status: "failed", label: "Payment not completed" };
  }

  if (order.status === "cancelled" && raw === "paid") {
    return { status: "paid", label: "Paid — refund may be pending" };
  }

  switch (raw) {
    case "paid":
      return { status: "paid", label: "Paid" };
    case "failed":
      return {
        status: "failed",
        label:
          order.paymentMethod === "cod" ? "COD not collected" : "Payment failed",
      };
    case "refunded":
      return { status: "refunded", label: "Refunded" };
    default:
      return {
        status: "pending",
        label:
          order.paymentMethod === "cod" ? "Pay on delivery" : "Payment pending",
      };
  }
}
