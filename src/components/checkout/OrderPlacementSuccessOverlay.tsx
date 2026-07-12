"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { clearPostCheckoutAuthGuard } from "@/lib/checkoutSuccessGuard";
import {
  heritageOverlayBody,
  heritageOverlayCard,
  heritageOverlayEyebrow,
  heritageOverlayIconBox,
  heritageOverlayTitle,
  heritageOverlayVeil,
} from "@/components/checkout/checkoutHeritageTheme";

type Props = {
  /** When set, shows full-screen confirmation then navigates to this order */
  orderId: string | null;
  /** Keep overlay open while the order API is processing. */
  isOpen?: boolean;
};

type Phase = "processing" | "confirmed";

const STEPS: { id: Phase; label: string }[] = [
  { id: "processing", label: "Processing" },
  { id: "confirmed", label: "Confirmed" },
];

/**
 * Post-checkout transition — matches cart/checkout heritage empty-state UI.
 */
export default function OrderPlacementSuccessOverlay({
  orderId,
  isOpen,
}: Props) {
  const router = useRouter();
  const isVisible = Boolean(isOpen ?? orderId);
  const [phase, setPhase] = useState<Phase>("processing");
  const [barFill, setBarFill] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!isVisible || typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    setPhase("processing");
    setBarFill(false);
    setEntered(false);
    const rafEnter = requestAnimationFrame(() => setEntered(true));
    const rafBar = requestAnimationFrame(() => setBarFill(true));

    let confirmTimer: number | null = null;
    let redirectTimer: number | null = null;

    if (orderId) {
      confirmTimer = window.setTimeout(
        () => setPhase("confirmed"),
        reduceMotion ? 320 : 1200,
      );
      redirectTimer = window.setTimeout(
        () => {
          clearPostCheckoutAuthGuard();
          router.push(`/dashboard/orders/${encodeURIComponent(orderId)}`);
        },
        reduceMotion ? 1200 : 3600,
      );
    }

    return () => {
      cancelAnimationFrame(rafEnter);
      cancelAnimationFrame(rafBar);
      if (confirmTimer) window.clearTimeout(confirmTimer);
      if (redirectTimer) window.clearTimeout(redirectTimer);
    };
  }, [isVisible, orderId, router]);

  if (!isVisible) return null;

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const barMs = prefersReducedMotion ? 360 : 1400;
  const isConfirmed = phase === "confirmed";

  const title =
    isConfirmed ? "Order Confirmed"
    : orderId ? "Confirming Your Order"
    : "Processing Your Order";

  const description =
    isConfirmed ?
      "Thank you for your purchase. We are taking you to your order details."
    : orderId ?
      "Securing your payment and reserving your heritage piece…"
    : "Please wait while we prepare and place your order…";

  const statusLabel =
    isConfirmed ? "Redirecting to your order"
    : orderId ? "Almost there"
    : "Please wait";

  return (
    <div
      className={heritageOverlayVeil}
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-success-title"
      aria-describedby="order-success-desc"
      aria-busy={!isConfirmed}
    >
      <div
        className={cn(
          heritageOverlayCard,
          "transition-all duration-500 ease-out",
          entered ?
            "translate-y-0 scale-100 opacity-100"
          : "translate-y-3 scale-[0.98] opacity-0",
        )}
      >
        <div
          className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-navy-900 via-[#c5a059] to-navy-900"
          aria-hidden
        />

        <nav
          className="mb-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-1"
          aria-label="Order progress"
        >
          {STEPS.map((step, index) => {
            const isActive = phase === step.id;
            const isDone = step.id === "processing" && isConfirmed;
            return (
              <div key={step.id} className="flex items-center gap-2">
                {index > 0 ?
                  <span className="text-gray-300" aria-hidden>
                    ·
                  </span>
                : null}
                <span
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-[0.16em] transition-colors sm:text-[11px]",
                    isActive || isDone ?
                      "text-navy-900"
                    : "text-gray-400",
                  )}
                >
                  <span
                    className={cn(
                      "mr-1.5 inline-block tabular-nums",
                      isActive || isDone ? "text-[#c5a059]" : "text-gray-300",
                    )}
                  >
                    0{index + 1}
                  </span>
                  {step.label}
                </span>
              </div>
            );
          })}
        </nav>

        <div
          className={cn(
            heritageOverlayIconBox,
            "transition-colors duration-500",
            isConfirmed && "border-[#c5a059]/45 bg-[#fff8eb]",
          )}
        >
          {isConfirmed ?
            <Check
              className="h-7 w-7 text-[#c5a059]"
              strokeWidth={2}
              aria-hidden
            />
          : orderId ?
            <Loader2
              className="h-7 w-7 animate-spin text-navy-900 motion-reduce:animate-none"
              aria-hidden
            />
          : <ShoppingBag
              className="h-7 w-7 text-[#c5a059]"
              strokeWidth={1.25}
              aria-hidden
            />
          }
        </div>

        <p className={heritageOverlayEyebrow}>The House of Rani</p>

        <h2 id="order-success-title" className={cn(heritageOverlayTitle, "mt-3")}>
          {title}
        </h2>

        <div className="gold-divider mx-auto my-5 w-16 sm:my-6" aria-hidden />

        <p id="order-success-desc" className={heritageOverlayBody}>
          {description}
        </p>

        <div className="mx-auto mt-8 max-w-xs">
          <div className="h-1 w-full overflow-hidden bg-gray-100">
            <div
              className={cn(
                "h-full bg-gradient-to-r from-navy-900 via-[#c5a059] to-navy-900",
                prefersReducedMotion ? "transition-none" : (
                  "transition-[width] ease-out"
                ),
                isConfirmed && "opacity-90",
              )}
              style={{
                width:
                  isConfirmed ? "100%"
                  : barFill ?
                    orderId ?
                      "72%"
                    : "45%"
                  : "0%",
                transitionDuration: `${barMs}ms`,
              }}
            />
          </div>
          <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
            {statusLabel}
          </p>
        </div>
      </div>
    </div>
  );
}
