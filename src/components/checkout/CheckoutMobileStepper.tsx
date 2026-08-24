"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { step: 1 as const, label: "Address" },
  { step: 2 as const, label: "Pay" },
  { step: 3 as const, label: "Review" },
];

type CheckoutMobileStepperProps = {
  current: number;
  onGo: (step: 1 | 2 | 3) => void;
};

export default function CheckoutMobileStepper({
  current,
  onGo,
}: CheckoutMobileStepperProps) {
  const progress = Math.max(0, Math.min(1, (current - 1) / 2));

  return (
    <nav
      className="-mx-4 mb-5 border-y border-gray-200/80 bg-white sm:-mx-6 lg:hidden"
      aria-label="Checkout steps"
    >
      <ol className="relative grid grid-cols-3 px-1 py-2.5 sm:px-2">
        <span
          className="pointer-events-none absolute left-[16.666%] right-[16.666%] top-[1.125rem] h-px bg-gray-200"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute left-[16.666%] top-[1.125rem] h-px bg-navy-900 transition-[width] duration-300"
          style={{ width: `calc(${progress} * 66.668%)` }}
          aria-hidden
        />
        {STEPS.map((item) => {
          const done = current > item.step;
          const active = current === item.step;
          return (
            <li key={item.step} className="relative z-[1] min-w-0">
              <button
                type="button"
                onClick={() => onGo(item.step)}
                className="flex min-h-11 w-full min-w-0 flex-col items-center justify-start px-0.5"
                aria-current={active ? "step" : undefined}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center text-[11px] font-semibold transition-colors",
                    done || active ?
                      "bg-navy-900 text-white"
                    : "border border-gray-300 bg-white text-gray-400",
                  )}
                >
                  {done ?
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  : item.step}
                </span>
                <span
                  className={cn(
                    "mt-1 w-full truncate text-center text-[10px] font-semibold uppercase tracking-wide",
                    active ? "text-navy-900"
                    : done ? "text-navy-900/70"
                    : "text-gray-400",
                  )}
                >
                  {item.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
