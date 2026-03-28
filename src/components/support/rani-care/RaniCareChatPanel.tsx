"use client";

import Link from "next/link";
import {
  MessageCircle,
  Send,
  Sparkles,
  X,
  Bot,
  UserRound,
  PhoneCall,
  Mail,
  ArrowRight,
  Loader2,
  Package,
  Truck,
  Ban,
  ExternalLink,
} from "lucide-react";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import type { ChatMessage } from "./types";
import { useRaniCareChat } from "./useRaniCareChat";

type ChatProps = ReturnType<typeof useRaniCareChat>;

export function RaniCareChatPanel(props: ChatProps) {
  const {
    open,
    setOpen,
    typing,
    loadingOrders,
    input,
    setInput,
    messages,
    endRef,
    contactPhone,
    contactEmail,
    handleAction,
    submitUserText,
  } = props;

  return (
    <div className="fixed right-4 z-[95] flex flex-col items-end gap-2 bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] lg:bottom-6 sm:right-6">
      {open && (
        <div className="w-[calc(100vw-2rem)] sm:w-[400px] max-w-[400px] h-[76vh] sm:h-[660px] bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden mb-3 animate-fadeIn flex flex-col">
          <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900 text-white px-4 py-3.5 shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-gold-300 font-semibold">Customer support</p>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-gold-300" />
                  RaniCare
                </h3>
                <p className="text-xs text-white/75 mt-0.5">Orders, delivery, and account help</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 inline-flex items-center justify-center transition-colors"
                aria-label="Close support chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 bg-[#f7f8fb]">
            <div className="space-y-3">
              {messages.map((message: ChatMessage) => (
                <div
                  key={message.id}
                  className={cn("flex gap-2", message.sender === "user" ? "justify-end" : "justify-start")}
                >
                  {message.sender === "bot" && (
                    <div className="h-8 w-8 rounded-full bg-navy-900 text-gold-300 shrink-0 flex items-center justify-center">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-line",
                      message.sender === "user"
                        ? "bg-brand-600 text-white rounded-br-md"
                        : "bg-white text-gray-700 border border-gray-200 rounded-bl-md shadow-sm",
                    )}
                  >
                    {message.text}

                    {message.sender === "bot" && message.orders && message.orders.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.orders.map((o) => (
                          <div
                            key={o.id}
                            className="rounded-xl border border-gray-100 bg-gray-50/80 p-2.5 text-left"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-xs font-bold text-navy-900 flex items-center gap-1">
                                  <Package className="h-3.5 w-3.5 text-brand-600" />
                                  {o.orderNumber}
                                </p>
                                <p className="text-[11px] text-gray-500 mt-0.5">
                                  {formatDate(o.createdAt)} · {formatPrice(o.total)}
                                </p>
                              </div>
                              <span
                                className={cn(
                                  "text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-md shrink-0",
                                  o.status === "delivered" && "bg-green-100 text-green-800",
                                  o.status === "shipped" && "bg-indigo-100 text-indigo-800",
                                  (o.status === "pending" || o.status === "confirmed") && "bg-amber-100 text-amber-900",
                                  (o.status === "cancelled" || o.status === "refunded") && "bg-gray-200 text-gray-700",
                                )}
                              >
                                {o.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-600 mt-1.5 line-clamp-2">{o.preview}</p>
                            {o.trackingNumber && (
                              <p className="text-[11px] text-brand-700 mt-1 flex items-center gap-1">
                                <Truck className="h-3 w-3" />
                                {o.trackingNumber}
                              </p>
                            )}
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                onClick={() => void handleAction(`order_pick:${o.id}`)}
                                className="text-[11px] px-2.5 py-1 rounded-lg bg-navy-900 text-white hover:bg-navy-800 transition-colors"
                              >
                                Details
                              </button>
                              {o.canCancel ? (
                                <button
                                  type="button"
                                  onClick={() => void handleAction(`cancel_ask:${o.id}`)}
                                  className="text-[11px] px-2.5 py-1 rounded-lg border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 inline-flex items-center gap-1"
                                >
                                  <Ban className="h-3 w-3" />
                                  Cancel
                                </button>
                              ) : (
                                <span className="text-[10px] text-gray-400 self-center">Not cancellable</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {message.actions && message.actions.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {message.actions.map((action) => (
                          <button
                            key={`${message.id}_${action.value}`}
                            onClick={() => void handleAction(action.value)}
                            className="text-xs px-2.5 py-1.5 rounded-full border border-brand-200 text-brand-700 bg-brand-50 hover:bg-brand-100 transition-colors"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {message.sender === "user" && (
                    <div className="h-8 w-8 rounded-full bg-gray-200 text-gray-600 shrink-0 flex items-center justify-center">
                      <UserRound className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}

              {(typing || loadingOrders) && (
                <div className="flex gap-2">
                  <div className="h-8 w-8 rounded-full bg-navy-900 text-gold-300 shrink-0 flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-3 py-2 text-sm text-gray-500 inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {loadingOrders ? "Loading orders…" : "Preparing a reply…"}
                  </div>
                </div>
              )}

              <div ref={endRef} />
            </div>
          </div>

          <div className="shrink-0 px-3 py-2.5 border-t border-gray-200 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void submitUserText(input);
              }}
              className="flex items-end gap-2"
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message or order number"
                rows={1}
                maxLength={500}
                className="w-full resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 max-h-24"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void submitUserText(input);
                  }
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || typing || loadingOrders}
                className="h-10 w-10 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white inline-flex items-center justify-center transition-colors"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400">
              <span className="hidden sm:inline">Enter to send · Shift+Enter for a new line</span>
              <span className="sm:hidden">Enter sends</span>
              <Link
                href="/dashboard/orders"
                className="inline-flex items-center gap-0.5 text-brand-600 hover:text-brand-700 font-medium"
              >
                Orders <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {!open && (
        <div className="flex flex-col items-end gap-2 w-fit ml-auto">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-600 to-brand-700 text-white shadow-xl hover:scale-105 active:scale-95 transition-transform inline-flex items-center justify-center"
              aria-label="Open customer support"
            >
              <MessageCircle className="h-7 w-7 sm:h-8 sm:w-8" />
            </button>
            <span
              className="absolute top-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm ring-1 ring-white/90"
              title="Support chat"
              aria-hidden
            />
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-1.5 shadow-md text-xs text-gray-600 max-w-[280px]">
            <Sparkles className="h-3.5 w-3.5 text-brand-600 shrink-0" />
            <span className="leading-snug">Orders &amp; support</span>
            <ArrowRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          </div>
        </div>
      )}

      {open && (
        <div className="mt-2 flex items-center justify-between px-1 text-xs text-gray-500 max-w-[400px]">
          <div className="flex items-center gap-3">
            <a
              className="inline-flex items-center gap-1 hover:text-brand-700 transition-colors"
              href={`tel:${contactPhone.replace(/\s+/g, "")}`}
            >
              <PhoneCall className="h-3.5 w-3.5" /> Call
            </a>
            <a
              className="inline-flex items-center gap-1 hover:text-brand-700 transition-colors"
              href={`mailto:${contactEmail}`}
            >
              <Mail className="h-3.5 w-3.5" /> Email
            </a>
          </div>
          <Link className="hover:text-brand-700 transition-colors" href="/privacy">
            Privacy
          </Link>
        </div>
      )}
    </div>
  );
}
