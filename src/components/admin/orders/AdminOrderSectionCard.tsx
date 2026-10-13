"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SectionTone =
  | "default"
  | "brand"
  | "navy"
  | "amber"
  | "emerald"
  | "red"
  | "violet"
  | "sky";

const TONE_ICON: Record<SectionTone, string> = {
  default: "bg-gray-100 text-gray-700",
  brand: "bg-brand-50 text-brand-700 ring-1 ring-brand-100",
  navy: "bg-navy-50 text-navy-700 ring-1 ring-navy-100",
  amber: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  emerald: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  red: "bg-red-50 text-red-700 ring-1 ring-red-100",
  violet: "bg-violet-50 text-violet-700 ring-1 ring-violet-100",
  sky: "bg-sky-50 text-sky-700 ring-1 ring-sky-100",
};

type Props = {
  id?: string;
  title: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  tone?: SectionTone;
  /** Right side of the header - buttons, badges */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Remove body padding (tables, lists with their own padding) */
  flush?: boolean;
};

/**
 * Consistent section card for the admin order workspace.
 * Header (icon + title + optional action) and padded body.
 */
export default function AdminOrderSectionCard({
  id,
  title,
  description,
  icon: Icon,
  tone = "default",
  action,
  children,
  className,
  bodyClassName,
  flush,
}: Props) {
  return (
    <section
      id={id}
      className={cn(
        "bg-white rounded-2xl border border-gray-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-24px_rgba(15,23,42,0.18)] overflow-hidden scroll-mt-24",
        className,
      )}
    >
      <header className='px-5 py-3.5 border-b border-gray-100 flex items-start justify-between gap-3'>
        <div className='flex items-start gap-3 min-w-0'>
          {Icon ?
            <span
              className={cn(
                "mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                TONE_ICON[tone],
              )}
              aria-hidden
            >
              <Icon className='h-4 w-4' />
            </span>
          : null}
          <div className='min-w-0'>
            <h2 className='text-sm font-semibold text-gray-900 leading-tight'>
              {title}
            </h2>
            {description ?
              <p className='text-xs text-gray-500 mt-0.5 leading-snug'>
                {description}
              </p>
            : null}
          </div>
        </div>
        {action ?
          <div className='flex items-center gap-2 shrink-0'>{action}</div>
        : null}
      </header>
      <div className={cn(!flush && "p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

/** Small label/value row for dl-style metadata */
export function MetaRow({
  label,
  children,
  mono,
  className,
}: {
  label: ReactNode;
  children: ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 text-sm py-1.5",
        className,
      )}
    >
      <dt className='text-gray-500 shrink-0'>{label}</dt>
      <dd
        className={cn(
          "text-gray-900 text-right min-w-0 break-words",
          mono && "font-mono text-[13px]",
        )}
      >
        {children}
      </dd>
    </div>
  );
}

/** Uppercase micro label */
export function MicroLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400",
        className,
      )}
    >
      {children}
    </p>
  );
}
