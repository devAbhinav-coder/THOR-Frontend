"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Ban,
  Bot,
  Package,
  Star,
  Truck,
  UserRound,
} from "lucide-react";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import { ChatMessageBody } from "./ChatMessageBody";
import { formatChatTime } from "./formatChat";
import {
  raniActionChip,
  raniAvatarBot,
  raniAvatarUser,
  raniBotBubble,
  raniUserBubble,
} from "./raniCareHeritageTheme";
import type { ChatMessage } from "./types";

type Props = {
  message: ChatMessage;
  isNew: boolean;
  staggerIndex: number;
  onAction: (value: string) => void;
};

function statusClass(status: string) {
  if (status === "delivered") return "border-[#c5a059]/40 bg-[#c5a059]/10 text-navy-900";
  if (status === "shipped") return "border-navy-900/20 bg-navy-900/5 text-navy-900";
  if (status === "pending" || status === "confirmed") {
    return "border-gray-300 bg-gray-50 text-gray-700";
  }
  return "border-gray-200 bg-gray-100 text-gray-600";
}

function discountPercent(price: number, compare?: number): number | null {
  if (!compare || compare <= price || price <= 0) return null;
  return Math.round(((compare - price) / compare) * 100);
}

export function RaniCareMessageRow({
  message,
  isNew,
  staggerIndex,
  onAction,
}: Props) {
  const isUser = message.sender === "user";
  const animClass =
    isUser ?
      "animate-rani-msg-user motion-reduce:animate-none"
    : "animate-rani-msg-bot motion-reduce:animate-none";

  return (
    <div
      className={cn("flex gap-2", isUser ? "justify-end" : "justify-start", isNew && animClass)}
      style={isNew ? { animationDelay: `${Math.min(staggerIndex * 45, 180)}ms` } : undefined}
    >
      {!isUser && (
        <div className={raniAvatarBot}>
          <Bot className="h-4 w-4" />
        </div>
      )}

      <div
        className={cn(
          "flex min-w-0 max-w-[88%] flex-col",
          isUser ? "items-end" : "items-start",
        )}
      >
        <div className={isUser ? raniUserBubble : raniBotBubble}>
          <ChatMessageBody text={message.text} variant={isUser ? "user" : "bot"} />

          {!isUser && message.orders && message.orders.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.orders.map((o, oi) => (
                <div
                  key={o.id}
                  className={cn(
                    "border border-gray-200 bg-[#f8f9fa] p-2.5 text-left transition-colors hover:border-[#c5a059]/35",
                    isNew && "animate-rani-msg-bot motion-reduce:animate-none",
                  )}
                  style={
                    isNew ?
                      { animationDelay: `${Math.min(staggerIndex * 45 + oi * 60, 280)}ms` }
                    : undefined
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="flex items-center gap-1 text-xs font-bold text-navy-900">
                        <Package className="h-3.5 w-3.5 text-[#c5a059]" />
                        {o.orderNumber}
                      </p>
                      <p className="mt-0.5 text-[11px] text-gray-500">
                        {formatDate(o.createdAt)} · {formatPrice(o.total)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        statusClass(o.status),
                      )}
                    >
                      {o.status}
                    </span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-[11px] text-gray-600">{o.preview}</p>
                  {o.trackingNumber && (
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-[#c5a059]">
                      <Truck className="h-3 w-3" />
                      {o.trackingNumber}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => void onAction(`order_pick:${o.id}`)}
                      className="bg-navy-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-navy-800 active:scale-[0.98]"
                    >
                      Details
                    </button>
                    {o.canCancel ?
                      <button
                        type="button"
                        onClick={() => void onAction(`cancel_ask:${o.id}`)}
                        className="inline-flex items-center gap-1 border border-gray-300 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-navy-900 transition-colors hover:border-[#c5a059]/50 active:scale-[0.98]"
                      >
                        <Ban className="h-3 w-3" />
                        Cancel
                      </button>
                    : <span className="self-center text-[10px] text-gray-400">
                        Not cancellable
                      </span>
                    }
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isUser && message.products && message.products.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {message.products.map((p, pi) => {
                const discount = discountPercent(p.priceInr, p.comparePriceInr);
                return (
                  <Link
                    key={p.slug}
                    href={`/shop/${p.slug}`}
                    className={cn(
                      "group flex flex-col overflow-hidden border border-gray-200 bg-white shadow-[0_2px_10px_rgba(20,25,47,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#c5a059]/60 hover:shadow-[0_8px_22px_rgba(20,25,47,0.12)]",
                      isNew && "animate-rani-msg-bot motion-reduce:animate-none",
                    )}
                    style={
                      isNew ?
                        { animationDelay: `${Math.min(staggerIndex * 45 + pi * 60, 280)}ms` }
                      : undefined
                    }
                  >
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#f4f1eb]">
                      {p.image ?
                        <Image
                          src={p.image}
                          alt={p.name}
                          fill
                          sizes="(max-width: 640px) 44vw, 180px"
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        />
                      : <div className="flex h-full flex-col items-center justify-center gap-1 text-gray-400">
                          <Package className="h-6 w-6" />
                          <span className="text-[9px] uppercase tracking-wider">
                            Image unavailable
                          </span>
                        </div>
                      }
                      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-navy-900/30 to-transparent" />
                      {discount && (
                        <span className="absolute left-1.5 top-1.5 bg-[#c5a059] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm">
                          {discount}% off
                        </span>
                      )}
                      {!p.inStock && (
                        <span className="absolute right-1.5 top-1.5 bg-navy-900/90 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
                          Sold out
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-2.5">
                      {(p.category || p.fabric) && (
                        <p className="mb-1 truncate text-[9px] font-semibold uppercase tracking-[0.12em] text-[#a7823d]">
                          {[p.category, p.fabric].filter(Boolean).join(" · ")}
                        </p>
                      )}
                      <p className="line-clamp-2 font-serif text-[12px] font-semibold leading-snug text-navy-900">
                        {p.name}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                        <span className="text-xs font-bold text-navy-900">
                          {formatPrice(p.priceInr)}
                        </span>
                        {p.comparePriceInr && (
                          <span className="text-[10px] text-gray-400 line-through">
                            {formatPrice(p.comparePriceInr)}
                          </span>
                        )}
                        {p.rating ? (
                          <span className="ml-auto inline-flex items-center gap-0.5 text-[10px] font-medium text-[#a7823d]">
                            <Star className="h-2.5 w-2.5 fill-current" />
                            {p.rating}
                          </span>
                        ) : null}
                      </div>
                      <span className="mt-2 flex items-center justify-between border-t border-gray-100 pt-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-navy-900 transition-colors group-hover:text-[#a7823d]">
                        View product
                        <ArrowUpRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {message.actions && message.actions.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {message.actions.map((action) => (
                <button
                  key={`${message.id}_${action.value}`}
                  type="button"
                  onClick={() => void onAction(action.value)}
                  className={raniActionChip}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <p
          className={cn(
            "mt-0.5 px-1 text-[10px] tabular-nums text-gray-400",
            isUser ? "text-right" : "text-left",
          )}
        >
          {formatChatTime(message.timestamp)}
        </p>
      </div>

      {isUser && (
        <div className={raniAvatarUser}>
          <UserRound className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
