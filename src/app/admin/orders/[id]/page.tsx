"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Ban,
  Building2,
  CalendarClock,
  ChevronRight,
  Copy,
  Gift,
  IndianRupee,
  ListChecks,
  MoreHorizontal,
  Package,
  Receipt,
  Store,
  Trash2,
  Truck,
  Undo2,
  User as UserIcon,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/api";
import type { Order, OrderStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { cn, formatDateTime, formatPrice } from "@/lib/utils";
import { getOrderCancellationInfo } from "@/lib/orderLifecycle";
import { getMaxRefundableInr } from "@/lib/orderRefundPolicy";
import { AdminAiExplainButton } from "@/components/admin/ai";
import OrderReviewInvitePanel from "@/components/admin/OrderReviewInvitePanel";
import OrderMarketingAttributionCard from "@/components/admin/orders/OrderMarketingAttributionCard";
import AdminOrderLifecycleTimeline from "@/components/admin/orders/AdminOrderLifecycleTimeline";
import AdminCancelOrderModal from "@/components/admin/orders/AdminCancelOrderModal";
import AdminOrderCustomerCommsPanel from "@/components/admin/orders/AdminOrderCustomerCommsPanel";
import AdminGuestCheckoutPanel, {
  type AdminGuestCheckoutMeta,
} from "@/components/admin/orders/AdminGuestCheckoutPanel";
import AdminDelhiveryAutomationCard from "@/components/admin/orders/AdminDelhiveryAutomationCard";
import AdminOrderItemsCard from "@/components/admin/orders/AdminOrderItemsCard";
import AdminOrderCustomerCard, {
  CustomerSegmentBadge,
  getOrderUser,
  getOrderUserId,
} from "@/components/admin/orders/AdminOrderCustomerCard";
import AdminOrderPaymentCard from "@/components/admin/orders/AdminOrderPaymentCard";
import AdminOrderTrackingCard from "@/components/admin/orders/AdminOrderTrackingCard";
import AdminOrderDocumentsCard, {
  getLinkedTaxInvoiceId,
} from "@/components/admin/orders/AdminOrderDocumentsCard";
import AdminOrderReturnCard from "@/components/admin/orders/AdminOrderReturnCard";
import AdminOrderInitiateReturnCard from "@/components/admin/orders/AdminOrderInitiateReturnCard";
import { getPaymentDisplay } from "@/lib/orderPaymentDisplay";
import AdminOrderActivityLog from "@/components/admin/orders/AdminOrderActivityLog";
import AdminOrderCustomGiftCard from "@/components/admin/orders/AdminOrderCustomGiftCard";
import AdminOrderTrackingModal from "@/components/admin/orders/AdminOrderTrackingModal";
import AdminOrderRefundModal from "@/components/admin/orders/AdminOrderRefundModal";
import AdminOrderMenu, {
  type AdminOrderMenuItem,
} from "@/components/admin/orders/AdminOrderMenu";
import {
  NEXT_STATUS_MAP,
  ORDER_STATUSES,
  ORDER_STATUS_META,
  OrderStatusBadge,
  PaymentStatusBadge,
  orderStatusMeta,
  paymentMethodLabel,
  primaryNextStatus,
} from "@/components/admin/orders/AdminOrderStatusBadge";
import AdminOrderDetailLoading from "./loading";

/* ── helpers ─────────────────────────────────────────────────────────── */

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} day${d === 1 ? "" : "s"} ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} month${mo === 1 ? "" : "s"} ago`;
  const y = Math.floor(mo / 12);
  return `${y} year${y === 1 ? "" : "s"} ago`;
}

function channelBadge(
  order: Order,
): { label: string; icon: typeof Store; cls: string } | null {
  if (order.productType === "custom")
    return {
      label: "Bespoke gift",
      icon: Gift,
      cls: "bg-brand-50 text-brand-800 ring-brand-200",
    };
  if (order.offlineMeta?.source === "b2b")
    return {
      label: "B2B",
      icon: Building2,
      cls: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    };
  if (order.offlineMeta?.source === "stall")
    return {
      label: "Stall / POS",
      icon: Store,
      cls: "bg-slate-100 text-slate-800 ring-slate-200",
    };
  if (order.offlineMeta?.source === "personal_contact")
    return {
      label: "Personal contact",
      icon: UserIcon,
      cls: "bg-slate-100 text-slate-800 ring-slate-200",
    };
  return null;
}

const SECTION_LINKS: { id: string; label: string }[] = [
  { id: "items", label: "Items" },
  { id: "fulfillment", label: "Fulfilment" },
  { id: "lifecycle", label: "Lifecycle" },
  { id: "activity", label: "Activity" },
  { id: "customer", label: "Customer" },
  { id: "payment", label: "Payment" },
  { id: "comms", label: "Comms" },
];

/* ── page ────────────────────────────────────────────────────────────── */

export default function AdminOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const highlightNewB2b = searchParams.get("newB2b") === "1";

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [customerSegment, setCustomerSegment] = useState<string | null>(null);
  const [guestCheckout, setGuestCheckout] =
    useState<AdminGuestCheckoutMeta | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);

  const loadOrder = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setIsLoading(true);
      try {
        const res = await adminApi.getOrderDetails(id);
        setOrder(res.data.order);
        const gc = (res.data as { guestCheckout?: AdminGuestCheckoutMeta })
          .guestCheckout;
        setGuestCheckout(gc ?? null);
      } catch (err: unknown) {
        toast.error(
          (err as { message?: string })?.message || "Failed to load order",
        );
      } finally {
        if (!opts?.silent) setIsLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  const userId = order ? getOrderUserId(order) : null;
  useEffect(() => {
    if (!userId) {
      setCustomerSegment(null);
      return;
    }
    let cancelled = false;
    adminApi
      .getUserInsights(userId)
      .then((res) => {
        if (!cancelled) setCustomerSegment(res.data.metrics.userSegment);
      })
      .catch(() => {
        if (!cancelled) setCustomerSegment(null);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const refreshSilent = useCallback(async () => {
    await loadOrder({ silent: true });
  }, [loadOrder]);

  /* ── derived ───────────────────────────────────────────────────── */

  const derived = useMemo(() => {
    if (!order) return null;
    const needsPaidOrderRefund =
      order.paymentStatus === "paid" &&
      order.status === "cancelled" &&
      !(order.refundData?.amount && order.refundData.amount > 0);
    const needsRazorpayRefund =
      needsPaidOrderRefund && order.paymentMethod === "razorpay";
    const needsCodCancelRefund =
      needsPaidOrderRefund && order.paymentMethod === "cod";
    const cancellationInfo =
      order.status === "cancelled" ?
        getOrderCancellationInfo(order)
      : undefined;
    const isB2b = order.offlineMeta?.source === "b2b";
    const taxId = getLinkedTaxInvoiceId(order);
    const items = order.items ?? [];
    const qty = items.reduce((s, it) => s + (it.quantity || 0), 0);
    const user = getOrderUser(order);
    const next = primaryNextStatus(order.status);
    const returnReceivedAwaitingRefund =
      order.returnStatus === "received" && order.status !== "refunded";
    return {
      needsRazorpayRefund,
      needsCodCancelRefund,
      cancellationInfo,
      isB2b,
      taxId,
      lineCount: items.length,
      qty,
      user,
      next,
      returnReceivedAwaitingRefund,
      maxRefundable: getMaxRefundableInr(order),
      channel: channelBadge(order),
    };
  }, [order]);

  /* ── actions ───────────────────────────────────────────────────── */

  const applyStatus = async (status: OrderStatus) => {
    if (!order) return;
    if (status === order.status) return;
    if (status === "shipped") {
      setTrackingModalOpen(true);
      return;
    }
    if (status === "cancelled") {
      setCancelModalOpen(true);
      return;
    }
    const natural = NEXT_STATUS_MAP[order.status]?.includes(status);
    if (!natural) {
      const ok = window.confirm(
        `Move this order from "${orderStatusMeta(order.status).label}" to "${ORDER_STATUS_META[status].label}"?\n\nThis is not a normal forward step. The customer may receive a status email.`,
      );
      if (!ok) return;
    }
    setUpdating(true);
    try {
      await adminApi.updateOrderStatus(order._id, { status });
      toast.success(`Status updated to ${ORDER_STATUS_META[status].label}`);
      const res = await adminApi.getOrderDetails(order._id);
      setOrder(res.data.order);
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message || "Failed to update status",
      );
    } finally {
      setUpdating(false);
    }
  };

  const confirmCancel = async (reason: string) => {
    if (!order) return;
    setUpdating(true);
    try {
      await adminApi.updateOrderStatus(order._id, {
        status: "cancelled",
        note: reason,
      });
      toast.success("Order cancelled");
      setCancelModalOpen(false);
      const res = await adminApi.getOrderDetails(order._id);
      setOrder(res.data.order);
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message || "Failed to cancel order",
      );
    } finally {
      setUpdating(false);
    }
  };

  const deleteOrder = async () => {
    if (!order) return;
    const typed = window.prompt(
      `Permanently delete order ${order.orderNumber}? This cannot be undone.\n\nType DELETE to confirm.`,
    );
    if (typed !== "DELETE") {
      if (typed !== null)
        toast.error("Deletion cancelled - confirmation text did not match.");
      return;
    }
    setDeleting(true);
    try {
      await adminApi.deleteOrder(order._id);
      toast.success("Order deleted");
      router.push("/admin/orders");
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message || "Failed to delete order",
      );
      setDeleting(false);
    }
  };

  const copyOrderNumber = async () => {
    if (!order) return;
    try {
      await navigator.clipboard.writeText(order.orderNumber);
      toast.success("Order number copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  /* ── loading / not found ───────────────────────────────────────── */

  if (isLoading) return <AdminOrderDetailLoading />;

  if (!order || !derived) {
    return (
      <div className='p-6 xl:p-8'>
        <div className='bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center max-w-md mx-auto'>
          <div className='h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3'>
            <Package className='h-6 w-6 text-gray-400' />
          </div>
          <p className='text-gray-900 font-semibold'>Order not found</p>
          <p className='text-sm text-gray-500 mt-1'>
            It may have been deleted or the link is wrong.
          </p>
          <Button asChild variant='brand' className='mt-5 rounded-xl'>
            <Link href='/admin/orders'>Back to orders</Link>
          </Button>
        </div>
      </div>
    );
  }

  const {
    needsRazorpayRefund,
    needsCodCancelRefund,
    cancellationInfo,
    isB2b,
    taxId,
    lineCount,
    qty,
    user,
    next,
    returnReceivedAwaitingRefund,
    maxRefundable,
    channel,
  } = derived;

  const statusMenu: AdminOrderMenuItem[] = [
    { type: "heading", key: "h", label: "Set status" },
    ...ORDER_STATUSES.map<AdminOrderMenuItem>((s) => {
      const m = ORDER_STATUS_META[s];
      const natural = NEXT_STATUS_MAP[order.status]?.includes(s);
      return {
        key: s,
        label: m.label,
        icon: m.icon,
        active: s === order.status,
        disabled: s === order.status || s === "refunded",
        danger: s === "cancelled",
        hint:
          s === order.status ? undefined
          : s === "refunded" ? "Use Process refund — status alone is blocked"
          : s === "shipped" ? "Opens tracking form"
          : s === "cancelled" ? "Asks for a reason"
          : natural ? undefined
          : "Unusual - asks to confirm",
        onSelect: () => void applyStatus(s),
      };
    }),
  ];

  const moreMenu: AdminOrderMenuItem[] = [
    {
      key: "copy",
      label: "Copy order number",
      icon: Copy,
      onSelect: () => void copyOrderNumber(),
    },
    {
      key: "list",
      label: "All orders",
      icon: ListChecks,
      href: "/admin/orders",
    },
    ...(userId ?
      [
        {
          key: "profile",
          label: "Customer profile",
          icon: UserIcon,
          href: `/admin/users?highlight=${encodeURIComponent(userId)}`,
        } as AdminOrderMenuItem,
      ]
    : []),
    { type: "separator", key: "sep1" },
    ...(order.status !== "cancelled" && order.status !== "refunded" ?
      [
        {
          key: "cancel",
          label: "Cancel order",
          icon: Ban,
          danger: true,
          onSelect: () => setCancelModalOpen(true),
        } as AdminOrderMenuItem,
      ]
    : []),
    {
      key: "delete",
      label: "Delete order",
      hint: "Permanent - requires typing DELETE",
      icon: Trash2,
      danger: true,
      disabled: deleting,
      onSelect: () => void deleteOrder(),
    },
  ];

  const ChannelIcon = channel?.icon;

  return (
    <div className='min-h-full bg-[#f6f6f8] pb-16'>
      {/* ── Command bar ───────────────────────────────────────────── */}
      <div className='sticky top-0 z-30 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75 border-b border-gray-200'>
        <div className='max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='py-3 flex flex-wrap items-center gap-x-4 gap-y-3'>
            <Link
              href='/admin/orders'
              className='inline-flex items-center gap-1.5 h-9 px-2.5 -ml-2.5 rounded-lg text-sm font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors'
            >
              <ArrowLeft className='h-4 w-4' />
              <span className='hidden sm:inline'>Orders</span>
            </Link>
            <ChevronRight className='h-4 w-4 text-gray-300 hidden sm:block -ml-3' />

            <div className='min-w-0 flex-1'>
              <div className='flex flex-wrap items-center gap-2'>
                <h1 className='font-serif text-xl sm:text-2xl font-bold text-gray-900 tracking-tight leading-none'>
                  {order.orderNumber}
                </h1>
                <OrderStatusBadge status={order.status} />
                <PaymentStatusBadge
                  status={order.paymentStatus}
                  order={order}
                  size='sm'
                />
                {channel && ChannelIcon ?
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full ring-1 ring-inset px-2 py-0.5 text-[11px] font-semibold",
                      channel.cls,
                    )}
                  >
                    <ChannelIcon className='h-3 w-3' /> {channel.label}
                  </span>
                : null}
              </div>
              <p className='text-xs text-gray-500 mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5'>
                <span>Placed {formatDateTime(order.createdAt)}</span>
                <span className='text-gray-300'>·</span>
                <span>{timeAgo(order.createdAt)}</span>
                <span className='text-gray-300'>·</span>
                <span>
                  {lineCount} line{lineCount === 1 ? "" : "s"}, {qty} pc
                  {qty === 1 ? "" : "s"}
                </span>
                <span className='text-gray-300'>·</span>
                <span className='font-semibold text-gray-700 tabular-nums'>
                  {formatPrice(order.total)}
                </span>
              </p>
            </div>

            <div className='flex flex-wrap items-center gap-2 ml-auto'>
              <AdminAiExplainButton
                kind='order'
                orderId={order._id}
                label='AI explain'
              />
              <OrderReviewInvitePanel
                orderId={order._id}
                className='h-9 py-0'
              />
              <AdminOrderMenu
                trigger={<MoreHorizontal className='h-4 w-4' />}
                chevron={false}
                items={moreMenu}
                triggerClassName='w-9 px-0 justify-center'
                width='w-64'
              />
              <AdminOrderMenu
                trigger={
                  <>
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        orderStatusMeta(order.status).dot,
                      )}
                    />
                    Status
                  </>
                }
                items={statusMenu}
                disabled={updating}
                width='w-64'
              />
              {next ?
                <Button
                  type='button'
                  variant='brand'
                  className='rounded-xl h-9 gap-1.5 shadow-sm'
                  loading={updating}
                  onClick={() => void applyStatus(next.status)}
                >
                  {next.label} <ArrowRight className='h-4 w-4' />
                </Button>
              : null}
            </div>
          </div>

          {/* section jump links */}
          <nav
            aria-label='Sections'
            className='hidden lg:flex items-center gap-1 -mb-px overflow-x-auto'
          >
            {SECTION_LINKS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className='px-2.5 py-2 text-xs font-semibold text-gray-500 hover:text-gray-900 border-b-2 border-transparent hover:border-brand-400 transition-colors whitespace-nowrap'
              >
                {s.label}
              </a>
            ))}
          </nav>
        </div>
      </div>

      <div className='max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6'>
        {/* ── Alerts ──────────────────────────────────────────────── */}
        {order.paymentStatus === "failed" && order.status !== "cancelled" ?
          <Alert tone='red' icon={XCircle} title='Payment failed'>
            The customer’s payment did not go through. Do not ship until payment
            is confirmed or the order is re-placed.
          </Alert>
        : null}

        {order.status === "cancelled" &&
        order.paymentMethod === "cod" &&
        (order.paymentStatus === "failed" || order.paymentStatus === "pending") ?
          <Alert tone='slate' icon={Ban} title='COD cancelled — no collection'>
            Cash was not collected for this order. No refund step is needed.
            Payment shows as: {getPaymentDisplay(order).label}.
          </Alert>
        : null}

        {cancellationInfo?.reason || cancellationInfo?.initiatedBy ?
          <Alert
            tone={cancellationInfo.initiatedBy === "admin" ? "slate" : "amber"}
            icon={Ban}
            title={
              cancellationInfo.initiatedBy === "admin" ?
                "Cancelled by admin team"
              : cancellationInfo.initiatedBy === "customer" ?
                "Cancelled by customer"
              : "Order cancelled"
            }
          >
            {cancellationInfo.reason ?
              <span className='whitespace-pre-wrap'>
                {cancellationInfo.reason}
              </span>
            : "No reason recorded."}
          </Alert>
        : null}

        {needsRazorpayRefund ?
          <Alert
            tone='red'
            icon={IndianRupee}
            title='Refund required - paid online order was cancelled'
            action={
              <Button
                type='button'
                className='rounded-xl bg-red-600 hover:bg-red-700 text-white shrink-0 gap-1.5'
                onClick={() => setRefundModalOpen(true)}
              >
                <Undo2 className='h-4 w-4' /> Refund{" "}
                {formatPrice(maxRefundable)}
              </Button>
            }
          >
            Customer paid via Razorpay. Process the refund back to the original
            payment method in one step.
          </Alert>
        : null}

        {needsCodCancelRefund ?
          <Alert
            tone='red'
            icon={IndianRupee}
            title='Refund required - COD was collected then order cancelled'
            action={
              <Button
                type='button'
                className='rounded-xl bg-red-600 hover:bg-red-700 text-white shrink-0 gap-1.5'
                onClick={() => setRefundModalOpen(true)}
              >
                <Undo2 className='h-4 w-4' /> Refund{" "}
                {formatPrice(maxRefundable)}
              </Button>
            }
          >
            Courier COD was marked paid. Send refund manually (UPI / bank / cash).
          </Alert>
        : null}

        {order.returnStatus === "requested" ?
          <Alert
            tone='amber'
            icon={Undo2}
            title='Return requested - needs a decision'
            action={
              <a
                href='#return'
                className='inline-flex items-center gap-1 text-sm font-semibold text-amber-900 hover:underline shrink-0'
              >
                Review <ArrowRight className='h-4 w-4' />
              </a>
            }
          >
            {order.returnRequest?.reason ||
              "Customer asked to return this order."}
          </Alert>
        : null}

        {order.returnStatus === "approved" || order.returnStatus === "picked_up" ?
          <Alert
            tone='amber'
            icon={Undo2}
            title={
              order.returnStatus === "approved" ?
                "Return approved - arrange pickup"
              : "Return picked up - mark received when it arrives"
            }
            action={
              <a
                href='#return'
                className='inline-flex items-center gap-1 text-sm font-semibold text-amber-900 hover:underline shrink-0'
              >
                Next step <ArrowRight className='h-4 w-4' />
              </a>
            }
          >
            Refund unlocks only after the item is received and inspected at the
            warehouse.
          </Alert>
        : null}

        {returnReceivedAwaitingRefund ?
          <Alert
            tone='emerald'
            icon={Undo2}
            title='Return received - refund pending'
            action={
              <Button
                type='button'
                className='rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shrink-0 gap-1.5'
                onClick={() => setRefundModalOpen(true)}
              >
                Process refund
              </Button>
            }
          >
            Eligible amount {formatPrice(maxRefundable)} (shipping / COD fees
            retained).
          </Alert>
        : null}

        {order.delhivery?.rtoDetected && order.status !== "delivered" ?
          <Alert
            tone='red'
            icon={AlertTriangle}
            title='RTO detected by Delhivery'
          >
            The parcel is returning to origin. Check the courier status and
            contact the customer before re-dispatch.
          </Alert>
        : null}

        {highlightNewB2b && isB2b && !taxId ?
          <Alert
            tone='emerald'
            icon={Receipt}
            title='B2B order saved'
            action={
              <a
                href='#documents'
                className='inline-flex items-center gap-1 text-sm font-semibold text-emerald-900 hover:underline shrink-0'
              >
                Create GST invoice <ArrowRight className='h-4 w-4' />
              </a>
            }
          >
            The GST tax invoice uses its own <b>INV-</b> number, separate from
            order <b>{order.orderNumber}</b>.
          </Alert>
        : null}

        {/* ── Summary strip ───────────────────────────────────────── */}
        <div className='grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3'>
          <Stat
            icon={IndianRupee}
            label='Order value'
            value={formatPrice(order.total)}
            sub={paymentMethodLabel(order.paymentMethod)}
            emphasis
          />
          <Stat
            icon={Package}
            label='Items'
            value={`${qty} pc${qty === 1 ? "" : "s"}`}
            sub={`${lineCount} line${lineCount === 1 ? "" : "s"}${order.discount > 0 ? ` · −${formatPrice(order.discount)} off` : ""}`}
          />
          <Stat
            icon={Truck}
            label='Fulfilment'
            value={
              order.offlineMeta?.fulfillment === "offline_handover" ?
                "Offline handover"
              : order.trackingNumber ?
                order.shippingCarrier || "Courier"
              : "Not shipped"
            }
            sub={
              order.trackingNumber ?
                <span className='font-mono'>{order.trackingNumber}</span>
              : order.delhivery?.shipmentCreatedAt ?
                "Delhivery manifest created"
              : orderStatusMeta(order.status).label
            }
          />
          <Stat
            icon={UserIcon}
            label='Customer'
            value={user?.name || order.shippingAddress?.name || "-"}
            sub={
              <span className='inline-flex items-center gap-1.5 min-w-0'>
                <CustomerSegmentBadge segment={customerSegment} />
                <span className='truncate'>
                  {user?.email || user?.phone || ""}
                </span>
              </span>
            }
          />
          <Stat
            icon={CalendarClock}
            label='Timing'
            value={
              order.deliveredAt ? `Delivered ${timeAgo(order.deliveredAt)}`
              : order.shippedAt ?
                `Shipped ${timeAgo(order.shippedAt)}`
              : `Placed ${timeAgo(order.createdAt)}`
            }
            sub={
              (
                typeof order.delhivery?.estimatedTatDays === "number" &&
                !order.deliveredAt
              ) ?
                `ETA ~${order.delhivery.estimatedTatDays} days`
              : formatDateTime(
                  order.deliveredAt || order.shippedAt || order.createdAt,
                )
            }
          />
        </div>

        {/* ── Workspace grid ──────────────────────────────────────── */}
        <div className='grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] gap-6 items-start'>
          {/* Main column */}
          <div className='space-y-6 min-w-0'>
            <AdminOrderInitiateReturnCard order={order} onUpdated={setOrder} />

            <AdminOrderReturnCard
              order={order}
              onUpdated={setOrder}
              onProcessRefund={() => setRefundModalOpen(true)}
            />

            <AdminOrderItemsCard
              order={order}
              onZoom={setZoomedImage}
              onLineCostSaved={(idx, saved) =>
                setOrder((prev) => {
                  if (!prev) return prev;
                  const items = [...(prev.items ?? [])];
                  const line = items[idx];
                  if (!line) return prev;
                  items[idx] = { ...line, costAtSale: saved };
                  return { ...prev, items };
                })
              }
            />

            <AdminOrderCustomGiftCard order={order} />

            {order.offlineMeta?.fulfillment !== "offline_handover" ?
              <AdminDelhiveryAutomationCard
                order={order}
                orderId={id}
                onRefresh={refreshSilent}
              />
            : null}

            <AdminOrderLifecycleTimeline order={order} />

            <AdminOrderActivityLog order={order} />
          </div>

          {/* Sidebar */}
          <aside className='space-y-6 min-w-0 lg:self-start'>
            <AdminOrderCustomerCard
              order={order}
              customerSegment={customerSegment}
            />

            {guestCheckout ?
              <AdminGuestCheckoutPanel
                meta={guestCheckout}
                onUpdated={refreshSilent}
              />
            : null}

            <AdminOrderPaymentCard
              order={order}
              refundCtaVisible={
                needsRazorpayRefund ||
                needsCodCancelRefund ||
                returnReceivedAwaitingRefund
              }
              onProcessRefund={() => setRefundModalOpen(true)}
            />

            <AdminOrderTrackingCard
              order={order}
              onEdit={() => setTrackingModalOpen(true)}
            />

            <AdminOrderDocumentsCard order={order} onOrderUpdated={setOrder} />

            <AdminOrderCustomerCommsPanel
              order={order}
              customerSegment={customerSegment}
              onRefresh={refreshSilent}
            />

            <OrderMarketingAttributionCard
              attribution={order.marketingAttribution}
            />
          </aside>
        </div>
      </div>

      {/* ── Overlays ────────────────────────────────────────────────── */}
      {zoomedImage ?
        <div
          className='fixed inset-0 z-[80] flex items-center justify-center bg-navy-900/90 backdrop-blur-sm p-4'
          onClick={() => setZoomedImage(null)}
        >
          <div className='relative max-w-4xl max-h-[90vh] w-full h-full'>
            <button
              type='button'
              onClick={() => setZoomedImage(null)}
              className='absolute -top-2 -right-2 md:-top-4 md:-right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 backdrop-blur-md transition-colors z-10'
              aria-label='Close'
            >
              <XCircle className='h-6 w-6' />
            </button>
            <Image
              src={zoomedImage}
              alt='Zoomed product'
              fill
              className='object-contain'
            />
          </div>
        </div>
      : null}

      {cancelModalOpen ?
        <AdminCancelOrderModal
          order={order}
          open={cancelModalOpen}
          isSubmitting={updating}
          onClose={() => {
            if (!updating) setCancelModalOpen(false);
          }}
          onConfirm={(reason) => void confirmCancel(reason)}
        />
      : null}

      <AdminOrderTrackingModal
        order={order}
        open={trackingModalOpen}
        onClose={() => setTrackingModalOpen(false)}
        onSaved={setOrder}
      />

      <AdminOrderRefundModal
        order={order}
        open={refundModalOpen}
        onClose={() => setRefundModalOpen(false)}
        onRefunded={setOrder}
      />
    </div>
  );
}

/* ── local presentational pieces ─────────────────────────────────────── */

function Stat({
  icon: Icon,
  label,
  value,
  sub,
  emphasis,
}: {
  icon: typeof Package;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3.5 min-w-0 flex items-start gap-3",
        emphasis ?
          "border-navy-800 bg-gradient-to-br from-navy-900 to-navy-800 text-white shadow-[0_12px_30px_-16px_rgba(20,25,47,0.6)]"
        : "border-gray-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
      )}
    >
      <span
        className={cn(
          "h-9 w-9 rounded-xl flex items-center justify-center shrink-0",
          emphasis ? "bg-white/10 text-brand-200" : "bg-gray-100 text-gray-600",
        )}
      >
        <Icon className='h-4 w-4' />
      </span>
      <div className='min-w-0 flex-1'>
        <p
          className={cn(
            "text-[10px] font-bold uppercase tracking-[0.14em]",
            emphasis ? "text-brand-200/90" : "text-gray-400",
          )}
        >
          {label}
        </p>
        <p
          className={cn(
            "text-base font-bold leading-tight mt-0.5 truncate tabular-nums",
            emphasis ? "text-white" : "text-gray-900",
          )}
        >
          {value}
        </p>
        {sub ?
          <p
            className={cn(
              "text-[11px] mt-0.5 truncate",
              emphasis ? "text-white/70" : "text-gray-500",
            )}
          >
            {sub}
          </p>
        : null}
      </div>
    </div>
  );
}

const ALERT_TONE = {
  red: {
    wrap: "border-red-200 bg-gradient-to-r from-red-50 via-white to-white",
    icon: "bg-red-100 text-red-700",
    title: "text-red-950",
    body: "text-red-900/90",
  },
  amber: {
    wrap: "border-amber-200 bg-gradient-to-r from-amber-50 via-white to-white",
    icon: "bg-amber-100 text-amber-800",
    title: "text-amber-950",
    body: "text-amber-900/90",
  },
  emerald: {
    wrap: "border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-white",
    icon: "bg-emerald-100 text-emerald-800",
    title: "text-emerald-950",
    body: "text-emerald-900/90",
  },
  slate: {
    wrap: "border-slate-200 bg-gradient-to-r from-slate-50 via-white to-white",
    icon: "bg-slate-200 text-slate-700",
    title: "text-slate-900",
    body: "text-slate-700",
  },
} as const;

function Alert({
  tone,
  icon: Icon,
  title,
  children,
  action,
}: {
  tone: keyof typeof ALERT_TONE;
  icon: typeof Package;
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  const t = ALERT_TONE[tone];
  return (
    <div
      role='status'
      className={cn(
        "rounded-2xl border p-4 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4",
        t.wrap,
      )}
    >
      <span
        className={cn(
          "h-9 w-9 rounded-xl flex items-center justify-center shrink-0",
          t.icon,
        )}
      >
        <Icon className='h-[18px] w-[18px]' />
      </span>
      <div className='min-w-0 flex-1'>
        <p className={cn("text-sm font-bold", t.title)}>{title}</p>
        <p className={cn("text-sm mt-0.5 leading-snug", t.body)}>{children}</p>
      </div>
      {action}
    </div>
  );
}
