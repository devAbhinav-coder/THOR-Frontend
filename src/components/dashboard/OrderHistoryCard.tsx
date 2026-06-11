"use client";

import Image from "next/image";
import Link from "next/link";
import { Download, Star } from "lucide-react";
import { Order } from "@/types";
import { formatPrice, formatDate, cn } from "@/lib/utils";
import {
  getOrderStatusLabel,
  getOrderStatusBadgeClass,
  getPrimaryProductName,
  getProductShopHref,
  CANCELLABLE_ORDER_STATUSES,
} from "@/lib/accountOrderStyles";

type Props = {
  order: Order;
  onCancelClick?: (orderId: string) => void;
};

export default function OrderHistoryCard({ order, onCancelClick }: Props) {
  const isDelivered = order.status === "delivered";
  const isShipped = order.status === "shipped";
  const isCancellable = CANCELLABLE_ORDER_STATUSES.includes(
    order.status as (typeof CANCELLABLE_ORDER_STATUSES)[number],
  );
  const primaryItem = order.items[0];
  const orderHref = `/dashboard/orders/${encodeURIComponent(order._id)}`;
  const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);

  const stopNav = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <article
      className="bg-account-surface-container-lowest border border-account-outline-variant/20 shadow-account-paper overflow-hidden group hover:shadow-md transition-shadow duration-300"
    >
      <div className="grid grid-cols-12 md:min-h-[256px]">
        {/* Product image */}
        <div className="col-span-12 md:col-span-3 overflow-hidden relative min-h-[200px] md:min-h-0">
          {primaryItem?.image ?
            <Image
              src={primaryItem.image}
              alt={primaryItem.name}
              fill
              sizes="(max-width: 768px) 100vw, 320px"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          : <div className="w-full h-full bg-account-surface-variant" />}
          <div className="absolute top-4 left-4">
            <span
              className={cn(
                "px-3 py-1 text-[11px] font-semibold uppercase tracking-widest",
                getOrderStatusBadgeClass(order.status),
              )}
            >
              {getOrderStatusLabel(order.status)}
            </span>
          </div>
        </div>

        {/* Order details */}
        <div className="col-span-12 md:col-span-6 p-6 md:p-8 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2 gap-4">
              <span className="text-[11px] font-semibold text-account-outline uppercase tracking-tight">
                Order #{order.orderNumber}
              </span>
              <span className="text-sm text-account-on-surface-variant shrink-0">
                {formatDate(order.createdAt)}
              </span>
            </div>
            <h3 className="font-serif text-xl text-account-primary mb-2 italic">
              {getPrimaryProductName(order.items)}
            </h3>
            {primaryItem && (
              <p className="text-account-on-surface-variant text-sm line-clamp-2">
                {order.items.length > 1 ?
                  `${order.items.length} pieces from your collection`
                : primaryItem.name}
              </p>
            )}
          </div>
          <div className="mt-4 flex items-center gap-6">
            <div>
              <p className="text-[11px] font-semibold text-account-outline uppercase">
                Total Amount
              </p>
              <p className="text-lg font-bold text-account-primary">
                {formatPrice(order.total)}
              </p>
            </div>
            <div className="h-8 w-px bg-account-outline-variant/30" />
            <div>
              <p className="text-[11px] font-semibold text-account-outline uppercase">
                Items
              </p>
              <p className="text-lg text-account-primary">
                {itemCount} {itemCount === 1 ? "Piece" : "Pieces"}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="col-span-12 md:col-span-3 bg-account-surface-container-low/50 p-6 md:p-8 flex flex-col justify-center gap-3 border-t md:border-t-0 md:border-l border-account-outline-variant/30">
          {isShipped && (
            <Link
              href={orderHref}
              onClick={stopNav}
              className="w-full bg-account-primary text-white py-3 text-[11px] font-semibold uppercase tracking-widest text-center hover:bg-navy-800 transition-colors"
            >
              Track Order
            </Link>
          )}

          <Link
            href={orderHref}
            onClick={stopNav}
            className="w-full border border-account-primary text-account-primary py-3 text-[11px] font-semibold uppercase tracking-widest text-center hover:bg-account-secondary-container/10 transition-colors"
          >
            View Details
          </Link>

          {isDelivered && (
            <>
              <Link
                href={`${orderHref}#review`}
                onClick={stopNav}
                className="w-full flex items-center justify-center gap-2 border border-account-secondary text-account-secondary py-3 text-[11px] font-semibold uppercase tracking-widest hover:bg-account-secondary-container/20 transition-colors"
              >
                <Star className="h-4 w-4" />
                Write Review
              </Link>
              <Link
                href={getProductShopHref(primaryItem?.product ?? "/shop")}
                onClick={stopNav}
                className="w-full border border-account-outline text-account-outline py-3 text-[11px] font-semibold uppercase tracking-widest text-center hover:bg-account-surface-variant transition-colors"
              >
                Buy Again
              </Link>
            </>
          )}

          {isCancellable && onCancelClick && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCancelClick(order._id);
              }}
              className="w-full border border-account-outline text-account-outline py-3 text-[11px] font-semibold uppercase tracking-widest hover:text-red-600 hover:border-red-400 transition-colors"
            >
              Cancel Order
            </button>
          )}

          <Link
            href={`/dashboard/orders/${encodeURIComponent(order._id)}/invoice`}
            onClick={stopNav}
            className="flex items-center justify-center gap-2 text-account-on-surface-variant text-[11px] font-semibold uppercase hover:text-account-secondary transition-colors mt-1"
          >
            <Download className="h-4 w-4" />
            Invoice
          </Link>
        </div>
      </div>
    </article>
  );
}
