"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import {
  authBackdrop,
  authModalEyebrow,
  authModalTitleDesktop,
} from "@/lib/authHeritageTheme";
import { cn } from "@/lib/utils";

type Props = {
  active: boolean;
  title: string;
  description: string;
};

/**
 * Full-screen auth transition overlay for login/signup/OTP steps.
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
      className="fixed inset-0 z-[260] flex items-center justify-center p-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={title}
    >
      <div className={authBackdrop} aria-hidden />
      <div
        className={cn(
          "relative w-full max-w-sm border border-gray-200/80 bg-[#faf9f7] px-6 py-10 text-center shadow-[0_24px_70px_-20px_rgba(20,25,47,0.35)]",
          "transition-all duration-300 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95",
        )}
      >
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center border border-[#c5a059]/30 bg-white">
          <Loader2 className="h-7 w-7 animate-spin text-[#c5a059]" strokeWidth={2.2} />
        </div>
        <p className={authModalEyebrow}>Secure session</p>
        <p className={cn(authModalTitleDesktop, "mt-2 text-xl")}>{title}</p>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">{description}</p>

        <div className="mt-5 h-0.5 w-full overflow-hidden bg-gray-100">
          <div className="h-full w-1/3 animate-[auth-pending-bar_1.2s_ease-in-out_infinite] bg-[#c5a059]" />
        </div>

        <p className="mt-4 inline-flex items-center justify-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
          <ShieldCheck className="h-3.5 w-3.5" /> Secure authentication
        </p>
        {showSlowHint && (
          <p className="mt-2 text-xs text-gray-500">
            This is taking a bit longer than usual. Please stay on this page.
          </p>
        )}
      </div>
    </div>
  );
}
