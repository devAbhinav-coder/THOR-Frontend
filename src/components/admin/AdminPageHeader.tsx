"use client";

import { cn } from "@/lib/utils";

type AdminPageHeaderProps = {
  title: string;
  description?: string;
  /** e.g. live data badge */
  badge?: string;
  className?: string;
  /** Right side: buttons, links */
  actions?: React.ReactNode;
};

/**
 * Consistent page title block for admin — typography + spacing aligned app-wide.
 */
export default function AdminPageHeader({
  title,
  description,
  badge,
  className,
  actions,
}: AdminPageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4",
        className
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 gap-y-1">
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-gray-900 tracking-tight">
            {title}
          </h1>
          {badge ? (
            <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-700 ring-1 ring-brand-100">
              {badge}
            </span>
          ) : null}
        </div>
        {description ? (
          <p className="text-gray-500 text-sm mt-1.5 max-w-2xl leading-relaxed">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-shrink-0 flex-wrap items-center gap-2 sm:justify-end">{actions}</div>
      ) : null}
    </div>
  );
}
