"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  active: boolean;
  title: string;
  description: string;
};

/**
 * Full-screen auth transition overlay for login/signup/OTP steps.
 * Keeps users informed so they do not feel stuck on the same form.
 */
export default function AuthPendingOverlay({
  active,
  title,
  description,
}: Props) {
  const [showSlowHint, setShowSlowHint] = useState(false);

  useEffect(() => {
    if (!active) {
      setShowSlowHint(false);
      return;
    }
    const timer = window.setTimeout(() => setShowSlowHint(true), 5500);
    return () => window.clearTimeout(timer);
  }, [active]);

  if (!active) return null;

  return (
    <div
      className='fixed inset-0 z-[160] flex items-center justify-center p-4'
      role='status'
      aria-live='polite'
      aria-busy='true'
      aria-label={title}
    >
      <div className='absolute inset-0 bg-navy-950/70 backdrop-blur-sm' aria-hidden />
      <div
        className={cn(
          "relative w-full max-w-sm rounded-2xl border border-white/20 bg-white/95 p-6 text-center shadow-[0_24px_70px_-20px_rgba(15,23,42,0.48)]",
          "transition-all duration-300 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95",
        )}
      >
        <div className='mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 ring-1 ring-brand-100'>
          <Loader2 className='h-7 w-7 animate-spin text-brand-600' strokeWidth={2.2} />
        </div>
        <p className='text-[15px] font-semibold text-navy-900'>{title}</p>
        <p className='mt-1.5 text-sm leading-relaxed text-gray-600'>{description}</p>

        <div className='mt-4 h-1.5 w-full overflow-hidden rounded-full bg-gray-100'>
          <div className='h-full w-full animate-[auth-pending-bar_1.2s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-brand-500 via-brand-400 to-emerald-500' />
        </div>

        <p className='mt-3 inline-flex items-center justify-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-gray-400'>
          <ShieldCheck className='h-3.5 w-3.5' /> Secure authentication
        </p>
        {showSlowHint && (
          <p className='mt-2 text-xs text-gray-500'>
            This is taking a bit longer than usual. Please stay on this page.
          </p>
        )}
      </div>
    </div>
  );
}

