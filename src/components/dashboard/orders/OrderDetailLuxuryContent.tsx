"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Shield, Star, Award, AlertCircle } from "lucide-react";
import { Order, OrderItem } from "@/types";
import { formatPrice, cn } from "@/lib/utils";
import {
  getOrderStatusLabel,
  getOrderStatusBadgeClass,
} from "@/lib/accountOrderStyles";
import {
  buildTrackingTimeline,
  getExpectedDeliveryLabel,
  maskPhone,
  paymentMethodLabel,
} from "./orderDetailHelpers";
import OrderTrackingTimeline from "./OrderTrackingTimeline";
import { InlineStars, OrderReviewForm } from "./OrderItemReviewBlock";

const SUPPORT_EMAIL = "support@thehouseofrani.com";

type ReviewFormState = { rating: number; title: string; comment: string };

type Props = {
  order: Order;
  trackingHref: string | null;
  isDelivered: boolean;
  isCancelledOrRefunded: boolean;
  canCancel: boolean;
  isCancelling: boolean;
  cancelLocked: boolean;
  isReturnEligible: boolean;
  onCancel: () => void;
  onOpenReturn: () => void;
  returnBanner: React.ReactNode;
  customGiftSection: React.ReactNode;
  reviewEligibility: Record<string, { canReview: boolean; hasReviewed: boolean; orderId: string | null }>;
  reviewedItems: Set<string>;
  reviewedRatings: Record<string, number>;
  openReviewFor: string | null;
  reviewForms: Record<string, ReviewFormState>;
  reviewImagePreviews: Record<string, string[]>;
  submittingFor: string | null;
  msgTemplate: { heading: string; sub: string };
  onOpenReview: (productId: string, rating: number) => void;
  onCloseReview: (productId: string) => void;
  onUpdateReview: (productId: string, field: keyof ReviewFormState, value: string | number) => void;
  onReviewImagesChange: (productId: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveReviewImage: (productId: string, index: number) => void;
  onSubmitReview: (e: React.FormEvent, productId: string) => void;
};

export default function OrderDetailLuxuryContent({
  order,
  trackingHref,
  isDelivered,
  isCancelledOrRefunded,
  canCancel,
  isCancelling,
  cancelLocked,
  isReturnEligible,
  onCancel,
  onOpenReturn,
  returnBanner,
  customGiftSection,
  reviewEligibility,
  reviewedItems,
  reviewedRatings,
  openReviewFor,
  reviewForms,
  reviewImagePreviews,
  submittingFor,
  msgTemplate,
  onOpenReview,
  onCloseReview,
  onUpdateReview,
  onReviewImagesChange,
  onRemoveReviewImage,
  onSubmitReview,
}: Props) {
  const trackingEvents = buildTrackingTimeline(order);
  const expectedDelivery = getExpectedDeliveryLabel(order);
  const showTracking = !isCancelledOrRefunded && trackingEvents.length > 0;
  const canShowInvoice =
    !!order.invoice?.isGenerated &&
    (order.paymentStatus === "paid" || order.status === "delivered");

  const hasReviewableItem = isDelivered && order.items.some((item) => {
    const productId = typeof item.product === "string" ? item.product : item.product._id;
    const e = reviewEligibility[productId];
    return e?.canReview && !reviewedItems.has(productId) && !e.hasReviewed;
  });

  return (
    <div className="flex flex-col gap-account-stack-lg pb-8">
      {/* Breadcrumb + header */}
      <header>
        <nav className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-account-outline mb-4">
          <Link href="/dashboard/orders" className="hover:text-account-secondary transition-colors">
            Orders
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-account-on-surface-variant">#{order.orderNumber}</span>
        </nav>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl text-account-primary">
              Order #{order.orderNumber} Details
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <span
                className={cn(
                  "px-3 py-1 text-[11px] font-semibold uppercase tracking-widest",
                  getOrderStatusBadgeClass(order.status),
                )}
              >
                {getOrderStatusLabel(order.status)}
              </span>
              {expectedDelivery && (
                <span className="text-sm text-account-on-surface-variant italic">
                  {expectedDelivery}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            {hasReviewableItem && (
              <a
                href="#review-section"
                className="inline-flex items-center gap-2 border border-account-secondary text-account-secondary px-5 py-3 text-[11px] font-semibold uppercase tracking-widest hover:bg-account-secondary-container/20 transition-colors"
              >
                <Star className="h-4 w-4" />
                Write Review
              </a>
            )}
            {canShowInvoice && (
              <Link
                href={`/dashboard/orders/${encodeURIComponent(order._id)}/invoice`}
                className="border border-account-primary text-account-primary px-5 py-3 text-[11px] font-semibold uppercase tracking-widest hover:bg-account-surface-container transition-colors"
              >
                Download Invoice
              </Link>
            )}
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=Order%20${encodeURIComponent(order.orderNumber)}`}
              className="bg-account-primary text-white px-5 py-3 text-[11px] font-semibold uppercase tracking-widest hover:opacity-90 transition-opacity"
            >
              Contact Concierge
            </a>
          </div>
        </div>

        {(canCancel || isReturnEligible) && (
          <div className="flex flex-wrap gap-3 mt-4">
            {canCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isCancelling || cancelLocked}
                className="text-[11px] font-semibold uppercase tracking-widest text-red-600 border border-red-300 px-4 py-2 hover:bg-red-50 disabled:opacity-50"
              >
                {isCancelling ? "Cancelling…" : "Cancel Order"}
              </button>
            )}
            {isReturnEligible && (
              <button
                type="button"
                onClick={onOpenReturn}
                className="text-[11px] font-semibold uppercase tracking-widest text-account-secondary border border-account-secondary px-4 py-2 hover:bg-account-secondary-container/20"
              >
                Request Return
              </button>
            )}
          </div>
        )}
      </header>

      {returnBanner}

      {isCancelledOrRefunded && (
        <div className="bg-red-50 border border-red-200 p-4 flex items-center gap-3 text-sm text-red-800">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>This order has been {order.status}.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-account-gutter">
        {/* Left column */}
        <div className="lg:col-span-8 flex flex-col gap-account-gutter">
          {/* Items */}
          <section
            id="review-section"
            className="bg-account-surface-container-lowest border border-account-outline-variant/30 p-6 md:p-8"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-account-on-surface-variant mb-6">
              Item Details
            </p>
            <div className="space-y-8">
              {order.items.map((item: OrderItem, i: number) => {
                const productId =
                  typeof item.product === "string" ? item.product : item.product._id;
                const productSlug =
                  typeof item.product === "object" ? item.product.slug : undefined;
                const eligibility = reviewEligibility[productId];
                const alreadyReviewed =
                  reviewedItems.has(productId) || (eligibility?.hasReviewed ?? false);
                const canReview = !!(eligibility?.canReview && !reviewedItems.has(productId));
                const isReviewOpen = openReviewFor === productId;
                const formData = reviewForms[productId] || { rating: 5, title: "", comment: "" };
                const variantParts = [item.variant.size, item.variant.color].filter(Boolean);

                return (
                  <div key={i} className={cn(i > 0 && "pt-8 border-t border-account-outline-variant/20")}>
                    <div className="flex flex-col sm:flex-row gap-6">
                      <div className="relative w-full sm:w-36 h-48 sm:h-52 shrink-0 bg-account-surface-container overflow-hidden">
                        {productSlug ? (
                          <Link href={`/shop/${encodeURIComponent(productSlug)}`}>
                            <Image src={item.image} alt={item.name} fill sizes="144px" className="object-cover" />
                          </Link>
                        ) : (
                          <Image src={item.image} alt={item.name} fill sizes="144px" className="object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {productSlug ? (
                          <Link
                            href={`/shop/${encodeURIComponent(productSlug)}`}
                            className="font-serif text-xl md:text-2xl text-account-primary italic hover:text-account-secondary transition-colors"
                          >
                            {item.name}
                          </Link>
                        ) : (
                          <h3 className="font-serif text-xl md:text-2xl text-account-primary italic">{item.name}</h3>
                        )}
                        {item.variant.sku && (
                          <p className="text-[11px] font-semibold uppercase tracking-widest text-account-outline mt-2">
                            SKU: {item.variant.sku}
                          </p>
                        )}
                        {variantParts.length > 0 && (
                          <p className="text-sm text-account-on-surface-variant mt-2">
                            {variantParts.join(" · ")}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-8 mt-6">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-account-outline">Quantity</p>
                            <p className="text-lg text-account-primary mt-1">
                              {String(item.quantity).padStart(2, "0")}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-account-outline">Price</p>
                            <p className="text-lg font-semibold text-account-primary mt-1">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-4 text-account-secondary">
                          <Award className="h-4 w-4" />
                          <span className="text-[11px] font-semibold uppercase tracking-wider">
                            Authenticity certificate included
                          </span>
                        </div>

                        {isDelivered && (
                          <InlineStars
                            canReview={canReview}
                            alreadyReviewed={alreadyReviewed}
                            submittedRating={reviewedRatings[productId] ?? 5}
                            selectedRating={isReviewOpen ? formData.rating : 0}
                            onOpen={(rating) => onOpenReview(productId, rating)}
                          />
                        )}

                        {isDelivered && canReview && !isReviewOpen && (
                          <button
                            type="button"
                            onClick={() => onOpenReview(productId, 5)}
                            className="mt-4 inline-flex items-center gap-2 border border-account-secondary text-account-secondary px-5 py-2.5 text-[11px] font-semibold uppercase tracking-widest hover:bg-account-secondary-container/20"
                          >
                            <Star className="h-4 w-4" />
                            Write a Review
                          </button>
                        )}
                      </div>
                    </div>

                    {isReviewOpen && canReview && (
                      <OrderReviewForm
                        productId={productId}
                        formData={formData}
                        previews={reviewImagePreviews[productId] || []}
                        submitting={submittingFor === productId}
                        msgHeading={msgTemplate.heading}
                        msgSub={msgTemplate.sub}
                        onUpdate={(field, value) => onUpdateReview(productId, field, value)}
                        onImagesChange={(e) => onReviewImagesChange(productId, e)}
                        onRemoveImage={(idx) => onRemoveReviewImage(productId, idx)}
                        onSubmit={(e) => onSubmitReview(e, productId)}
                        onCancel={() => onCloseReview(productId)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {customGiftSection}

          {showTracking && <OrderTrackingTimeline events={trackingEvents} />}
        </div>

        {/* Right column — summary */}
        <aside className="lg:col-span-4">
          <div className="bg-account-surface-container-lowest border border-account-outline-variant/30 p-6 md:p-8 lg:sticky lg:top-24">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-account-on-surface-variant mb-6">
              Order Summary
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-account-on-surface-variant">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Discount</span>
                  <span>- {formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-account-on-surface-variant">
                <span>Shipping</span>
                <span>
                  {order.shippingCharge === 0 ?
                    <span className="text-account-secondary font-medium">Complimentary</span>
                  : formatPrice(order.shippingCharge)}
                </span>
              </div>
              {(order.codFee || 0) > 0 && (
                <div className="flex justify-between text-account-on-surface-variant">
                  <span>COD handling</span>
                  <span>{formatPrice(order.codFee || 0)}</span>
                </div>
              )}
              <div className="flex justify-between text-account-on-surface-variant">
                <span>GST</span>
                <span>{formatPrice(order.tax)}</span>
              </div>
            </div>

            <div className="flex justify-between items-baseline mt-6 pt-6 border-t border-account-outline-variant/30">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-account-outline">Total</span>
              <span className="font-serif text-2xl text-account-primary">{formatPrice(order.total)}</span>
            </div>

            <div className="mt-6 bg-account-secondary-container/30 border border-account-secondary-container/50 p-4">
              <div className="flex gap-2">
                <Shield className="h-4 w-4 text-account-secondary shrink-0 mt-0.5" />
                <p className="text-xs text-account-on-surface-variant leading-relaxed">
                  Each piece is crafted with care. Our team is available for preservation guidance after delivery.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              {trackingHref && order.status !== "delivered" && (
                <a
                  href={trackingHref}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-account-primary text-white py-3.5 text-center text-[11px] font-semibold uppercase tracking-widest hover:opacity-90"
                >
                  Track Package Details
                </a>
              )}
              <Link
                href="/returns"
                className="w-full border border-account-primary text-account-primary py-3.5 text-center text-[11px] font-semibold uppercase tracking-widest hover:bg-account-surface-container transition-colors"
              >
                Return Policy
              </Link>
            </div>
          </div>
        </aside>
      </div>

      {/* Shipping & payment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-account-gutter">
        <section className="bg-account-surface-container-lowest border border-account-outline-variant/30 p-6 md:p-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-account-on-surface-variant mb-4">
            Shipping Address
          </p>
          <p className="font-serif text-lg text-account-primary mb-2">{order.shippingAddress.name}</p>
          <p className="text-sm text-account-on-surface-variant leading-relaxed">
            {order.shippingAddress.house && <>{order.shippingAddress.house}<br /></>}
            {order.shippingAddress.street}
            {order.shippingAddress.landmark && <><br />Near {order.shippingAddress.landmark}</>}
            <br />
            {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}
          </p>
          <p className="text-sm text-account-primary mt-3">{maskPhone(order.shippingAddress.phone)}</p>
        </section>

        <section className="bg-account-surface-container-lowest border border-account-outline-variant/30 p-6 md:p-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-account-on-surface-variant mb-4">
            Payment Method
          </p>
          <p className="font-serif text-lg text-account-primary">{paymentMethodLabel(order.paymentMethod)}</p>
          <p className="text-sm text-account-on-surface-variant mt-2 capitalize">{order.paymentStatus}</p>
          {order.razorpayPaymentId && (
            <p className="text-xs text-account-outline mt-2 font-mono">Ref: …{order.razorpayPaymentId.slice(-8)}</p>
          )}
          <div className="mt-4 p-3 bg-account-surface-container text-xs text-account-on-surface-variant">
            Billing address same as shipping address
          </div>
        </section>
      </div>
    </div>
  );
}
