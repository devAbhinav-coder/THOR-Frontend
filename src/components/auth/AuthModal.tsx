"use client";

import { useEffect, useId } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
};

export default function AuthModal({
  open,
  onClose,
  title = "Account",
  subtitle,
  children,
  className,
}: Props) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className='fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4'
      role='presentation'
    >
      <button
        type='button'
        className='absolute inset-0 bg-navy-950/55 backdrop-blur-[10px]'
        aria-label='Close dialog'
        onClick={onClose}
      />
      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleId}
        className={cn(
          "relative z-10 flex w-full max-h-[94dvh] sm:max-h-[min(90dvh,640px)] flex-col",
          "sm:max-w-[400px] sm:rounded-2xl rounded-t-2xl",
          "bg-[#faf9f7] shadow-2xl shadow-navy-950/25 ring-1 ring-black/[0.06]",
          "animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className='shrink-0 flex items-start justify-between gap-3 px-5 pt-5 pb-3'>
          <div className='min-w-0 flex-1'>
            <div className='flex items-center gap-2.5 mb-2'>
              <Image
                src='/logoNew.png'
                alt=''
                width={88}
                height={28}
                className='h-7 w-auto object-contain opacity-90'
                aria-hidden
              />
            </div>
            <h2
              id={titleId}
              className='font-serif text-xl font-bold text-navy-900 tracking-tight'
            >
              {title}
            </h2>
            {subtitle ?
              <p className='mt-0.5 text-sm text-gray-500 leading-snug'>
                {subtitle}
              </p>
            : null}
          </div>
          <button
            type='button'
            onClick={onClose}
            className='shrink-0 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-navy-900 transition-colors -mr-1 -mt-1'
            aria-label='Close'
          >
            <X className='h-5 w-5' aria-hidden />
          </button>
        </div>

        <div className='flex-1 overflow-y-auto overscroll-contain px-5 pb-5 pt-0'>
          {children}
        </div>
      </div>
    </div>
  );
}
