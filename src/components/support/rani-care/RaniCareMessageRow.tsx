"use client";

import { Ban, Bot, Package, Truck, UserRound } from "lucide-react";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import { ChatMessageBody } from "./ChatMessageBody";
import { formatChatTime } from "./formatChat";
import type { ChatMessage } from "./types";

type Props = {
  message: ChatMessage;
  isNew: boolean;
  staggerIndex: number;
  onAction: (value: string) => void;
};

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
        <div className='h-8 w-8 rounded-full bg-gradient-to-br from-navy-900 to-navy-800 text-gold-300 shrink-0 flex items-center justify-center shadow-md ring-1 ring-gold-300/20'>
          <Bot className='h-4 w-4' />
        </div>
      )}

      <div
        className={cn(
          "max-w-[88%] min-w-0 flex flex-col",
          isUser ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-line transition-shadow duration-200",
            isUser ?
              "bg-gradient-to-br from-brand-600 to-brand-700 text-white rounded-br-md shadow-md shadow-brand-600/25"
            : "bg-white/95 backdrop-blur-sm text-gray-700 border border-gray-200/80 rounded-bl-md shadow-sm hover:shadow-md",
          )}
        >
          <ChatMessageBody text={message.text} variant={isUser ? "user" : "bot"} />

          {!isUser && message.orders && message.orders.length > 0 && (
            <div className='mt-3 space-y-2'>
              {message.orders.map((o, oi) => (
                <div
                  key={o.id}
                  className={cn(
                    "rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-2.5 text-left",
                    "hover:border-brand-100 hover:shadow-sm transition-all duration-200",
                    isNew && "animate-rani-msg-bot motion-reduce:animate-none",
                  )}
                  style={
                    isNew ?
                      { animationDelay: `${Math.min(staggerIndex * 45 + oi * 60, 280)}ms` }
                    : undefined
                  }
                >
                  <div className='flex items-start justify-between gap-2'>
                    <div>
                      <p className='text-xs font-bold text-navy-900 flex items-center gap-1'>
                        <Package className='h-3.5 w-3.5 text-brand-600' />
                        {o.orderNumber}
                      </p>
                      <p className='text-[11px] text-gray-500 mt-0.5'>
                        {formatDate(o.createdAt)} · {formatPrice(o.total)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-md shrink-0",
                        o.status === "delivered" && "bg-green-100 text-green-800",
                        o.status === "shipped" && "bg-indigo-100 text-indigo-800",
                        (o.status === "pending" || o.status === "confirmed") &&
                          "bg-amber-100 text-amber-900",
                        (o.status === "cancelled" || o.status === "refunded") &&
                          "bg-gray-200 text-gray-700",
                      )}
                    >
                      {o.status}
                    </span>
                  </div>
                  <p className='text-[11px] text-gray-600 mt-1.5 line-clamp-2'>{o.preview}</p>
                  {o.trackingNumber && (
                    <p className='text-[11px] text-brand-700 mt-1 flex items-center gap-1'>
                      <Truck className='h-3 w-3' />
                      {o.trackingNumber}
                    </p>
                  )}
                  <div className='mt-2 flex flex-wrap gap-1.5'>
                    <button
                      type='button'
                      onClick={() => void onAction(`order_pick:${o.id}`)}
                      className='text-[11px] px-2.5 py-1 rounded-lg bg-navy-900 text-white hover:bg-navy-800 active:scale-[0.98] transition-all'
                    >
                      Details
                    </button>
                    {o.canCancel ?
                      <button
                        type='button'
                        onClick={() => void onAction(`cancel_ask:${o.id}`)}
                        className='text-[11px] px-2.5 py-1 rounded-lg border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 inline-flex items-center gap-1 active:scale-[0.98] transition-all'
                      >
                        <Ban className='h-3 w-3' />
                        Cancel
                      </button>
                    : <span className='text-[10px] text-gray-400 self-center'>
                        Not cancellable
                      </span>
                    }
                  </div>
                </div>
              ))}
            </div>
          )}

          {message.actions && message.actions.length > 0 && (
            <div className='mt-2.5 flex flex-wrap gap-1.5'>
              {message.actions.map((action) => (
                <button
                  key={`${message.id}_${action.value}`}
                  type='button'
                  onClick={() => void onAction(action.value)}
                  className={cn(
                    "text-xs px-2.5 py-1.5 rounded-full font-medium",
                    "border border-brand-200/90 text-brand-700 bg-brand-50/90",
                    "hover:bg-brand-100 hover:border-brand-300 hover:shadow-sm",
                    "active:scale-[0.97] transition-all duration-150",
                  )}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <p
          className={cn(
            "mt-0.5 px-1 text-[10px] text-gray-400 tabular-nums",
            isUser ? "text-right" : "text-left",
          )}
        >
          {formatChatTime(message.timestamp)}
        </p>
      </div>

      {isUser && (
        <div className='h-8 w-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 shrink-0 flex items-center justify-center ring-1 ring-gray-200/80'>
          <UserRound className='h-4 w-4' />
        </div>
      )}
    </div>
  );
}
