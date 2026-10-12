"use client";

import { Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { guestVerificationCopy } from "@/lib/guestVerificationCopy";

type Props = {
  email?: string;
  className?: string;
  /** Highlight step 2 when user landed post-checkout (not from email). */
  activeStep?: 1 | 2 | 3;
};

export default function GuestEmailVerificationPendingCard({
  email,
  className,
  activeStep = 2,
}: Props) {
  return (
    <div
      className={cn(
        "rounded border border-amber-200/90 bg-[#fff8eb] px-4 py-4",
        className,
      )}
      role='status'
    >
      <div className='flex gap-3'>
        <Mail className='mt-0.5 h-5 w-5 shrink-0 text-[#c5a059]' aria-hidden />
        <div className='min-w-0 flex-1'>
          <p className='text-[10px] font-bold uppercase tracking-[0.18em] text-amber-900'>
            {guestVerificationCopy.statusPending}
          </p>
          <p className='mt-1 text-sm font-semibold text-navy-900'>
            {guestVerificationCopy.checkEmailHeadline}
            {email ?
              <>
                {" · "}
                <span className='font-normal text-gray-700 break-all'>
                  {email}
                </span>
              </>
            : null}
          </p>
          <p className='mt-2 text-xs leading-relaxed text-amber-950/90'>
            {guestVerificationCopy.statusPendingSub}
          </p>
        </div>
      </div>

      <ol className='mt-4 flex flex-col gap-2 sm:flex-row sm:gap-0 sm:divide-x sm:divide-amber-200/80'>
        {guestVerificationCopy.steps.map((step) => {
          const isActive = step.id === activeStep;
          return (
            <li
              key={step.id}
              className={cn(
                "flex flex-1 items-center gap-2 px-0 sm:px-3 first:sm:pl-0 last:sm:pr-0",
                isActive ? "text-navy-900" : "text-gray-500",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center text-[10px] font-bold tabular-nums",
                  isActive ?
                    "bg-navy-900 text-white"
                  : "bg-white text-gray-500 ring-1 ring-amber-200/80",
                )}
              >
                {step.id}
              </span>
              <span
                className={cn(
                  "text-[11px] font-semibold uppercase tracking-[0.12em]",
                  isActive && "text-navy-900",
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
