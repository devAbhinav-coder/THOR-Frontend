"use client";

import { Check, RotateCcw, Truck, X } from "lucide-react";
import type { Order } from "@/types";
import { buildReturnJourney, type ReturnJourneyStep } from "@/lib/orderLifecycle";
import {
  refundMethodCustomerLabel,
  RETURN_NEXT_STEPS_CUSTOMER,
  RETURN_STATUS_CUSTOMER_COPY,
  RETURN_STATUS_CUSTOMER_TITLE,
} from "@/lib/orderReturnHelpers";
import { cn, formatDateTime, formatPrice } from "@/lib/utils";

function StepDot({ step }: { step: ReturnJourneyStep }) {
  return (
    <span
      className={cn(
        "relative z-10 h-6 w-6 shrink-0 rounded-full flex items-center justify-center",
        step.state === "done" && "bg-account-secondary text-white",
        step.state === "current" &&
          "bg-account-secondary-container text-account-on-secondary-container ring-2 ring-account-secondary/40",
        step.state === "failed" && "bg-red-600 text-white",
        step.state === "upcoming" &&
          "bg-account-surface-container border border-account-outline-variant/60",
      )}
    >
      {step.state === "done" ?
        <Check className='h-3.5 w-3.5' />
      : step.state === "failed" ?
        <X className='h-3.5 w-3.5' />
      : step.state === "current" ?
        <span className='h-2 w-2 rounded-full bg-account-secondary animate-pulse' />
      : null}
    </span>
  );
}

function StepText({ step }: { step: ReturnJourneyStep }) {
  return (
    <>
      <p
        className={cn(
          "text-[13px] font-medium leading-snug",
          step.state === "upcoming" ? "text-account-outline"
          : step.state === "failed" ? "text-red-700"
          : "text-account-primary",
        )}
      >
        {step.label}
      </p>
      {step.timestamp ?
        <p className='text-[11px] text-account-outline mt-0.5'>
          {formatDateTime(step.timestamp)}
        </p>
      : step.state === "current" && step.pendingLabel ?
        <p className='text-[11px] font-semibold uppercase tracking-wider text-account-secondary mt-0.5'>
          {step.pendingLabel}
        </p>
      : null}
    </>
  );
}

