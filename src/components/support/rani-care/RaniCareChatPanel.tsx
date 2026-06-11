"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Bot,
  ExternalLink,
  Mail,
  PhoneCall,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RaniCareComposer } from "./RaniCareComposer";
import { RaniCareFab } from "./RaniCareFab";
import { RaniCareMessageRow } from "./RaniCareMessageRow";
import { RaniCareTypingIndicator } from "./RaniCareTypingIndicator";
import { STARTER_PROMPTS } from "./constants";
import {
  raniBodyBg,
  raniChip,
  raniEyebrow,
  raniHeader,
  raniHeaderAccent,
  raniHeaderBtn,
  raniIconBox,
  raniPanel,
} from "./raniCareHeritageTheme";
import { useChatScroll } from "./useChatScroll";
import { useNewMessageIds } from "./useNewMessageIds";
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
    contactPhone,
    contactEmail,
    handleAction,
    submitUserText,
    showClearConfirm,
    setShowClearConfirm,
    clearChat,
  } = props;

  const [isClosing, setIsClosing] = useState(false);
  const isNewMessage = useNewMessageIds(messages);
  const composerBusy = typing || loadingOrders;

  const { scrollRef, endRef } = useChatScroll(open, {
    messageCount: messages.length,
    typing,
    loadingOrders,
  });

  const closePanel = () => {
    setIsClosing(true);
    window.setTimeout(() => {
      setOpen(false);
      setIsClosing(false);
    }, 200);
  };

  let newStagger = 0;

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close support chat"
          className={cn(
            "fixed inset-0 z-[94] bg-[#14192f]/40 backdrop-blur-[6px]",
            "animate-in fade-in duration-200 motion-reduce:animate-none lg:hidden",
          )}
          onClick={closePanel}
        />
      )}

      <div className="fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] right-3 z-[95] flex flex-col items-end gap-1.5 sm:bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] sm:right-4 sm:gap-2 lg:bottom-5">
        {open && (
          <div
            data-lenis-prevent
            data-rani-care
            role="dialog"
            aria-label="Rani Care support chat"
            aria-modal="true"
            className={cn(
              raniPanel,
              "mb-3 flex h-[min(80vh,700px)] w-[calc(100vw-1.25rem)] max-w-[408px] flex-col sm:h-[min(700px,80vh)] sm:w-[408px]",
              isClosing ?
                "animate-rani-panel-out motion-reduce:animate-none"
              : "animate-rani-panel-in motion-reduce:animate-none",
            )}
          >
            <header className={raniHeader}>
              <span className={raniHeaderAccent} aria-hidden />
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className={raniIconBox}>
                    <Bot className="h-4 w-4 text-[#c5a059]" />
                  </span>
                  <div className="min-w-0">
                    <p className={raniEyebrow}>Rani Care</p>
                    <h3 className="truncate font-serif text-sm font-semibold text-white">
                      Heritage Concierge
                    </h3>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    className={raniHeaderBtn}
                    aria-label="Clear chat"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={closePanel}
                    className={raniHeaderBtn}
                    aria-label="Close chat"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1.5 pl-[2.75rem]">
                <span className="h-2 w-2 shrink-0 bg-[#c5a059]" aria-hidden />
                <span className="text-[11px] uppercase tracking-[0.14em] text-white/75">
                  Online · replies in seconds
                </span>
              </div>
            </header>

            {showClearConfirm && (
              <div
                className={cn(
                  "shrink-0 border-b border-gray-200 bg-white px-3 py-2.5",
                  "animate-in slide-in-from-top-2 duration-200 motion-reduce:animate-none",
                )}
              >
                <p className="text-[13px] font-medium text-navy-900">Clear this conversation?</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => clearChat(true)}
                    className="bg-navy-900 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-navy-800"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    className="border border-gray-300 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-900 transition-colors hover:border-[#c5a059]/50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div
              ref={scrollRef}
              className={cn(
                "flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-3 py-3 scrollbar-hide touch-pan-y",
                raniBodyBg,
              )}
            >
              <div className="space-y-3">
                {messages.length === 0 && !typing && (
                  <div
                    className={cn(
                      "border border-dashed border-gray-300 bg-white px-4 py-4 text-center",
                      "animate-rani-msg-bot motion-reduce:animate-none",
                    )}
                  >
                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center border border-[#c5a059]/30 bg-[#f8f9fa]">
                      <Bot className="h-5 w-5 text-[#c5a059]" />
                    </div>
                    <p className="font-serif text-sm font-semibold text-navy-900">
                      How may we assist you?
                    </p>
                    <p className="mt-1 text-[11px] text-gray-500">
                      Orders, delivery, returns, or styling guidance.
                    </p>
                    <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                      {STARTER_PROMPTS.map((s, i) => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => void handleAction(s.value)}
                          className={raniChip}
                          style={{ animationDelay: `${80 + i * 40}ms` }}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((message) => {
                  const isNew = isNewMessage(message.id);
                  const stagger = isNew ? newStagger++ : 0;
                  return (
                    <RaniCareMessageRow
                      key={message.id}
                      message={message}
                      isNew={isNew}
                      staggerIndex={stagger}
                      onAction={handleAction}
                    />
                  );
                })}

                {(typing || loadingOrders) && (
                  <RaniCareTypingIndicator loadingOrders={loadingOrders} />
                )}

                <div ref={endRef} className="h-px shrink-0" aria-hidden />
              </div>
            </div>

            <footer className="shrink-0 border-t border-gray-200 bg-white px-3 py-2.5">
              <RaniCareComposer
                input={input}
                setInput={setInput}
                onSend={submitUserText}
                disabled={composerBusy}
                focusOnMount={open}
              />
              <div className="mt-2 flex items-center justify-end gap-3 text-[10px] uppercase tracking-[0.12em] text-gray-400">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="inline-flex items-center gap-0.5 transition-colors hover:text-navy-900"
                >
                  <RotateCcw className="h-3 w-3" />
                  Clear
                </button>
                <Link
                  href="/dashboard/orders"
                  className="inline-flex items-center gap-0.5 font-semibold text-[#c5a059] transition-colors hover:text-[#b8924d]"
                >
                  Orders <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </footer>
          </div>
        )}

        {!open && <RaniCareFab onOpen={() => setOpen(true)} />}

        {open && (
          <div className="mt-2 flex w-full max-w-[408px] items-center justify-between px-1 text-[10px] uppercase tracking-[0.12em] text-gray-500">
            <div className="flex items-center gap-3">
              <a
                className="inline-flex items-center gap-1 transition-colors hover:text-[#c5a059]"
                href={`tel:${contactPhone.replace(/\s+/g, "")}`}
              >
                <PhoneCall className="h-3.5 w-3.5" /> Call
              </a>
              <a
                className="inline-flex items-center gap-1 transition-colors hover:text-[#c5a059]"
                href={`mailto:${contactEmail}`}
              >
                <Mail className="h-3.5 w-3.5" /> Email
              </a>
            </div>
            <Link className="transition-colors hover:text-[#c5a059]" href="/privacy">
              Privacy
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
