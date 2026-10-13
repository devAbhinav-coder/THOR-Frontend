"use client";

import { useEffect, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  tone?: "default" | "brand" | "red" | "amber";
  children: ReactNode;
  footer?: ReactNode;
  /** Prevent closing while a request is in flight */
  busy?: boolean;
  size?: "sm" | "md" | "lg";
};

const TONE: Record<NonNullable<Props["tone"]>, string> = {
  default: "bg-gray-100 text-gray-700",
  brand: "bg-brand-50 text-brand-700 ring-1 ring-brand-100",
  red: "bg-red-50 text-red-700 ring-1 ring-red-100",
  amber: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
};

const SIZE: Record<NonNullable<Props["size"]>, string> = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
};

/** Bottom-sheet on mobile, centered dialog on desktop. */
export default function AdminOrderModalShell({
  open,
  onClose,
  title,
  eyebrow,
  description,
  icon: Icon,
  tone = "default",
  children,
  footer,
  busy,
  size = "md",
}: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, busy, onClose]);

  if (!open) return null;

  return (
    <div className='fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4'>
      <button
        type='button'
        aria-label='Close'
        className='absolute inset-0 bg-navy-900/60 backdrop-blur-[2px]'
        onClick={() => {
          if (!busy) onClose();
        }}
      />
      <div
        role='dialog'
        aria-modal='true'
        className={cn(
          "relative w-full bg-white rounded-t-3xl sm:rounded-2xl shadow-[0_30px_80px_-20px_rgba(15,23,42,0.55)] overflow-hidden animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 fade-in duration-200 max-h-[92dvh] flex flex-col",
          SIZE[size],
        )}
      >
        <div className='px-5 sm:px-6 pt-5 pb-4 border-b border-gray-100 flex items-start gap-3'>
          {Icon ?
            <span
              className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                TONE[tone],
              )}
              aria-hidden
            >
              <Icon className='h-5 w-5' />
            </span>
          : null}
          <div className='min-w-0 flex-1'>
            {eyebrow ?
              <p className='text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400'>
                {eyebrow}
              </p>
            : null}
            <h3 className='text-lg font-bold text-gray-900 leading-tight'>
              {title}
            </h3>
            {description ?
              <p className='text-xs text-gray-500 mt-1 leading-relaxed'>
                {description}
              </p>
            : null}
          </div>
          <button
            type='button'
            onClick={() => {
              if (!busy) onClose();
            }}
            disabled={busy}
            className='shrink-0 -mr-1 -mt-1 h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors disabled:opacity-40'
            aria-label='Close'
          >
            <X className='h-4 w-4' />
          </button>
        </div>
        <div className='px-5 sm:px-6 py-5 overflow-y-auto'>{children}</div>
        {footer ?
          <div className='px-5 sm:px-6 py-4 border-t border-gray-100 bg-gray-50/80 flex gap-3'>
            {footer}
          </div>
        : null}
      </div>
    </div>
  );
}

export const modalInputClass =
  "w-full h-11 px-3.5 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-shadow";
export const modalLabelClass =
  "block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5";
