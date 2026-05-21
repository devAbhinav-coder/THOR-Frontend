"use client";

import { ArrowRight, MessageCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  onOpen: () => void;
};

export function RaniCareFab({ onOpen }: Props) {
  return (
    <div className='flex flex-col items-end gap-2 w-fit ml-auto motion-reduce:transition-none'>
      <div className='relative w-12 h-12 sm:w-14 sm:h-14 shrink-0'>
        <span
          className='pointer-events-none absolute inset-0 rounded-full border-2 border-brand-500/40 animate-rani-fab-ring motion-reduce:animate-none'
          aria-hidden
        />
        <button
          type='button'
          onClick={onOpen}
          className={cn(
            "absolute inset-0 rounded-full text-white shadow-xl",
            "bg-gradient-to-br from-brand-600 via-brand-600 to-brand-700",
            "hover:scale-105 hover:shadow-2xl hover:shadow-brand-600/25",
            "active:scale-95 transition-all duration-200",
            "inline-flex items-center justify-center",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
          )}
          aria-label='Open customer support chat'
        >
          <MessageCircle className='h-6 w-6 sm:h-7 sm:w-7' />
        </button>
        <span
          className='absolute top-0 right-0 h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm animate-rani-online motion-reduce:animate-none'
          title='Support online'
          aria-hidden
        />
      </div>
      <button
        type='button'
        onClick={onOpen}
        className={cn(
          "hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1.5",
          "bg-white/95 backdrop-blur-sm border border-gray-200/90 shadow-md",
          "text-[11px] text-gray-600 max-w-[260px]",
          "hover:border-brand-200 hover:shadow-lg hover:text-brand-800",
          "transition-all duration-200 group",
        )}
      >
        <Sparkles className='h-3 w-3 text-brand-600 shrink-0 group-hover:rotate-12 transition-transform duration-300' />
        <span className='leading-snug font-medium'>Support</span>
        <ArrowRight className='h-3 w-3 text-gray-400 shrink-0 group-hover:translate-x-0.5 group-hover:text-brand-600 transition-all' />
      </button>
    </div>
  );
}
