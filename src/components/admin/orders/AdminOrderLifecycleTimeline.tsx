"use client";

import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ClipboardList,
  Compass,
  Info,
  Package,
  PackageCheck,
  Radar,
  RotateCcw,
  Truck,
  Undo2,
  X,
} from "lucide-react";
import { Order } from "@/types";
import {
  buildOrderLifecycleTimeline,
  buildReturnJourney,
  isPostDeliveryStatus,
  type ReturnJourneyStep,
} from "@/lib/orderLifecycle";
import { RETURN_STATUS_LABELS } from "@/lib/orderReturnHelpers";
import { cn, formatPrice } from "@/lib/utils";
import AdminOrderSectionCard, { MicroLabel } from "./AdminOrderSectionCard";

type StepState = "done" | "current" | "upcoming" | "failed";
type Tone = "emerald" | "amber";

type Step = {
  key: string;
  label: string;
  state: StepState;
  timestamp?: string;
  detail?: string;
  pendingLabel?: string;
  icon: LucideIcon;
};

const FULFILMENT_ICONS: Record<string, LucideIcon> = {
  pending: ClipboardList,
  confirmed: Check,
  processing: Package,
  shipped: Truck,
  delivered: PackageCheck,
  cancelled: X,
  refunded: Undo2,
};

const RETURN_ICONS: Record<ReturnJourneyStep["key"], LucideIcon> = {
  requested: RotateCcw,
  approved: Check,
  picked_up: Truck,
  received: PackageCheck,
  refunded: Undo2,
  rejected: X,
};

const TONE = {
  emerald: {
    done: "bg-emerald-600 text-white ring-emerald-600",
    current: "bg-white text-emerald-700 ring-emerald-500",
    ping: "bg-emerald-400",
    line: "bg-emerald-500",
    lineSoft: "bg-gradient-to-r from-emerald-500 to-emerald-200",
    lineSoftV: "bg-gradient-to-b from-emerald-500 to-emerald-200",
    chip: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  },
  amber: {
    done: "bg-amber-500 text-white ring-amber-500",
    current: "bg-white text-amber-700 ring-amber-400",
    ping: "bg-amber-400",
    line: "bg-amber-400",
    lineSoft: "bg-gradient-to-r from-amber-400 to-amber-100",
    lineSoftV: "bg-gradient-to-b from-amber-400 to-amber-100",
    chip: "bg-amber-50 text-amber-900 ring-amber-200",
  },
} as const;

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const timeFmt = new Intl.DateTimeFormat("en-IN", {
  hour: "numeric",
  minute: "2-digit",
});

function splitDateTime(ts: string): { date: string; time: string } | null {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return null;
  return { date: dateFmt.format(d), time: timeFmt.format(d) };
}

function connectorClass(next: Step | undefined, tone: Tone, vertical = false) {
  if (!next) return "";
  if (next.state === "failed") return "bg-red-300";
  if (next.state === "done") return TONE[tone].line;
  if (next.state === "current") {
    return vertical ? TONE[tone].lineSoftV : TONE[tone].lineSoft;
  }
  return "bg-gray-200";
}

function StepNode({ step, tone }: { step: Step; tone: Tone }) {
  const Icon = step.icon;
  return (
    <span
      className={cn(
        "relative z-10 h-8 w-8 shrink-0 rounded-full flex items-center justify-center ring-2 transition-colors",
        step.state === "done" && TONE[tone].done,
        step.state === "current" && TONE[tone].current,
        step.state === "failed" && "bg-red-600 text-white ring-red-600",
        step.state === "upcoming" && "bg-white text-gray-300 ring-gray-200",
      )}
    >
      {step.state === "current" ?
        <span
          className={cn(
            "absolute inset-0 rounded-full opacity-30 animate-ping",
            TONE[tone].ping,
          )}
          aria-hidden
        />
      : null}
      <Icon className='relative h-4 w-4' strokeWidth={2.25} />
    </span>
  );
}

function StepMeta({
  step,
  tone,
  align,
}: {
  step: Step;
  tone: Tone;
  align: "center" | "left";
}) {
  const when = step.timestamp ? splitDateTime(step.timestamp) : null;
  return (
    <div className={cn("min-w-0", align === "center" && "text-center")}>
      <p
        className={cn(
          "text-[12.5px] font-semibold leading-snug",
          step.state === "upcoming" ? "text-gray-400"
          : step.state === "failed" ? "text-red-700"
          : "text-gray-900",
        )}
      >
        {step.label}
      </p>
      {when ?
        <p className='mt-0.5 text-[11px] leading-tight text-gray-500 tabular-nums'>
          <span className='whitespace-nowrap'>{when.date}</span>
          {align === "center" ? <br /> : " · "}
          <span className='whitespace-nowrap'>{when.time}</span>
        </p>
      : step.state === "current" && step.pendingLabel ?
        <span
          className={cn(
            "mt-1 inline-block rounded-full px-2 py-0.5 text-[10.5px] font-semibold ring-1 ring-inset",
            TONE[tone].chip,
          )}
        >
          {step.pendingLabel}
        </span>
      : null}
      {step.detail ?
        <p
          className='mt-1 text-[11px] leading-snug text-gray-500 line-clamp-2 break-words'
          title={step.detail}
        >
          {step.detail}
        </p>
      : null}
    </div>
  );
}

