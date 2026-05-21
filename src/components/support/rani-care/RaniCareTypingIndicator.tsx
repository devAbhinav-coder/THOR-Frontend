"use client";

import { Bot, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function TypingDots() {
  return (
    <span className='inline-flex gap-1 items-center h-4' aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className='h-1.5 w-1.5 rounded-full bg-brand-400/80 animate-bounce motion-reduce:animate-none'
          style={{ animationDelay: `${i * 140}ms`, animationDuration: "0.9s" }}
        />
      ))}
    </span>
  );
}

type Props = {
  loadingOrders: boolean;
  animate?: boolean;
};

export function RaniCareTypingIndicator({ loadingOrders, animate = true }: Props) {
  return (
    <div
      className={cn(
        "flex gap-2",
        animate && "animate-rani-msg-bot motion-reduce:animate-none",
      )}
    >
      <div className='h-8 w-8 rounded-full bg-gradient-to-br from-navy-900 to-navy-800 text-gold-300 shrink-0 flex items-center justify-center shadow-md ring-1 ring-white/10'>
        <Bot className='h-4 w-4' />
      </div>
      <div className='bg-white/95 backdrop-blur-sm border border-gray-200/80 rounded-2xl rounded-bl-md px-3.5 py-2.5 text-sm text-gray-500 inline-flex items-center gap-2.5 shadow-sm min-w-[120px]'>
        {loadingOrders ?
          <>
            <Loader2 className='h-4 w-4 animate-spin text-brand-600 motion-reduce:animate-none' />
            <span className='text-[13px]'>Fetching your orders…</span>
          </>
        : <TypingDots />
        }
      </div>
    </div>
  );
}
