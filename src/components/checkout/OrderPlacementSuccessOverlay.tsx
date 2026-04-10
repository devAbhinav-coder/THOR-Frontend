"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  /** When set, shows full-screen confirmation then navigates to this order */
  orderId: string | null;
};

/**
 * Post-checkout transition: reassuring “we’re confirming” moment before SPA navigation.
 * Respects prefers-reduced-motion (shorter, simpler).
 */
export default function OrderPlacementSuccessOverlay({ orderId }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<"confirming" | "ready">("confirming");
  const [barFill, setBarFill] = useState(false);

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
    const raf = requestAnimationFrame(() => setBarFill(true));

    const t1 = window.setTimeout(
      () => setPhase("ready"),
      reduceMotion ? 200 : 650,
    );
    const t2 = window.setTimeout(
      () => {
        router.push(`/dashboard/orders/${encodeURIComponent(orderId)}`);
      },
      reduceMotion ? 500 : 1650,
    );

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [orderId, router]);

  if (!orderId) return null;

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const barMs = prefersReducedMotion ? 280 : 1100;

  return (
    <div
      className='fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6'
      role='dialog'
      aria-modal='true'
      aria-labelledby='order-success-title'
      aria-describedby='order-success-desc'
    >
      <div
        className='absolute inset-0 bg-navy-950/55 backdrop-blur-[2px] motion-safe:animate-fadeIn'
        aria-hidden
      />
      <div
        className={cn(
          "relative w-full max-w-[min(100%,22rem)] rounded-3xl border border-white/20 bg-white px-6 py-8 sm:px-10 sm:py-10 shadow-2xl shadow-navy-900/20 text-center",
          "motion-safe:animate-fadeIn",
        )}
      >
        <div className='mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 ring-2 ring-brand-100'>
          {phase === "ready" ?
            <Check
              className='h-8 w-8 text-brand-600 motion-safe:animate-[fadeIn_0.4s_ease-out]'
              strokeWidth={2.5}
              aria-hidden
            />
          : <Loader2
              className='h-9 w-9 text-brand-600 animate-spin motion-reduce:animate-none'
              aria-hidden
            />
          }
        </div>

        <h2
          id='order-success-title'
          className='font-serif text-xl sm:text-2xl font-bold text-navy-900 tracking-tight'
        >
          {phase === "ready" ? "Order confirmed" : "Confirming your order"}
        </h2>
        <p
          id='order-success-desc'
          className='mt-2 text-sm text-gray-600 leading-relaxed'
        >
          {phase === "ready" ?
            "Taking you to your order details…"
          : "Hang tight — we’re saving everything securely."}
        </p>

        <div className='mt-6 h-1.5 w-full overflow-hidden rounded-full bg-gray-100'>
          <div
            className={cn(
              "h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600",
              prefersReducedMotion ? "transition-none" : "transition-[width] ease-out",
            )}
            style={{
              width: barFill ? "100%" : "0%",
              transitionDuration: `${barMs}ms`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
