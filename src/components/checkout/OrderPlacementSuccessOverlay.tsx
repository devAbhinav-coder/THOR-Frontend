"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  /** When set, shows full-screen confirmation then navigates to this order */
  orderId: string | null;
};

/**
 * Post-checkout transition: full-screen confirmation before navigating to order details.
 * Respects prefers-reduced-motion (shorter, simpler).
 */
export default function OrderPlacementSuccessOverlay({ orderId }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<"confirming" | "ready">("confirming");
  const [barFill, setBarFill] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!orderId || typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    setPhase("confirming");
    setBarFill(false);
    setEntered(false);
    const rafEnter = requestAnimationFrame(() => setEntered(true));
    const rafBar = requestAnimationFrame(() => setBarFill(true));

    const t1 = window.setTimeout(
      () => setPhase("ready"),
      reduceMotion ? 220 : 780,
    );
    const t2 = window.setTimeout(
      () => {
        router.push(`/dashboard/orders/${encodeURIComponent(orderId)}`);
      },
      reduceMotion ? 520 : 2400,
    );

    return () => {
      cancelAnimationFrame(rafEnter);
      cancelAnimationFrame(rafBar);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [orderId, router]);

  if (!orderId) return null;

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const barMs = prefersReducedMotion ? 300 : 1200;

  return (
    <div
      className='fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6'
      role='dialog'
      aria-modal='true'
      aria-labelledby='order-success-title'
      aria-describedby='order-success-desc'
    >
      <div
        className={cn(
          "absolute inset-0 bg-navy-950/65 backdrop-blur-md transition-opacity duration-500",
          entered ? "opacity-100" : "opacity-0",
        )}
        aria-hidden
      />
      <div
        className={cn(
          "relative w-full max-w-[min(100%,24rem)] overflow-hidden rounded-3xl border border-white/30 bg-gradient-to-b from-white to-gray-50/95 px-6 py-9 text-center shadow-[0_25px_80px_-20px_rgba(15,23,42,0.45)] sm:px-10 sm:py-11",
          "transition-all duration-500 ease-out",
          entered ?
            "translate-y-0 scale-100 opacity-100"
          : "translate-y-6 scale-[0.96] opacity-0",
        )}
      >
        {/* soft accent */}
        <div
          className='pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-400/15 blur-2xl'
          aria-hidden
        />
        <div
          className='pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-gold-400/10 blur-2xl'
          aria-hidden
        />

        {phase === "ready" && !prefersReducedMotion && (
          <>
            <Sparkles
              className='pointer-events-none absolute right-6 top-6 h-4 w-4 text-brand-400/80 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-500'
              aria-hidden
            />
            <Sparkles
              className='pointer-events-none absolute bottom-8 left-5 h-3 w-3 text-gold-500/70 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in duration-700'
              aria-hidden
            />
          </>
        )}

        <div
          className={cn(
            "relative mx-auto mb-6 flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full transition-all duration-500 ease-out",
            phase === "ready" ?
              "bg-emerald-50 ring-[3px] ring-emerald-200/90 shadow-lg shadow-emerald-900/10"
            : "bg-brand-50 ring-2 ring-brand-100",
          )}
        >
          {phase === "ready" ?
            <Check
              key='check'
              className={cn(
                "h-9 w-9 text-emerald-600",
                !prefersReducedMotion &&
                  "motion-safe:animate-in motion-safe:zoom-in-95 motion-safe:duration-300",
              )}
              strokeWidth={2.75}
              aria-hidden
            />
          : <Loader2
              key='load'
              className='h-9 w-9 text-brand-600 animate-spin motion-reduce:animate-none'
              aria-hidden
            />
          }
        </div>

        <h2
          id='order-success-title'
          className={cn(
            "font-serif text-xl font-bold tracking-tight text-navy-900 sm:text-2xl",
            phase === "ready" &&
              !prefersReducedMotion &&
              "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-400",
          )}
        >
          {phase === "ready" ? "Order confirmed" : "Confirming your order"}
        </h2>
        <p
          id='order-success-desc'
          className={cn(
            "mt-2.5 text-sm leading-relaxed text-gray-600",
            phase === "ready" ?
              "text-gray-600"
            : "text-gray-500",
            phase === "ready" &&
              !prefersReducedMotion &&
              "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-400 motion-safe:delay-75",
          )}
        >
          {phase === "ready" ?
            "Taking you to your order details…"
          : "Hang tight — we’re saving everything securely."}
        </p>

        <div className='mt-7 h-2 w-full overflow-hidden rounded-full bg-gray-100/90 ring-1 ring-gray-200/60'>
          <div
            className={cn(
              "h-full rounded-full bg-gradient-to-r from-brand-500 via-brand-500 to-emerald-500",
              prefersReducedMotion ? "transition-none" : "transition-[width] ease-out",
            )}
            style={{
              width: barFill ? "100%" : "0%",
              transitionDuration: `${barMs}ms`,
            }}
          />
        </div>
        <p className='mt-4 text-[11px] font-medium uppercase tracking-[0.2em] text-gray-400'>
          {phase === "ready" ? "Success" : "Processing"}
        </p>
      </div>
    </div>
  );
}
