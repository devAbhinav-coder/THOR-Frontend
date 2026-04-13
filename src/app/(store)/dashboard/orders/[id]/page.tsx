"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Package,
  MapPin,
  CreditCard,
  Clock,
  Star,
  CheckCircle2,
  Truck,
  AlertCircle,
  Check,
  Sparkles,
  Gift,
  ChevronDown,
  Plus,
  X,
} from "lucide-react";
import { orderApi, reviewApi } from "@/lib/api";
import { Order, OrderItem } from "@/types";
import {
  formatPrice,
  formatDateTime,
  getOrderStatusColor,
  getPaymentStatusColor,
  cn,
} from "@/lib/utils";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import {
  getReturnReasonByIndex,
  isOrderReturnEligible,
  RETURN_REASON_OPTIONS,
} from "@/lib/orderReturnHelpers";
import { getMaxRefundableInr } from "@/lib/orderRefundPolicy";

const STATUS_STEPS = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
];

const STATUS_META: Record<string, { icon: React.ReactNode; color: string }> = {
  pending: { icon: <Clock className='h-4 w-4' />, color: "text-yellow-600" },
  confirmed: {
    icon: <CheckCircle2 className='h-4 w-4' />,
    color: "text-blue-600",
  },
  processing: {
    icon: <Package className='h-4 w-4' />,
    color: "text-purple-600",
  },
  shipped: { icon: <Truck className='h-4 w-4' />, color: "text-indigo-600" },
  delivered: {
    icon: <CheckCircle2 className='h-4 w-4' />,
    color: "text-green-600",
  },
  cancelled: {
    icon: <AlertCircle className='h-4 w-4' />,
    color: "text-red-600",
  },
};

const EMOTIONAL_MESSAGES = [
  {
    heading: "How did it make you feel? ✨",
    sub: "Your honest words help thousands of shoppers find their perfect outfit.",
  },
  {
    heading: "Loved it? Tell the world 🌸",
    sub: "A quick review means the world to small brands like ours.",
  },
  {
    heading: "Your voice matters 🙏",
    sub: "Real experiences from real customers — that's what makes us better every day.",
  },
];

interface ReviewFormState {
  rating: number;
  title: string;
  comment: string;
}

const RATING_MESSAGES: Record<
  number,
  { emoji: string; msg: string; sub: string }
> = {
  1: {
    emoji: "😔",
    msg: "We're sorry to hear that",
    sub: "Your feedback helps us improve. We'll do better next time.",
  },
  2: {
    emoji: "🤔",
    msg: "Thanks for being honest",
    sub: "Your feedback means a lot. We're always working to improve.",
  },
  3: {
    emoji: "🙏",
    msg: "Thank you for your feedback!",
    sub: "We appreciate you taking the time to share your experience.",
  },
  4: {
    emoji: "😊",
    msg: "Glad you liked it!",
    sub: "Your kind words make all the hard work worthwhile. Thank you!",
  },
  5: {
    emoji: "🌟",
    msg: "You loved it!",
    sub: "This means the world to us. Your review helps other shoppers find their perfect outfit. ✨",
  },
};

const REVIEW_TITLE_OPTIONS = [
  { value: "Not satisfied", label: "😕 Not satisfied" },
  { value: "Could be better", label: "🙂 Could be better" },
  { value: "Good overall", label: "👍 Good overall" },
  { value: "Very good", label: "✨ Very good" },
  { value: "Loved it", label: "😍 Loved it" },
  { value: "Excellent purchase", label: "🌟 Excellent purchase" },
] as const;
const isPresetReviewTitle = (title: string) =>
  REVIEW_TITLE_OPTIONS.some((o) => o.value === title);

function titleForRating(rating: number): string {
  if (rating <= 2) return "Not satisfied";
  if (rating === 3) return "Good overall";
  if (rating === 4) return "Very good";
  return "Loved it";
}

function getAutoTrackingUrl(carrier?: string, trackingNumber?: string) {
  const awb = trackingNumber?.trim();
  if (!awb) return null;
  const c = (carrier || "").toLowerCase().trim();

  if (c.includes("delhivery"))
    return `https://www.delhivery.com/track/package/${encodeURIComponent(awb)}`;
  if (c.includes("bluedart") || c.includes("blue dart"))
    return `https://www.bluedart.com/tracking?wbnum=${encodeURIComponent(awb)}`;
  if (c.includes("fedex") || c.includes("fed ex"))
    return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(awb)}`;
  if (c.includes("dhl"))
    return `https://www.dhl.com/global-en/home/tracking/tracking-express.html?submit=1&tracking-id=${encodeURIComponent(awb)}`;
  if (c.includes("ecom") || c.includes("ecom express"))
    return `https://www.ecomexpress.in/tracking/?awb_field=${encodeURIComponent(awb)}`;
  if (
    c.includes("india post") ||
    c.includes("indiapost") ||
    c.includes("speed post")
  )
    return `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx?trackingid=${encodeURIComponent(awb)}`;

  // Fallback: Google search with carrier + AWB
  return `https://www.google.com/search?q=${encodeURIComponent(`${carrier || "courier"} tracking ${awb}`)}`;
}

