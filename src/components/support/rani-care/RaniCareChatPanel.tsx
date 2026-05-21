"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Bot,
  ExternalLink,
  Mail,
  PhoneCall,
  RotateCcw,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RaniCareComposer } from "./RaniCareComposer";
import { RaniCareFab } from "./RaniCareFab";
import { RaniCareMessageRow } from "./RaniCareMessageRow";
import { RaniCareTypingIndicator } from "./RaniCareTypingIndicator";
import { STARTER_PROMPTS } from "./constants";
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
          type='button'
          aria-label='Close support chat'
          className={cn(
            "fixed inset-0 z-[94] bg-navy-900/25 backdrop-blur-[3px]",
            "animate-in fade-in duration-200 motion-reduce:animate-none",
            "lg:hidden",
          )}
          onClick={closePanel}
        />
      )}

      <div className='fixed right-3 sm:right-4 z-[95] flex flex-col items-end gap-1.5 sm:gap-2 bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] lg:bottom-5'>
        {open && (
          <div
            data-lenis-prevent
            data-rani-care
            role='dialog'
            aria-label='Rani Care support chat'
            aria-modal='true'
            className={cn(
              "w-[calc(100vw-1.25rem)] sm:w-[408px] max-w-[408px]",
              "h-[min(80vh,700px)] sm:h-[min(700px,80vh)]",
              "flex flex-col mb-3 overflow-hidden",
              "rounded-[1.35rem] border border-white/20",
              "bg-white/95 backdrop-blur-xl",
              "shadow-[0_24px_60px_-12px_rgba(20,25,47,0.35)]",
              isClosing ?
                "animate-rani-panel-out motion-reduce:animate-none"
              : "animate-rani-panel-in motion-reduce:animate-none",
            )}
          >
            <header
              className={cn(
                "shrink-0 text-white px-4 py-3 relative overflow-hidden",
                "bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900",
              )}
            >
              <div className='flex items-center justify-between gap-2'>
                <div className='flex items-center gap-2.5 min-w-0'>
                  <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-gold-300/30'>
                    <Sparkles className='h-4 w-4 text-gold-300' />
                  </span>
                  <div className='min-w-0'>
                    <p className='text-[10px] uppercase tracking-widest text-gold-300/90 font-semibold'>
                      Rani Care
                    </p>
                    <h3 className='text-sm font-bold truncate'>Support</h3>
                  </div>
                </div>
                <div className='flex items-center gap-1 shrink-0'>
                  <button
                    type='button'
                    onClick={() => setShowClearConfirm(true)}
                    className='h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 inline-flex items-center justify-center transition-colors'
                    aria-label='Clear chat'
                  >
                    <Trash2 className='h-3.5 w-3.5' />
                  </button>
                  <button
                    type='button'
                    onClick={closePanel}
                    className='h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 inline-flex items-center justify-center transition-colors'
                    aria-label='Close chat'
                  >
                    <X className='h-4 w-4' />
                  </button>
                </div>
              </div>
              <div className='mt-2 flex items-center gap-1.5 pl-[2.75rem]'>
                <span className='relative flex h-2 w-2 shrink-0'>
                  <span className='absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50 animate-ping motion-reduce:animate-none' />
                  <span className='relative h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30' />
                </span>
                <span className='text-[11px] text-white/85'>
                  Online · replies in seconds
                </span>
              </div>
            </header>

            {showClearConfirm && (
              <div
                className={cn(
                  "shrink-0 px-3 py-2.5 bg-amber-50 border-b border-amber-100",
                  "animate-in slide-in-from-top-2 duration-200 motion-reduce:animate-none",
                )}
              >
                <p className='text-amber-950 font-medium text-[13px]'>
                  Clear chat?
                </p>
                <div className='mt-2 flex gap-2'>
                  <button
                    type='button'
                    onClick={() => clearChat(true)}
                    className='text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-900 text-white hover:bg-amber-950'
                  >
                    Clear
                  </button>
                  <button
                    type='button'
                    onClick={() => setShowClearConfirm(false)}
                    className='text-xs px-3 py-1.5 rounded-lg border border-amber-200 text-amber-900 hover:bg-amber-100/80'
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div
              ref={scrollRef}
              className='flex-1 min-h-0 overflow-y-auto overscroll-y-contain touch-pan-y px-3 py-3 bg-[#f4f6fa] scrollbar-hide'
            >
              <div className='space-y-3'>
                {messages.length === 0 && !typing && (
                  <div
                    className={cn(
                      "rounded-2xl border border-dashed border-gray-300/80 bg-white px-4 py-4 text-center",
                      "animate-rani-msg-bot motion-reduce:animate-none",
                    )}
                  >
                    <div className='mx-auto h-10 w-10 rounded-xl bg-brand-50 flex items-center justify-center mb-2'>
                      <Bot className='h-5 w-5 text-brand-600' />
                    </div>
                    <p className='text-sm font-semibold text-gray-800'>
                      What do you need?
                    </p>
                    <div className='mt-3 flex flex-wrap justify-center gap-1.5'>
                      {STARTER_PROMPTS.map((s, i) => (
                        <button
                          key={s.value}
                          type='button'
                          onClick={() => void handleAction(s.value)}
                          className='text-xs px-2.5 py-1.5 rounded-full font-medium border border-brand-200/80 text-brand-700 bg-brand-50 hover:bg-brand-100 transition-colors'
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

                <div ref={endRef} className='h-px shrink-0' aria-hidden />
              </div>
            </div>

            <footer className='shrink-0 px-3 py-2.5 border-t border-gray-200/90 bg-white'>
              <RaniCareComposer
                input={input}
                setInput={setInput}
                onSend={submitUserText}
                disabled={composerBusy}
                focusOnMount={open}
              />
              <div className='mt-2 flex items-center justify-end gap-3 text-[10px] text-gray-400'>
                <button
                  type='button'
                  onClick={() => setShowClearConfirm(true)}
                  className='inline-flex items-center gap-0.5 hover:text-gray-600'
                >
                  <RotateCcw className='h-3 w-3' />
                  Clear
                </button>
                <Link
                  href='/dashboard/orders'
                  className='inline-flex items-center gap-0.5 text-brand-600 hover:text-brand-700 font-medium'
                >
                  Orders <ExternalLink className='h-3 w-3' />
                </Link>
              </div>
            </footer>
          </div>
        )}

        {!open && <RaniCareFab onOpen={() => setOpen(true)} />}

        {open && (
          <div className='mt-2 flex items-center justify-between px-1 text-xs text-gray-500 max-w-[408px] w-full'>
            <div className='flex items-center gap-3'>
              <a
                className='inline-flex items-center gap-1 hover:text-brand-700'
                href={`tel:${contactPhone.replace(/\s+/g, "")}`}
              >
                <PhoneCall className='h-3.5 w-3.5' /> Call
              </a>
              <a
                className='inline-flex items-center gap-1 hover:text-brand-700'
                href={`mailto:${contactEmail}`}
              >
                <Mail className='h-3.5 w-3.5' /> Email
              </a>
            </div>
            <Link className='hover:text-brand-700' href='/privacy'>
              Privacy
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