export default function OrderReturnStatusPanel({ order }: { order: Order }) {
  const steps = buildReturnJourney(order);
  const rs = order.returnStatus;
  if (!steps || !rs) return null;

  const req = order.returnRequest;
  const refund = order.refundData;
  const isRejected = rs === "rejected";
  const nextSteps = RETURN_NEXT_STEPS_CUSTOMER[rs] ?? [];
  const refundTo = refundMethodCustomerLabel(req?.refundMethod);

  return (
    <section
      className={cn(
        "border p-6 md:p-8",
        isRejected ?
          "bg-red-50/60 border-red-200"
        : "bg-account-surface-container-lowest border-account-secondary/30",
      )}
    >
      <div className='flex items-start gap-3'>
        <span
          className={cn(
            "h-10 w-10 shrink-0 rounded-full flex items-center justify-center",
            isRejected ?
              "bg-red-100 text-red-700"
            : "bg-account-secondary-container/60 text-account-secondary",
          )}
        >
          <RotateCcw className='h-5 w-5' />
        </span>
        <div className='min-w-0'>
          <p className='text-[10px] font-semibold uppercase tracking-[0.2em] text-account-on-surface-variant'>
            Return
          </p>
          <h3
            className={cn(
              "font-serif text-xl md:text-2xl mt-0.5",
              isRejected ? "text-red-900" : "text-account-primary",
            )}
          >
            {RETURN_STATUS_CUSTOMER_TITLE[rs] ?? rs.replace(/_/g, " ")}
          </h3>
          <p
            className={cn(
              "text-sm mt-1.5 leading-relaxed",
              isRejected ? "text-red-800" : "text-account-on-surface-variant",
            )}
          >
            {RETURN_STATUS_CUSTOMER_COPY[rs] ?? "We will update you on your return."}
          </p>
        </div>
      </div>

      <ol
        className='hidden sm:grid mt-7'
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      >
        {steps.map((step, i) => (
          <li key={step.key} className='relative flex flex-col items-center text-center px-1'>
            {i < steps.length - 1 ?
              <span
                aria-hidden
                className={cn(
                  "absolute top-[11px] left-[calc(50%+16px)] right-[calc(-50%+16px)] h-px",
                  steps[i + 1]!.state === "done" || steps[i + 1]!.state === "failed" ?
                    "bg-account-secondary"
                  : "bg-account-outline-variant/50",
                )}
              />
            : null}
            <StepDot step={step} />
            <div className='mt-2.5 min-w-0'>
              <StepText step={step} />
            </div>
          </li>
        ))}
      </ol>

      <ol className='sm:hidden mt-6'>
        {steps.map((step, i) => (
          <li key={step.key} className='relative flex gap-3 pb-5 last:pb-0'>
            {i < steps.length - 1 ?
              <span
                aria-hidden
                className={cn(
                  "absolute left-[11px] top-7 bottom-0.5 w-px",
                  steps[i + 1]!.state === "done" || steps[i + 1]!.state === "failed" ?
                    "bg-account-secondary"
                  : "bg-account-outline-variant/50",
                )}
              />
            : null}
            <StepDot step={step} />
            <div className='min-w-0 pt-0.5'>
              <StepText step={step} />
            </div>
          </li>
        ))}
      </ol>

      {nextSteps.length > 0 || (rs === "picked_up" && (req?.pickupCarrier || req?.pickupAwb)) ?
        <div className='mt-7 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]'>
          {nextSteps.length > 0 ?
            <div className='bg-account-surface-container/60 border border-account-outline-variant/30 p-4'>
              <p className='text-[10px] font-semibold uppercase tracking-[0.2em] text-account-on-surface-variant mb-2.5'>
                What happens next
              </p>
              <ul className='space-y-1.5'>
                {nextSteps.map((line) => (
                  <li
                    key={line}
                    className='flex gap-2 text-sm text-account-on-surface-variant leading-relaxed'
                  >
                    <span className='mt-2 h-1 w-1 shrink-0 rounded-full bg-account-secondary' />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          : null}
          <div className='flex flex-col gap-3 md:min-w-[220px]'>
            {refundTo && !refund ?
              <div className='border border-account-outline-variant/30 p-4'>
                <p className='text-[10px] font-semibold uppercase tracking-[0.2em] text-account-on-surface-variant'>
                  Refund to
                </p>
                <p className='text-sm font-medium text-account-primary mt-1'>{refundTo}</p>
              </div>
            : null}
            {rs === "picked_up" && (req?.pickupCarrier || req?.pickupAwb) ?
              <div className='border border-account-outline-variant/30 p-4'>
                <p className='text-[10px] font-semibold uppercase tracking-[0.2em] text-account-on-surface-variant flex items-center gap-1.5'>
                  <Truck className='h-3.5 w-3.5' /> Return shipment
                </p>
                <p className='text-sm text-account-primary mt-1 font-mono break-all'>
                  {[req?.pickupCarrier, req?.pickupAwb].filter(Boolean).join(" · ")}
                </p>
              </div>
            : null}
          </div>
        </div>
      : null}

      {refund ?
        <div className='mt-7 bg-account-secondary-container/30 border border-account-secondary-container/60 p-4 flex flex-wrap items-baseline justify-between gap-3'>
          <div>
            <p className='text-[10px] font-semibold uppercase tracking-[0.2em] text-account-on-surface-variant'>
              Refund processed
            </p>
            <p className='font-serif text-2xl text-account-primary mt-1'>
              {formatPrice(refund.amount)}
            </p>
          </div>
          <div className='text-sm text-account-on-surface-variant sm:text-right'>
            <p>{refundMethodCustomerLabel(String(refund.method))}</p>
            {refund.processedAt ?
              <p className='text-xs text-account-outline mt-0.5'>
                {formatDateTime(refund.processedAt)}
              </p>
            : null}
          </div>
        </div>
      : null}
    </section>
  );
}