// Custom gift details accordion
function CustomGiftDetails({
  order,
}: {
  order: Order & { productType?: string; customRequestId?: string };
}) {
  const [open, setOpen] = useState(true);
  if (order.productType !== "custom") return null;

  return (
    <div className='bg-gradient-to-br from-gold-50 to-amber-50/30 rounded-2xl border border-gold-200 overflow-hidden shadow-sm'>
      <button
        onClick={() => setOpen(!open)}
        className='w-full flex items-center justify-between p-5 text-left'
      >
        <div className='flex items-center gap-3'>
          <div className='h-10 w-10 rounded-xl bg-gold-100 flex items-center justify-center'>
            <Gift className='h-5 w-5 text-gold-600' />
          </div>
          <div>
            <p className='font-bold text-gray-900 text-sm'>
              Your Bespoke Gift Order
            </p>
            <p className='text-xs text-gold-700 mt-0.5'>
              Custom specifications & personalization details
            </p>
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className='border-t border-gold-100 p-5 space-y-4'>
          {/* Team message */}
          <div className='bg-white/80 border border-gold-100 rounded-xl px-4 py-3 flex gap-3'>
            <Sparkles className='h-4 w-4 text-gold-500 flex-shrink-0 mt-0.5' />
            <p className='text-sm text-gray-700 leading-relaxed'>
              Our team will contact you to arrange payment and confirm
              production details. Once confirmed, your order will move to
              processing.
            </p>
          </div>

          {/* Items with custom fields */}
          <div className='space-y-3'>
            <p className='text-[10px] font-bold text-gray-400 uppercase tracking-widest'>
              What you ordered
            </p>
            {order.items.map((item: OrderItem, i: number) => (
              <div
                key={i}
                className='bg-white rounded-xl border border-gold-100 p-3 space-y-2'
              >
                <div className='flex gap-3'>
                  <div className='relative h-12 w-10 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0 border border-gold-100'>
                    {item.image ?
                      <img
                        src={item.image}
                        alt={item.name}
                        className='w-full h-full object-cover'
                      />
                    : <div className='absolute inset-0 flex items-center justify-center'>
                        <Package className='h-4 w-4 text-gray-200' />
                      </div>
                    }
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-bold text-gray-900 leading-snug'>
                      {item.name}
                    </p>
                    <p className='text-xs text-gray-500'>
                      Qty: {item.quantity}
                    </p>
                  </div>
                </div>
                {item.customFieldAnswers &&
                  item.customFieldAnswers.length > 0 && (
                    <div className='grid grid-cols-2 gap-1.5 pt-1'>
                      {item.customFieldAnswers.map(
                        (a: { label: string; value: string }, j: number) => (
                          <div
                            key={j}
                            className='bg-gold-50 rounded-lg px-2.5 py-1.5 border border-gold-100'
                          >
                            <p className='text-[10px] text-gold-600 font-bold'>
                              {a.label}
                            </p>
                            <p className='text-xs font-semibold text-gray-900 mt-0.5'>
                              {a.value || "—"}
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                  )}
              </div>
            ))}
          </div>

          {/* Link to original request */}
          {order.customRequestId && (
            <a
              href={`/dashboard/gifting/${encodeURIComponent(order.customRequestId)}`}
              className='inline-flex items-center gap-2 text-xs font-bold text-brand-600 hover:text-brand-700 bg-white px-4 py-2 rounded-xl border border-brand-100 hover:border-brand-300 transition-colors'
            >
              <Gift className='h-3.5 w-3.5' /> View full request details →
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/** Stars that are always visible — hover to preview, click to open review form */
function InlineStars({
  canReview,
  alreadyReviewed,
  submittedRating,
  selectedRating,
  onOpen,
}: {
  canReview: boolean;
  alreadyReviewed: boolean;
  submittedRating: number;
  selectedRating: number;
  onOpen: (rating: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  if (alreadyReviewed) {
    const info = RATING_MESSAGES[submittedRating] || RATING_MESSAGES[5];
    return (
      <div className='mt-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-2xl px-4 py-3'>
        <div className='flex items-center gap-2 mb-1.5'>
          <div className='flex gap-0.5'>
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={cn(
                  "h-4.5 w-4.5 h-[18px] w-[18px]",
                  n <= submittedRating ?
                    "fill-gold-400 text-gold-400"
                  : "fill-gray-200 text-gray-200",
                )}
              />
            ))}
          </div>
          <span className='text-xs font-bold text-green-700 flex items-center gap-1'>
            <Check className='h-3.5 w-3.5' /> Review submitted
          </span>
        </div>
        <p className='text-sm font-semibold text-gray-800'>
          {info.emoji} {info.msg}
        </p>
        <p className='text-xs text-gray-500 mt-0.5 leading-relaxed'>
          {info.sub}
        </p>
      </div>
    );
  }

  if (!canReview) return null;

  return (
    <div className='mt-2.5'>
      <p className='text-[11px] text-gray-400 mb-1.5 font-medium'>
        Tap a star to rate
      </p>
      <div className='flex gap-0.5'>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type='button'
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onOpen(n)}
            className='transition-transform hover:scale-125 active:scale-110'
            aria-label={`Rate ${n} star`}
          >
            <Star
              className={cn(
                "h-7 w-7 transition-all duration-150",
                (hovered || selectedRating) >= n ?
                  "fill-gold-400 text-gold-400 drop-shadow-sm"
                : "fill-gray-200 text-gray-200 hover:fill-gold-200 hover:text-gold-200",
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  // Review state
  const [reviewEligibility, setReviewEligibility] = useState<
    Record<
      string,
      { canReview: boolean; hasReviewed: boolean; orderId: string | null }
    >
  >({});
  const [openReviewFor, setOpenReviewFor] = useState<string | null>(null);
  const [reviewForms, setReviewForms] = useState<
    Record<string, ReviewFormState>
  >({});
  const [reviewImages, setReviewImages] = useState<Record<string, File[]>>({});
  const [reviewImagePreviews, setReviewImagePreviews] = useState<
    Record<string, string[]>
  >({});
  const [submittingFor, setSubmittingFor] = useState<string | null>(null);
  const [reviewedItems, setReviewedItems] = useState<Set<string>>(new Set());
  const [reviewedRatings, setReviewedRatings] = useState<
    Record<string, number>
  >({});

  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnModalStep, setReturnModalStep] = useState<1 | 2>(1);
  const [returnReason, setReturnReason] = useState<string>(
    RETURN_REASON_OPTIONS[0],
  );
  const [returnNote, setReturnNote] = useState("");
  const [returnRefundMethod, setReturnRefundMethod] = useState<
    "upi" | "bank_transfer"
  >("upi");
  const [returnUpiId, setReturnUpiId] = useState("");
  const [returnAccName, setReturnAccName] = useState("");
  const [returnAccNumber, setReturnAccNumber] = useState("");
  const [returnIfsc, setReturnIfsc] = useState("");
  const [returnBankName, setReturnBankName] = useState("");
  const [isReturning, setIsReturning] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const body = await orderApi.getById(params.id as string);
        const o: Order = body.data.order;
        setOrder(o);

        if (o.status === "delivered") {
          const productIds = o.items.map((item: OrderItem) =>
            typeof item.product === "string" ?
              item.product
            : (item.product as { _id: string })._id,
          );
          const results = await Promise.allSettled(
            productIds.map((pid) => reviewApi.canReview(pid)),
          );
          const map: Record<
            string,
            { canReview: boolean; hasReviewed: boolean; orderId: string | null }
          > = {};
          productIds.forEach((pid, i) => {
            if (results[i].status === "fulfilled") {
              map[pid] = (
                results[i] as PromiseFulfilledResult<{
                  data: {
                    canReview: boolean;
                    hasReviewed: boolean;
                    orderId: string | null;
                  };
                }>
              ).value.data;
            }
          });
          setReviewEligibility(map);

          if (
            typeof window !== "undefined" &&
            window.location.hash === "#review"
          ) {
            setTimeout(
              () =>
                document
                  .getElementById("review-section")
                  ?.scrollIntoView({ behavior: "smooth" }),
              300,
            );
          }
        }
      } catch {
        /* not found */
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrder();
  }, [params.id]);

  /** Support chat / email deep-link: ?return=0..4 opens step 2 with refund details (COD). */
  useEffect(() => {
    if (!order || isLoading) return;
    const r = searchParams.get("return");
    if (r === null || r === "") return;
    const idx = parseInt(r, 10);
    if (Number.isNaN(idx) || idx < 0 || idx >= RETURN_REASON_OPTIONS.length) {
      router.replace(`/dashboard/orders/${encodeURIComponent(order._id)}`, {
        scroll: false,
      });
      return;
    }
    if (!isOrderReturnEligible(order)) {
      toast.error("This order is not eligible for a return from here.");
      router.replace(`/dashboard/orders/${encodeURIComponent(order._id)}`, {
        scroll: false,
      });
      return;
    }
    const reason = getReturnReasonByIndex(idx);
    if (reason) setReturnReason(reason);
    setReturnModalStep(2);
    setReturnModalOpen(true);
    router.replace(`/dashboard/orders/${encodeURIComponent(order._id)}`, {
      scroll: false,
    });
  }, [order, isLoading, searchParams, router]);

  const closeReturnModal = () => {
    setReturnModalOpen(false);
    setReturnModalStep(1);
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setIsCancelling(true);
    try {
      const body = await orderApi.cancel(order!._id);
      setOrder(body.data.order);
      toast.success("Order cancelled successfully");
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message || "Failed to cancel order",
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRequestReturn = async () => {
    if (!order) return;
    const isCod = order.paymentMethod === "cod";
    if (isCod) {
      if (returnRefundMethod === "upi" && !returnUpiId.trim()) {
        toast.error("Please enter your UPI ID");
        return;
      }
      if (returnRefundMethod === "bank_transfer") {
        if (
          !returnAccName.trim() ||
          !returnAccNumber.trim() ||
          !returnIfsc.trim()
        ) {
          toast.error(
            "Please fill account name, account number, and IFSC code",
          );
          return;
        }
      }
    }
    setIsReturning(true);
    try {
      const refundMethod = isCod ? returnRefundMethod : undefined;
      const userBankDetails: Record<string, string> | undefined =
        isCod ?
          returnRefundMethod === "upi" ?
            { upiId: returnUpiId.trim() }
          : {
              accountName: returnAccName.trim(),
              accountNumber: returnAccNumber.trim(),
              ifscCode: returnIfsc.trim(),
              bankName: returnBankName.trim(),
            }
        : undefined;
      const body = await orderApi.requestReturn(
        order._id,
        returnReason,
        returnNote,
        refundMethod,
        userBankDetails,
      );
      setOrder(body.data.order);
      closeReturnModal();
      toast.success("Return request submitted successfully");
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message ||
          "Failed to submit return request",
      );
    } finally {
      setIsReturning(false);
    }
  };

  const openReviewForm = (productId: string, initialRating: number) => {
    setReviewForms((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        rating: initialRating,
        title:
          (
            prev[productId]?.title &&
            !isPresetReviewTitle(prev[productId].title)
          ) ?
            prev[productId].title
          : titleForRating(initialRating),
        comment: prev[productId]?.comment ?? "",
      },
    }));
    setOpenReviewFor(productId);
    // Scroll to form smoothly
    setTimeout(
      () =>
        document
          .getElementById(`review-form-${productId}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" }),
      100,
    );
  };

  const handleSubmitReview = async (e: React.FormEvent, productId: string) => {
    e.preventDefault();
    const form = reviewForms[productId];
    if (!form?.comment?.trim()) {
      toast.error("Please write a review comment");
      return;
    }
    const eligibility = reviewEligibility[productId];
    if (!eligibility?.orderId) return;

    setSubmittingFor(productId);
    try {
      const fd = new FormData();
      fd.append("rating", String(form.rating || 5));
      fd.append("title", form.title || "");
      fd.append("comment", form.comment);
      fd.append("orderId", eligibility.orderId);
      (reviewImages[productId] || []).forEach((file) =>
        fd.append("images", file),
      );
      await reviewApi.create(productId, fd);
      setReviewedItems((prev) => new Set([...Array.from(prev), productId]));
      setReviewedRatings((prev) => ({ ...prev, [productId]: form.rating }));
      setOpenReviewFor(null);
      setReviewImages((prev) => ({ ...prev, [productId]: [] }));
      setReviewImagePreviews((prev) => ({ ...prev, [productId]: [] }));
      toast.success("Thank you for your review! 🙏");
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message || "Failed to submit review",
      );
    } finally {
      setSubmittingFor(null);
    }
  };

  const updateReviewForm = (
    productId: string,
    field: keyof ReviewFormState,
    value: string | number,
  ) => {
    setReviewForms((prev) => {
      const ex = prev[productId];
      const base: ReviewFormState = {
        rating: ex?.rating ?? 5,
        title: ex?.title ?? "",
        comment: ex?.comment ?? "",
      };
      if (field === "rating") {
        const nextRating = Number(value) || 5;
        const shouldAutoTitle = !base.title || isPresetReviewTitle(base.title);
        return {
          ...prev,
          [productId]: {
            ...base,
            rating: nextRating,
            title: shouldAutoTitle ? titleForRating(nextRating) : base.title,
          },
        };
      }
      return {
        ...prev,
        [productId]: { ...base, [field]: value },
      };
    });
  };

  const onReviewImagesChange = (
    productId: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const incoming = Array.from(e.target.files || []);
    const current = reviewImages[productId] || [];
    if (incoming.length + current.length > 3) {
      toast.error("You can upload up to 3 images.");
      return;
    }
    const next = [...current, ...incoming].slice(0, 3);
    setReviewImages((prev) => ({ ...prev, [productId]: next }));
    const previews = next.map((f) => URL.createObjectURL(f));
    setReviewImagePreviews((prev) => ({ ...prev, [productId]: previews }));
  };

  const removeReviewImage = (productId: string, index: number) => {
    const files = reviewImages[productId] || [];
    const previews = reviewImagePreviews[productId] || [];
    setReviewImages((prev) => ({
      ...prev,
      [productId]: files.filter((_, i) => i !== index),
    }));
    setReviewImagePreviews((prev) => ({
      ...prev,
      [productId]: previews.filter((_, i) => i !== index),
    }));
  };

  if (isLoading) {
    return (
      <div className='space-y-4 animate-pulse'>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={`bg-gray-100 rounded-2xl ${i === 0 ? "h-8 w-48" : "h-40"}`}
          />
        ))}
      </div>
    );
  }

  if (!order) {
    return (
      <div className='bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center'>
        <Package className='h-10 w-10 text-gray-300 mx-auto mb-3' />
        <h3 className='font-semibold text-gray-900 mb-2'>Order not found</h3>
        <Button asChild variant='brand' size='sm'>
          <Link href='/dashboard/orders'>View All Orders</Link>
        </Button>
      </div>
    );
  }

  const currentStep = STATUS_STEPS.indexOf(order.status);
  const canCancel = ["pending", "confirmed"].includes(order.status);
  const isDelivered = order.status === "delivered";
  const isCancelledOrRefunded = ["cancelled", "refunded"].includes(
    order.status,
  );
  const msgTemplate =
    EMOTIONAL_MESSAGES[Math.floor(Math.random() * EMOTIONAL_MESSAGES.length)];
  const trackingHref =
    order.trackingUrl ||
    getAutoTrackingUrl(order.shippingCarrier, order.trackingNumber);

  const isReturnEligible = isOrderReturnEligible(order);

  return (
    <div className='space-y-4'>
      {/* Back + Cancel */}
      <div className='flex items-center justify-between'>
        <Link
          href='/dashboard/orders'
          className='flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 font-medium transition-colors'
        >
          <ArrowLeft className='h-4 w-4' /> Back to Orders
        </Link>
        <div className='flex gap-3'>
          {canCancel && (
            <Button
              variant='outline'
              size='sm'
              onClick={handleCancel}
              loading={isCancelling}
              className='text-red-600 border-red-200 hover:bg-red-50 text-xs'
            >
              Cancel Order
            </Button>
          )}
          {isReturnEligible && (
            <Button
              variant='outline'
              size='sm'
              onClick={() => {
                setReturnModalStep(1);
                setReturnModalOpen(true);
              }}
              className='text-amber-600 border-amber-200 hover:bg-amber-50 text-xs'
            >
              Request Return
            </Button>
          )}
        </div>
      </div>

      {order.returnStatus &&
        order.returnStatus !== "none" &&
        (() => {
          const rs = order.returnStatus as string;
          const refundMethodLabel = (m: string) => m.replace(/_/g, " ");
          const returnCopy: Record<string, string> = {
            requested:
              "Our team is reviewing your return request. We will update you shortly.",
            approved:
              "Your return was approved. Refund will be processed shortly.",
            rejected:
              "This return request was not approved. Contact support if you need help.",
            returned:
              "Return completed. Refund details are below if applicable.",
          };
          return (
            <div className='bg-amber-50 rounded-2xl border border-amber-200 shadow-sm p-4 sm:p-5 flex gap-3 items-start'>
              <AlertCircle className='h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0' />
              <div className='flex-1'>
                <h3 className='font-bold text-amber-800 capitalize'>
                  Return Status: {rs}
                </h3>
                <p className='text-sm text-amber-700 mt-1'>
                  {returnCopy[rs] ?? "We will update you on your return."}
                </p>
                {order.refundData && (
                  <div className='mt-3 bg-white/60 p-3 rounded-xl border border-amber-100'>
                    <p className='text-sm font-semibold text-amber-900'>
                      Refund Processed: {formatPrice(order.refundData.amount)}
                    </p>
                    <p className='text-xs text-amber-700'>
                      Method:{" "}
                      <span className='capitalize'>
                        {refundMethodLabel(String(order.refundData.method))}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

      {/* Order header + progress */}
      <div className='bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6'>
        <div className='flex flex-wrap items-start justify-between gap-3 mb-5'>
          <div>
            <h2 className='text-lg font-bold text-gray-900'>
              {order.orderNumber}
            </h2>
            <p className='text-sm text-gray-500 mt-0.5'>
              {formatDateTime(order.createdAt)}
            </p>
          </div>
          <div className='flex gap-2 flex-wrap'>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full capitalize",
                getOrderStatusColor(order.status),
              )}
            >
              {STATUS_META[order.status]?.icon}
              {order.status}
            </span>
            <span
              className={cn(
                "text-xs font-semibold px-3 py-1.5 rounded-full capitalize",
                getPaymentStatusColor(order.paymentStatus),
              )}
            >
              {order.paymentStatus}
            </span>
          </div>
        </div>

        {/* Progress tracker */}
        {!isCancelledOrRefunded && (
          <div className='flex items-start justify-between relative'>
            {STATUS_STEPS.map((step, i) => (
              <div
                key={step}
                className='flex-1 flex flex-col items-center gap-1.5 relative'
              >
                {i < STATUS_STEPS.length - 1 && (
                  <div
                    className='absolute top-[14px] h-0.5 z-0'
                    style={{
                      left: "calc(50% + 12px)",
                      right: "calc(-50% + 12px)",
                    }}
                  >
                    <div
                      className={cn(
                        "h-full transition-all",
                        i < currentStep ? "bg-brand-500" : "bg-gray-200",
                      )}
                      style={{ width: "100%" }}
                    />
                  </div>
                )}
                <div
                  className={cn(
                    "relative z-10 h-7 w-7 rounded-full flex items-center justify-center ring-2 ring-white shadow-sm",
                    i < currentStep ? "bg-brand-600"
                    : i === currentStep ? "bg-brand-600 ring-brand-200 ring-4"
                    : "bg-gray-200",
                  )}
                >
                  {i <= currentStep ?
                    <Check className='h-3.5 w-3.5 text-white' />
                  : <span className='text-[10px] font-bold text-gray-400'>
                      {i + 1}
                    </span>
                  }
                </div>
                <span
                  className={cn(
                    "text-[10px] sm:text-xs font-medium capitalize text-center",
                    i <= currentStep ? "text-brand-600" : "text-gray-400",
                  )}
                >
                  {step}
                </span>
              </div>
            ))}
          </div>
        )}

        {isCancelledOrRefunded && (
          <div className='flex items-center gap-2 p-3 bg-red-50 rounded-xl text-sm text-red-700 font-medium'>
            <AlertCircle className='h-4 w-4' /> This order has been{" "}
            {order.status}.
          </div>
        )}
      </div>

      {/* Tracking */}
      {(order.status === "shipped" || order.status === "delivered") &&
        (order.trackingNumber ||
          order.trackingUrl ||
          order.shippingCarrier) && (
          <div className='bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <h3 className='font-semibold text-gray-900 flex items-center gap-2'>
                  <Truck className='h-4 w-4 text-brand-600' /> Tracking Details
                </h3>
                <div className='mt-2 text-sm text-gray-600 space-y-1'>
                  {order.shippingCarrier && (
                    <p>
                      <span className='text-gray-400'>Courier:</span>{" "}
                      <span className='font-medium text-gray-900'>
                        {order.shippingCarrier}
                      </span>
                    </p>
                  )}
                  {order.trackingNumber && (
                    <p>
                      <span className='text-gray-400'>AWB:</span>{" "}
                      <span className='font-mono font-semibold text-gray-900'>
                        {order.trackingNumber}
                      </span>
                    </p>
                  )}
                  {!order.trackingUrl && trackingHref && (
                    <p className='text-xs text-gray-400'>
                      Track link generated automatically.
                    </p>
                  )}
                </div>
              </div>
              {trackingHref && (
                <a
                  href={trackingHref}
                  target='_blank'
                  rel='noreferrer'
                  className='inline-flex items-center justify-center px-4 py-2.5 rounded-2xl bg-navy-900 text-white text-sm font-semibold hover:bg-navy-800 transition-colors'
                >
                  Track Now
                </a>
              )}
            </div>
          </div>
        )}

      {/* Custom gift details — shown for bespoke orders */}
      {order.productType === "custom" && <CustomGiftDetails order={order} />}

      {/* ── Order Items ── */}
      <div
        id='review-section'
        className='bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6'
      >
        <h3 className='font-semibold text-gray-900 mb-4 flex items-center gap-2'>
          <Package className='h-4 w-4 text-brand-600' /> Order Items
        </h3>

        <div className='space-y-5'>
          {order.items.map((item: OrderItem, i: number) => {
            const productId =
              typeof item.product === "string" ?
                item.product
              : (item.product as { _id: string })._id;
            const productSlug =
              typeof item.product === "object" ?
                (item.product as { slug?: string }).slug
              : undefined;
            const eligibility = reviewEligibility[productId];
            const alreadyReviewed =
              reviewedItems.has(productId) ||
              (eligibility?.hasReviewed ?? false);
            const canReview = !!(
              eligibility?.canReview && !reviewedItems.has(productId)
            );
            const isReviewOpen = openReviewFor === productId;
            const formData = reviewForms[productId] || {
              rating: 5,
              title: "",
              comment: "",
            };
            const localReviewPreviews = reviewImagePreviews[productId] || [];

            return (
              <div key={i} className='space-y-0'>
                {/* Item row — clickable to product page */}
                <div className='flex gap-3 sm:gap-4'>
                  {productSlug ?
                    <Link
                      href={`/shop/${encodeURIComponent(productSlug)}`}
                      className='relative w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0 hover:opacity-90 hover:shadow-md transition-all ring-0 hover:ring-2 ring-brand-200'
                    >
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes='80px'
                        className='object-cover'
                      />
                    </Link>
                  : <div className='relative w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0'>
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes='80px'
                        className='object-cover'
                      />
                    </div>
                  }

                  <div className='flex-1 min-w-0'>
                    {productSlug ?
                      <Link
                        href={`/shop/${encodeURIComponent(productSlug)}`}
                        className='text-sm font-semibold text-gray-900 hover:text-brand-600 transition-colors leading-snug block'
                      >
                        {item.name}
                      </Link>
                    : <p className='text-sm font-semibold text-gray-900 leading-snug'>
                        {item.name}
                      </p>
                    }
                    <p className='text-xs text-gray-500 mt-1'>
                      {[item.variant.size, item.variant.color]
                        .filter(Boolean)
                        .join(" · ")}{" "}
                      &middot; Qty: {item.quantity}
                    </p>
                    <p className='text-sm font-bold text-gray-900 mt-1.5'>
                      {formatPrice(item.price * item.quantity)}
                    </p>

                    {/* Inline stars — only for delivered orders */}
                    {isDelivered && (
                      <InlineStars
                        canReview={canReview}
                        alreadyReviewed={alreadyReviewed}
                        submittedRating={reviewedRatings[productId] ?? 5}
                        selectedRating={isReviewOpen ? formData.rating : 0}
                        onOpen={(rating) => openReviewForm(productId, rating)}
                      />
                    )}
                  </div>
                </div>

                {/* Inline review form — expands below the item */}
                {isReviewOpen && canReview && (
                  <div
                    id={`review-form-${productId}`}
                    className='mt-4 ml-0 sm:ml-[96px] bg-gradient-to-br from-brand-50 via-white to-gold-50 rounded-2xl p-5 border border-brand-100 shadow-sm animate-fadeIn'
                  >
                    {/* Emotional header */}
                    <div className='flex items-start gap-3 mb-5'>
                      <div className='h-9 w-9 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0'>
                        <Sparkles className='h-5 w-5 text-brand-600' />
                      </div>
                      <div>
                        <p className='font-semibold text-gray-900 text-sm leading-snug'>
                          {msgTemplate.heading}
                        </p>
                        <p className='text-xs text-gray-500 mt-0.5 leading-relaxed'>
                          {msgTemplate.sub}
                        </p>
                      </div>
                    </div>

                    <form
                      onSubmit={(e) => handleSubmitReview(e, productId)}
                      className='space-y-4'
                    >
                      {/* Star selector */}
                      <div>
                        <p className='text-xs font-semibold text-gray-600 mb-2'>
                          Your rating *
                        </p>
                        <div className='flex gap-1'>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              type='button'
                              onClick={() =>
                                updateReviewForm(productId, "rating", n)
                              }
                              className='transition-transform hover:scale-110'
                            >
                              <Star
                                className={cn(
                                  "h-8 w-8 transition-colors",
                                  formData.rating >= n ?
                                    "fill-gold-400 text-gold-400"
                                  : "fill-gray-200 text-gray-200",
                                )}
                              />
                            </button>
                          ))}
                          <span className='ml-2 text-sm font-semibold text-gray-700 self-center'>
                            {
                              [
                                "",
                                "Poor",
                                "Fair",
                                "Good",
                                "Great",
                                "Excellent!",
                              ][formData.rating]
                            }
                          </span>
                        </div>
                      </div>

                      <div>
                        <p className='text-xs font-semibold text-gray-600 mb-1.5'>
                          Title (optional)
                        </p>
                        <div className='rounded-xl border border-gray-200 bg-white p-2.5'>
                          <div className='flex flex-wrap gap-2'>
                            <button
                              type='button'
                              onClick={() =>
                                updateReviewForm(productId, "title", "")
                              }
                              className={cn(
                                "rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                                !formData.title ?
                                  "border-gray-900 bg-gray-900 text-white"
                                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300",
                              )}
                            >
                              Skip
                            </button>
                            {REVIEW_TITLE_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                type='button'
                                onClick={() =>
                                  updateReviewForm(
                                    productId,
                                    "title",
                                    opt.value,
                                  )
                                }
                                className={cn(
                                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                                  formData.title === opt.value ?
                                    "border-brand-500 bg-brand-50 text-brand-700 shadow-sm"
                                  : "border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:bg-brand-50/40",
                                )}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <p className='text-[11px] text-gray-500 mt-1'>
                          Choose a headline so your review is easier to read.
                        </p>
                      </div>

                      <div>
                        <p className='text-xs font-semibold text-gray-600 mb-1.5'>
                          Your review *
                        </p>
                        <textarea
                          value={formData.comment}
                          onChange={(e) =>
                            updateReviewForm(
                              productId,
                              "comment",
                              e.target.value,
                            )
                          }
                          maxLength={1000}
                          rows={3}
                          required
                          placeholder='How was the quality, fit, and fabric? Would you recommend it?'
                          className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 placeholder-gray-400 resize-none transition-all'
                        />
                        <p className='text-xs text-gray-400 text-right mt-0.5'>
                          {formData.comment.length}/1000
                        </p>
                      </div>

                      <div>
                        <p className='text-xs font-semibold text-gray-600 mb-2'>
                          Photos (up to 3)
                        </p>
                        <div className='flex flex-wrap gap-2.5'>
                          {localReviewPreviews.map((preview, idx) => (
                            <div
                              key={idx}
                              className='relative h-16 w-16 rounded-xl overflow-hidden border border-gray-200 bg-white'
                            >
                              <Image
                                src={preview}
                                alt='Review image preview'
                                fill
                                sizes='64px'
                                className='object-cover'
                              />
                              <button
                                type='button'
                                onClick={() =>
                                  removeReviewImage(productId, idx)
                                }
                                className='absolute -top-1 -right-1 h-5 w-5 rounded-full bg-black/70 text-white flex items-center justify-center'
                                aria-label='Remove image'
                              >
                                <X className='h-3 w-3' />
                              </button>
                            </div>
                          ))}
                          {localReviewPreviews.length < 3 && (
                            <label className='h-16 w-16 rounded-xl border border-dashed border-gray-300 text-gray-500 hover:border-brand-400 hover:text-brand-600 bg-white flex items-center justify-center cursor-pointer'>
                              <Plus className='h-4 w-4' />
                              <input
                                type='file'
                                accept='image/*'
                                multiple
                                onChange={(e) =>
                                  onReviewImagesChange(productId, e)
                                }
                                className='hidden'
                              />
                            </label>
                          )}
                        </div>
                      </div>

                      <div className='flex gap-2.5 pt-1'>
                        <button
                          type='submit'
                          disabled={submittingFor === productId}
                          className='flex-1 sm:flex-none sm:px-7 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2'
                        >
                          {submittingFor === productId ?
                            <>
                              <span className='h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin' />{" "}
                              Submitting…
                            </>
                          : "Submit Review"}
                        </button>
                        <button
                          type='button'
                          onClick={() => setOpenReviewFor(null)}
                          className='px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-all'
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div className='border-t border-gray-100 mt-5 pt-4 space-y-2 text-sm'>
          <div className='flex justify-between text-gray-600'>
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className='flex justify-between text-green-600'>
              <span>Discount</span>
              <span>- {formatPrice(order.discount)}</span>
            </div>
          )}
          <div className='flex justify-between text-gray-600'>
            <span>Shipping</span>
            <span>
              {order.shippingCharge === 0 ?
                <span className='text-green-600 font-semibold'>FREE</span>
              : formatPrice(order.shippingCharge)}
            </span>
          </div>
          {(order.codFee || 0) > 0 && (
            <div className='flex justify-between text-gray-600'>
              <span>COD fee</span>
              <span>{formatPrice(order.codFee || 0)}</span>
            </div>
          )}
          <div className='flex justify-between text-gray-600'>
            <span>Tax</span>
            <span>{formatPrice(order.tax)}</span>
          </div>
          <div className='flex justify-between font-bold text-base text-gray-900 pt-2 border-t border-gray-100'>
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
          {/* {(order.shippingCharge > 0 || (order.codFee || 0) > 0) && (
            <p className="text-[11px] text-amber-800/90 bg-amber-50/90 border border-amber-100 rounded-lg px-2.5 py-2 leading-snug mt-2">
              On approved returns, refunds are for product value only (up to{' '}
              <span className="font-semibold tabular-nums">{formatPrice(getMaxRefundableInr(order))}</span>
              ).
              {order.shippingCharge > 0 && (
                <> Shipping {formatPrice(order.shippingCharge)} is not refunded.</>
              )}
              {(order.codFee || 0) > 0 && (
                <> COD handling {formatPrice(order.codFee || 0)} is not refunded.</>
              )}
            </p>
          )} */}
        </div>
      </div>

      {/* Address + Payment */}
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        <div className='bg-white rounded-2xl border border-gray-100 shadow-sm p-5'>
          <h3 className='font-semibold text-gray-900 mb-3 flex items-center gap-2'>
            <MapPin className='h-4 w-4 text-brand-600' /> Shipping Address
          </h3>
          <p className='text-sm text-gray-700 leading-relaxed'>
            {order.shippingAddress.street}
            <br />
            {order.shippingAddress.city}, {order.shippingAddress.state}
            <br />
            {order.shippingAddress.pincode}, {order.shippingAddress.country}
          </p>
        </div>
        <div className='bg-white rounded-2xl border border-gray-100 shadow-sm p-5'>
          <h3 className='font-semibold text-gray-900 mb-3 flex items-center gap-2'>
            <CreditCard className='h-4 w-4 text-brand-600' /> Payment
          </h3>
          <p className='text-sm text-gray-700'>
            {order.paymentMethod === "cod" ?
              "Cash on Delivery"
            : "Online Payment (Razorpay)"}
          </p>
          {order.razorpayPaymentId && (
            <p className='text-xs text-gray-400 mt-1 font-mono'>
              ID: {order.razorpayPaymentId}
            </p>
          )}
          <div className='mt-2'>
            <span
              className={cn(
                "text-xs font-semibold px-2.5 py-1 rounded-full capitalize",
                getPaymentStatusColor(order.paymentStatus),
              )}
            >
              {order.paymentStatus}
            </span>
          </div>
          {order.invoice?.isGenerated &&
            (order.paymentStatus === "paid" ||
              order.status === "delivered") && (
              <Link
                href={`/dashboard/orders/${encodeURIComponent(order._id)}/invoice`}
                className='inline-flex mt-3 text-xs font-semibold text-brand-700 hover:text-brand-800'
              >
                View Invoice
              </Link>
            )}
        </div>
      </div>

      {/* Status History */}
      <div className='bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6'>
        <h3 className='font-semibold text-gray-900 mb-4 flex items-center gap-2'>
          <Clock className='h-4 w-4 text-brand-600' /> Status History
        </h3>
        <div className='space-y-0'>
          {order.statusHistory.map((history, i) => (
            <div key={i} className='flex items-start gap-4 relative'>
              {i < order.statusHistory.length - 1 && (
                <div className='absolute left-[7px] top-5 bottom-0 w-0.5 bg-gray-100' />
              )}
              <div className='h-4 w-4 rounded-full bg-brand-100 border-2 border-brand-400 flex-shrink-0 mt-1 relative z-10' />
              <div className='pb-4'>
                <p className='text-sm font-semibold capitalize text-gray-900'>
                  {history.status}
                </p>
                {history.note && (
                  <p className='text-xs text-gray-500 mt-0.5'>{history.note}</p>
                )}
                <p className='text-xs text-gray-400 mt-0.5'>
                  {formatDateTime(history.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {returnModalOpen && order && (
        <div
          className='fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4'
          onClick={(e) => {
            if (e.target === e.currentTarget) closeReturnModal();
          }}
        >
          <div
            className='bg-white w-full sm:max-w-[520px] sm:mx-auto rounded-t-3xl sm:rounded-3xl flex flex-col max-h-[min(92dvh,920px)] sm:max-h-[90vh] shadow-2xl'
            data-lenis-prevent
          >
            <div className='shrink-0 px-5 sm:px-8 pt-5 sm:pt-8 pb-3 border-b border-gray-100'>
              <div className='flex items-center justify-between gap-3 mb-3'>
                <h2 className='text-lg sm:text-xl font-bold text-gray-900'>
                  {returnModalStep === 1 ?
                    "Return — reason"
                  : "Return — refund"}
                </h2>
                <span className='text-[11px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full'>
                  Step {returnModalStep} of 2
                </span>
              </div>
              <div className='flex gap-1.5 mb-1'>
                <div
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    returnModalStep >= 1 ? "bg-brand-500" : "bg-gray-200",
                  )}
                />
                <div
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    returnModalStep >= 2 ? "bg-brand-500" : "bg-gray-200",
                  )}
                />
              </div>
              <p className='text-sm text-gray-500 mt-2'>
                {returnModalStep === 1 ?
                  "Tell us why you’re returning — then add refund details in the next step."
                : order.paymentMethod === "razorpay" ?
                  "Your refund goes back to your original payment method."
                : "Choose how we should send your refund for this COD order."}
              </p>
              {returnModalStep === 2 &&
                (order.shippingCharge > 0 || (order.codFee || 0) > 0) && (
                  <p className='text-xs text-amber-900 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mt-3 leading-snug'>
                    Approved refunds exclude shipping and COD handling fees (max
                    refund{" "}
                    <span className='font-semibold tabular-nums'>
                      {formatPrice(getMaxRefundableInr(order))}
                    </span>
                    ), per our Terms.
                  </p>
                )}
            </div>

            <div className='flex-1 overflow-y-auto overscroll-contain px-5 sm:px-8 py-5 space-y-4 min-h-0'>
              {returnModalStep === 1 && (
                <>
                  <div>
                    <p className='text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2'>
                      Items in this order
                    </p>
                    <ul className='space-y-2 rounded-2xl border border-gray-100 bg-gray-50/80 p-3'>
                      {order.items.map((item: OrderItem, i: number) => {
                        const img =
                          item.image ||
                          (typeof item.product !== "string" &&
                            item.product?.images?.[0]?.url) ||
                          "";
                        return (
                          <li
                            key={i}
                            className='flex gap-3 items-center min-w-0'
                          >
                            <div className='relative h-14 w-11 rounded-lg overflow-hidden bg-white border border-gray-100 shrink-0'>
                              {img ?
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={img}
                                  alt=''
                                  className='h-full w-full object-cover'
                                />
                              : <div className='absolute inset-0 flex items-center justify-center bg-gray-50'>
                                  <Package className='h-5 w-5 text-gray-200' />
                                </div>
                              }
                            </div>
                            <div className='min-w-0 flex-1'>
                              <p className='text-sm font-semibold text-gray-900 line-clamp-2'>
                                {item.name}
                              </p>
                              <p className='text-xs text-gray-500'>
                                Qty {item.quantity}
                                {item.variant?.size ?
                                  ` · ${item.variant.size}`
                                : ""}
                                {item.variant?.color ?
                                  ` · ${item.variant.color}`
                                : ""}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  <div className='space-y-1'>
                    <label className='text-xs font-semibold text-gray-700'>
                      Reason for return *
                    </label>
                    <select
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      className='w-full h-11 px-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white'
                    >
                      {RETURN_REASON_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt.replace("/", " / ")}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className='space-y-1'>
                    <label className='text-xs font-semibold text-gray-700'>
                      Notes (optional)
                    </label>
                    <textarea
                      value={returnNote}
                      onChange={(e) => setReturnNote(e.target.value)}
                      placeholder='Anything else we should know?'
                      rows={3}
                      className='w-full px-3.5 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none'
                    />
                  </div>
                  <p className='text-xs text-gray-400'>
                    Eligible within 7 days of delivery. See our return policy
                    for details.
                  </p>
                </>
              )}

              {returnModalStep === 2 && (
                <div className='bg-gray-50 rounded-2xl p-4 space-y-3 border border-gray-100'>
                  <p className='text-xs font-bold text-gray-600 uppercase tracking-wide'>
                    Refund method
                  </p>
                  <p className='text-xs text-gray-600'>
                    Reason:{" "}
                    <span className='font-semibold text-gray-900'>
                      {returnReason}
                    </span>
                  </p>

                  {order.paymentMethod === "razorpay" ?
                    <div className='flex items-start gap-2.5 bg-green-50 border border-green-200 rounded-xl p-3'>
                      <CheckCircle2 className='h-4 w-4 text-green-600 mt-0.5 flex-shrink-0' />
                      <div>
                        <p className='text-sm font-semibold text-green-800'>
                          Refund to original payment
                        </p>
                        <p className='text-xs text-green-700 mt-0.5 leading-relaxed'>
                          We’ll credit the same UPI, card, or wallet used at
                          checkout. Usually 5–7 business days.
                        </p>
                      </div>
                    </div>
                  : <>
                      <p className='text-xs text-gray-600 leading-relaxed'>
                        Cash on delivery — enter where we should send your
                        refund.
                      </p>
                      <div className='flex flex-col sm:flex-row gap-2'>
                        {(["upi", "bank_transfer"] as const).map((m) => (
                          <button
                            key={m}
                            type='button'
                            onClick={() => setReturnRefundMethod(m)}
                            className={cn(
                              "flex-1 min-h-[44px] py-2.5 rounded-xl text-sm font-semibold border transition-all",
                              returnRefundMethod === m ?
                                "bg-brand-600 text-white border-brand-600"
                              : "bg-white text-gray-700 border-gray-200 hover:border-brand-300",
                            )}
                          >
                            {m === "upi" ? "UPI" : "Bank transfer"}
                          </button>
                        ))}
                      </div>

                      {returnRefundMethod === "upi" ?
                        <div>
                          <label className='text-xs font-semibold text-gray-700'>
                            UPI ID *
                          </label>
                          <input
                            type='text'
                            value={returnUpiId}
                            onChange={(e) => setReturnUpiId(e.target.value)}
                            placeholder='yourname@upi'
                            autoComplete='off'
                            className='w-full mt-1 h-11 px-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white'
                          />
                        </div>
                      : <div className='space-y-2.5'>
                          {[
                            {
                              label: "Account holder name *",
                              value: returnAccName,
                              setter: setReturnAccName,
                              placeholder: "Name on bank account",
                            },
                            {
                              label: "Account number *",
                              value: returnAccNumber,
                              setter: setReturnAccNumber,
                              placeholder: "Account number",
                            },
                            {
                              label: "IFSC code *",
                              value: returnIfsc,
                              setter: setReturnIfsc,
                              placeholder: "e.g. SBIN0001234",
                            },
                            {
                              label: "Bank name",
                              value: returnBankName,
                              setter: setReturnBankName,
                              placeholder: "Optional",
                            },
                          ].map(({ label, value, setter, placeholder }) => (
                            <div key={label}>
                              <label className='text-xs font-semibold text-gray-700'>
                                {label}
                              </label>
                              <input
                                type='text'
                                value={value}
                                onChange={(e) => setter(e.target.value)}
                                placeholder={placeholder}
                                className='w-full mt-1 h-11 px-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white'
                              />
                            </div>
                          ))}
                        </div>
                      }
                    </>
                  }
                </div>
              )}
            </div>

            <div className='shrink-0 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 px-5 sm:px-8 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-8 pt-3 border-t border-gray-100 bg-white'>
              {returnModalStep === 1 ?
                <>
                  <Button
                    variant='outline'
                    className='flex-1 rounded-xl min-h-[48px]'
                    disabled={isReturning}
                    onClick={closeReturnModal}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant='brand'
                    className='flex-1 rounded-xl min-h-[48px]'
                    onClick={() => setReturnModalStep(2)}
                  >
                    Continue
                  </Button>
                </>
              : <>
                  <Button
                    variant='outline'
                    className='flex-1 rounded-xl min-h-[48px]'
                    disabled={isReturning}
                    onClick={() => setReturnModalStep(1)}
                  >
                    Back
                  </Button>
                  <Button
                    variant='brand'
                    className='flex-1 rounded-xl min-h-[48px]'
                    loading={isReturning}
                    onClick={handleRequestReturn}
                  >
                    Submit request
                  </Button>
                </>
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
