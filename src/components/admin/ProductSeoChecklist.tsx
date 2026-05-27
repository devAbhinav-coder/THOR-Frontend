"use client";

import { useMemo } from "react";
import { AlertCircle, CheckCircle2, CircleAlert, Sparkles } from "lucide-react";
import {
  evaluateProductSeo,
  type ProductSeoFormFields,
  type SeoCheckStatus,
} from "@/lib/productSeoChecklist";
import { cn } from "@/lib/utils";

type Props = ProductSeoFormFields & {
  onApplySuggestion?: (patch: { seoTitle?: string; seoDescription?: string }) => void;
  className?: string;
};

const statusStyles: Record<
  SeoCheckStatus,
  { icon: typeof CheckCircle2; row: string; badge: string }
> = {
  pass: {
    icon: CheckCircle2,
    row: "border-emerald-100 bg-emerald-50/60",
    badge: "text-emerald-700 bg-emerald-100",
  },
  warn: {
    icon: CircleAlert,
    row: "border-amber-100 bg-amber-50/70",
    badge: "text-amber-800 bg-amber-100",
  },
  fail: {
    icon: AlertCircle,
    row: "border-red-100 bg-red-50/70",
    badge: "text-red-700 bg-red-100",
  },
};

const statusLabel: Record<SeoCheckStatus, string> = {
  pass: "OK",
  warn: "Improve",
  fail: "Missing",
};

export default function ProductSeoChecklist({
  onApplySuggestion,
  className,
  ...fields
}: Props) {
  const audit = useMemo(() => evaluateProductSeo(fields), [fields]);

  const canSuggest =
    Boolean(onApplySuggestion) &&
    Boolean(fields.name.trim()) &&
    (!fields.seoTitle.trim() || !fields.seoDescription.trim());

  return (
    <div className={cn("rounded-xl border border-gray-200 bg-white p-4 space-y-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Google SEO checklist
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Helps this saree rank in India — title & meta description for organic search.
          </p>
        </div>
        <span
          className={cn(
            "text-xs font-bold px-2.5 py-1 rounded-full",
            audit.score >= 75 ? "bg-emerald-100 text-emerald-800"
            : audit.score >= 50 ? "bg-amber-100 text-amber-800"
            : "bg-red-100 text-red-700",
          )}
        >
          {audit.score}% ready
        </span>
      </div>

      <ul className="space-y-2">
        {audit.items.map((item) => {
          const style = statusStyles[item.status];
          const Icon = style.icon;
          return (
            <li
              key={item.id}
              className={cn(
                "flex gap-2.5 rounded-lg border px-3 py-2.5 text-sm",
                style.row,
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", item.status === "pass" ? "text-emerald-600" : item.status === "warn" ? "text-amber-600" : "text-red-600")} aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-gray-900">{item.label}</span>
                  <span className={cn("text-[10px] font-bold uppercase px-1.5 py-0.5 rounded", style.badge)}>
                    {statusLabel[item.status]}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{item.detail}</p>
              </div>
            </li>
          );
        })}
      </ul>

      {canSuggest && (
        <div className="rounded-lg border border-brand-100 bg-brand-50/50 p-3 space-y-2">
          <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-brand-600" aria-hidden />
            Suggested copy (edit after applying)
          </p>
          <p className="text-xs text-gray-600">
            <span className="font-medium text-gray-800">Title:</span> {audit.suggestedTitle}
          </p>
          <p className="text-xs text-gray-600">
            <span className="font-medium text-gray-800">Description:</span> {audit.suggestedDescription}
          </p>
          <button
            type="button"
            onClick={() =>
              onApplySuggestion?.({
                ...(!fields.seoTitle.trim() ? { seoTitle: audit.suggestedTitle } : {}),
                ...(!fields.seoDescription.trim() ?
                  { seoDescription: audit.suggestedDescription }
                : {}),
              })
            }
            className="text-xs font-semibold text-brand-700 hover:text-brand-800 underline-offset-2 hover:underline"
          >
            Apply suggestions to empty fields
          </button>
        </div>
      )}

      {audit.hasBlockingIssues && (
        <p className="text-xs text-red-700 font-medium">
          Fix red items before publishing for best Google visibility.
        </p>
      )}
    </div>
  );
}