/** Horizontal on md+ (columns share the width — never scrolls), vertical on mobile. */
function Stepper({ steps, tone }: { steps: Step[]; tone: Tone }) {
  return (
    <>
      <ol
        className='hidden md:grid'
        style={{
          gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`,
        }}
      >
        {steps.map((step, i) => (
          <li
            key={step.key}
            className='relative flex flex-col items-center gap-2 px-1.5'
          >
            {i < steps.length - 1 ?
              <span
                aria-hidden
                className={cn(
                  "absolute top-[15px] left-[calc(50%+20px)] right-[calc(-50%+20px)] h-0.5 rounded-full",
                  connectorClass(steps[i + 1], tone),
                )}
              />
            : null}
            <StepNode step={step} tone={tone} />
            <StepMeta step={step} tone={tone} align='center' />
          </li>
        ))}
      </ol>

      <ol className='md:hidden'>
        {steps.map((step, i) => (
          <li key={step.key} className='relative flex gap-3 pb-5 last:pb-0'>
            {i < steps.length - 1 ?
              <span
                aria-hidden
                className={cn(
                  "absolute left-[15px] top-9 bottom-1 w-0.5 rounded-full",
                  connectorClass(steps[i + 1], tone, true),
                )}
              />
            : null}
            <StepNode step={step} tone={tone} />
            <div className='pt-1.5 min-w-0'>
              <StepMeta step={step} tone={tone} align='left' />
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}

function adminReturnNextStep(order: Order): string {
  switch (order.returnStatus) {
    case "requested":
      return "Review the request below — approve to arrange a pickup, or reject with a note to the customer.";
    case "approved":
      return "Book the reverse pickup and mark it picked up. The refund stays locked until the item is received and inspected.";
    case "picked_up":
      return "Parcel is on its way back. Inspect it on arrival and mark it received — that unlocks the refund.";
    case "received":
      return order.status === "refunded" ?
          "Refund recorded for this return."
        : "Item received and inspected — the refund is unlocked. Process it from the return card.";
    case "returned":
      return order.refundData ?
          `Return closed — ${formatPrice(order.refundData.amount)} refunded via ${String(order.refundData.method).replace(/_/g, " ")}.`
        : "Return closed and refund recorded.";
    case "rejected":
      return "Return rejected — no refund is due. The customer has been notified.";
    default:
      return "";
  }
}

export default function AdminOrderLifecycleTimeline({ order }: { order: Order }) {
  const events = buildOrderLifecycleTimeline(order);
  const journey = buildReturnJourney(order);
  const hasReturn = journey !== null;

  const scans = events.filter((e) => e.status === "courier_scan");
  const fulfilmentEvents = events.filter(
    (e) =>
      e.status !== "courier_scan" &&
      !e.status.startsWith("return_") &&
      !(hasReturn && isPostDeliveryStatus(e.status)),
  );

  const isOpenFulfilment =
    !hasReturn &&
    !["delivered", "cancelled", "refunded"].includes(order.status);

  const fulfilmentSteps: Step[] = fulfilmentEvents.map((e, i) => {
    let state: StepState =
      e.state === "upcoming" ? "upcoming"
      : e.status === "cancelled" ? "failed"
      : "done";
    if (
      isOpenFulfilment &&
      i === fulfilmentEvents.length - 1 &&
      state === "done"
    ) {
      state = "current";
    }
    return {
      key: e.key,
      label: e.label,
      state,
      timestamp: e.timestamp,
      detail: e.detail,
      icon: FULFILMENT_ICONS[e.status] ?? Check,
    };
  });

  const returnSteps: Step[] =
    journey?.map((s) => ({
      key: s.key,
      label: s.label,
      state: s.state,
      timestamp: s.timestamp,
      detail: s.detail,
      pendingLabel: s.pendingLabel,
      icon: RETURN_ICONS[s.key],
    })) ?? [];

  const latestScan = scans[scans.length - 1];
  const nextStep = hasReturn ? adminReturnNextStep(order) : "";
  const returnClosed =
    order.returnStatus === "returned" ||
    order.returnStatus === "rejected" ||
    order.status === "refunded";
  const returnLabel =
    order.returnStatus ?
      (RETURN_STATUS_LABELS[order.returnStatus] ??
      order.returnStatus.replace(/_/g, " "))
    : "";

  if (fulfilmentSteps.length === 0 && !hasReturn) {
    return (
      <AdminOrderSectionCard
        id='lifecycle'
        icon={Compass}
        tone='sky'
        title='Order lifecycle'
      >
        <p className='text-sm text-gray-500'>No status updates recorded yet.</p>
      </AdminOrderSectionCard>
    );
  }

  return (
    <AdminOrderSectionCard
      id='lifecycle'
      icon={Compass}
      tone='sky'
      title='Order lifecycle'
      description='Only steps that actually happened - upcoming return steps are shown greyed out.'
      flush
    >
      {fulfilmentSteps.length > 0 ?
        <div className='px-5 sm:px-6 pt-5 pb-6'>
          <MicroLabel className='mb-4'>Fulfilment</MicroLabel>
          <Stepper steps={fulfilmentSteps} tone='emerald' />

          {scans.length > 0 ?
            <details className='group mt-5 rounded-xl border border-gray-200 bg-gray-50/60 open:bg-white'>
              <summary className='flex cursor-pointer list-none items-center gap-3 px-4 py-2.5 text-sm [&::-webkit-details-marker]:hidden'>
                <Radar className='h-4 w-4 shrink-0 text-sky-600' />
                <span className='font-semibold text-gray-800 shrink-0'>
                  Courier scans
                </span>
                <span className='rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-gray-600 ring-1 ring-gray-200 shrink-0'>
                  {scans.length}
                </span>
                {latestScan ?
                  <span className='min-w-0 truncate text-xs text-gray-500'>
                    Latest: {latestScan.label}
                    {latestScan.detail ? ` · ${latestScan.detail}` : ""}
                  </span>
                : null}
                <ChevronDown className='ml-auto h-4 w-4 shrink-0 text-gray-400 transition-transform group-open:rotate-180' />
              </summary>
              <ol className='max-h-72 overflow-y-auto border-t border-gray-100 px-4 py-3 space-y-3'>
                {[...scans].reverse().map((scan, i) => {
                  const when = scan.timestamp ? splitDateTime(scan.timestamp) : null;
                  return (
                    <li key={scan.key} className='flex gap-3 text-sm'>
                      <span
                        className={cn(
                          "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                          i === 0 ? "bg-sky-500" : "bg-gray-300",
                        )}
                      />
                      <div className='min-w-0 flex-1'>
                        <p className='font-medium text-gray-900'>{scan.label}</p>
                        {scan.detail ?
                          <p className='text-xs text-gray-500 break-words'>
                            {scan.detail}
                          </p>
                        : null}
                      </div>
                      {when ?
                        <p className='shrink-0 text-right text-[11px] leading-tight text-gray-500 tabular-nums'>
                          {when.date}
                          <br />
                          {when.time}
                        </p>
                      : null}
                    </li>
                  );
                })}
              </ol>
            </details>
          : null}
        </div>
      : null}

      {hasReturn ?
        <div
          className={cn(
            "px-5 sm:px-6 pt-5 pb-6 bg-gradient-to-b from-amber-50/60 to-white",
            fulfilmentSteps.length > 0 && "border-t border-amber-100",
          )}
        >
          <div className='mb-4 flex flex-wrap items-center justify-between gap-2'>
            <div className='flex items-center gap-2'>
              <MicroLabel className='text-amber-700/80'>Return &amp; refund</MicroLabel>
              {returnLabel ?
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
                    order.returnStatus === "rejected" ?
                      "bg-red-50 text-red-800 ring-red-200"
                    : "bg-white text-amber-900 ring-amber-200",
                  )}
                >
                  {returnLabel}
                </span>
              : null}
            </div>
            <a
              href='#return'
              className='inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-950'
            >
              Manage return <ArrowRight className='h-3.5 w-3.5' />
            </a>
          </div>

          <Stepper steps={returnSteps} tone='amber' />

          {nextStep ?
            <div
              className={cn(
                "mt-5 flex gap-2.5 rounded-xl border px-4 py-3 text-[13px] leading-relaxed",
                order.returnStatus === "rejected" ?
                  "border-red-100 bg-red-50/60 text-red-900"
                : "border-amber-200/70 bg-white text-amber-950",
              )}
            >
              <Info className='mt-0.5 h-4 w-4 shrink-0 opacity-70' />
              <p>
                {returnClosed ? null : <span className='font-semibold'>Next: </span>}
                {nextStep}
              </p>
            </div>
          : null}
        </div>
      : null}
    </AdminOrderSectionCard>
  );
}
