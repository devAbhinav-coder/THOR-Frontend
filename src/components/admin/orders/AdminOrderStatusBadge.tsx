"use client";

import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Package,
  PackageCheck,
  RefreshCw,
  Truck,
  Undo2,
  Wallet,
  XCircle,
} from "lucide-react";
import type { Order, OrderStatus, PaymentStatus } from "@/types";
import { cn } from "@/lib/utils";

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

/** Natural forward transitions (same as orders list). Admin can still override via menu. */
export const NEXT_STATUS_MAP: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled", "refunded"],
  delivered: ["refunded"],
  cancelled: ["refunded"],
  refunded: [],
};

export type StatusMeta = {
  label: string;
  icon: LucideIcon;
  /** solid pill */
  pill: string;
  /** dot colour */
  dot: string;
  /** soft tile background */
  soft: string;
};

export const ORDER_STATUS_META: Record<OrderStatus, StatusMeta> = {
  pending: {
    label: "Pending",
    icon: Clock,
    pill: "bg-amber-100 text-amber-900 ring-amber-200",
    dot: "bg-amber-500",
    soft: "bg-amber-50 text-amber-900",
  },
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle2,
    pill: "bg-sky-100 text-sky-900 ring-sky-200",
    dot: "bg-sky-500",
    soft: "bg-sky-50 text-sky-900",
  },
  processing: {
    label: "Processing",
    icon: Package,
    pill: "bg-violet-100 text-violet-900 ring-violet-200",
    dot: "bg-violet-500",
    soft: "bg-violet-50 text-violet-900",
  },
  shipped: {
    label: "Shipped",
    icon: Truck,
    pill: "bg-indigo-100 text-indigo-900 ring-indigo-200",
    dot: "bg-indigo-500",
    soft: "bg-indigo-50 text-indigo-900",
  },
  delivered: {
    label: "Delivered",
    icon: PackageCheck,
    pill: "bg-emerald-100 text-emerald-900 ring-emerald-200",
    dot: "bg-emerald-500",
    soft: "bg-emerald-50 text-emerald-900",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    pill: "bg-red-100 text-red-900 ring-red-200",
    dot: "bg-red-500",
    soft: "bg-red-50 text-red-900",
  },
  refunded: {
    label: "Refunded",
    icon: Undo2,
    pill: "bg-gray-200 text-gray-800 ring-gray-300",
    dot: "bg-gray-500",
    soft: "bg-gray-100 text-gray-800",
  },
};

export const PAYMENT_STATUS_META: Record<PaymentStatus, StatusMeta> = {
  pending: {
    label: "Payment pending",
    icon: Clock,
    pill: "bg-amber-100 text-amber-900 ring-amber-200",
    dot: "bg-amber-500",
    soft: "bg-amber-50 text-amber-900",
  },
  paid: {
    label: "Paid",
    icon: Wallet,
    pill: "bg-emerald-100 text-emerald-900 ring-emerald-200",
    dot: "bg-emerald-500",
    soft: "bg-emerald-50 text-emerald-900",
  },
  failed: {
    label: "Payment failed",
    icon: AlertCircle,
    pill: "bg-red-100 text-red-900 ring-red-200",
    dot: "bg-red-500",
    soft: "bg-red-50 text-red-900",
  },
  refunded: {
    label: "Refunded",
    icon: RefreshCw,
    pill: "bg-gray-200 text-gray-800 ring-gray-300",
    dot: "bg-gray-500",
    soft: "bg-gray-100 text-gray-800",
  },
};

export function orderStatusMeta(status: string): StatusMeta {
  return (
    ORDER_STATUS_META[status as OrderStatus] ?? {
      label: status.replace(/_/g, " "),
      icon: Clock,
      pill: "bg-gray-100 text-gray-800 ring-gray-200",
      dot: "bg-gray-400",
      soft: "bg-gray-50 text-gray-800",
    }
  );
}

export function paymentMethodLabel(pm: Order["paymentMethod"]): string {
  switch (pm) {
    case "razorpay":
      return "Razorpay";
    case "cod":
      return "Cash on delivery";
    case "offline_upi":
      return "Offline · UPI";
    case "offline_cash":
      return "Offline · cash";
    default:
      return String(pm);
  }
}

/** The single most useful forward action for this order status (excluding cancel). */
export function primaryNextStatus(status: OrderStatus): {
  status: OrderStatus;
  label: string;
} | null {
  switch (status) {
    case "pending":
      return { status: "confirmed", label: "Confirm order" };
    case "confirmed":
      return { status: "processing", label: "Start processing" };
    case "processing":
      return { status: "shipped", label: "Mark shipped" };
    case "shipped":
      return { status: "delivered", label: "Mark delivered" };
    default:
      return null;
  }
}

type BadgeSize = "sm" | "md" | "lg";

const SIZE: Record<BadgeSize, string> = {
  sm: "text-[11px] px-2 py-0.5 gap-1 [&>svg]:h-3 [&>svg]:w-3",
  md: "text-xs px-2.5 py-1 gap-1.5 [&>svg]:h-3.5 [&>svg]:w-3.5",
  lg: "text-sm px-3 py-1.5 gap-2 [&>svg]:h-4 [&>svg]:w-4",
};

export function OrderStatusBadge({
  status,
  size = "md",
  className,
}: {
  status: string;
  size?: BadgeSize;
  className?: string;
}) {
  const m = orderStatusMeta(status);
  const Icon = m.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold ring-1 ring-inset whitespace-nowrap",
        m.pill,
        SIZE[size],
        className,
      )}
    >
      <Icon aria-hidden />
      {m.label}
    </span>
  );
}

export function PaymentStatusBadge({
  status,
  size = "md",
  className,
}: {
  status: PaymentStatus;
  size?: BadgeSize;
  className?: string;
}) {
  const m = PAYMENT_STATUS_META[status] ?? PAYMENT_STATUS_META.pending;
  const Icon = m.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold ring-1 ring-inset whitespace-nowrap",
        m.pill,
        SIZE[size],
        className,
      )}
    >
      <Icon aria-hidden />
      {m.label}
    </span>
  );
}
