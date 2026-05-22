"use client";

import { Sparkles, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { AdminAiFormattedContent } from "./AdminAiFormattedContent";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Props = {
  title: string;
  subtitle?: string;
  loading?: boolean;
  error?: string | null;
  cached?: boolean;
  onRefresh?: () => void;
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
};

export function AdminAiCard({
  title,
  subtitle,
  loading,
  error,
  cached,
  onRefresh,
  children,
  className,
  compact,
}: Props) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50/90 via-white to-amber-50/40 shadow-sm",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-400/10 blur-2xl"
        aria-hidden
      />
      <div className={cn("relative", compact ? "p-4" : "p-5 sm:p-6")}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-brand-600 text-white shadow-md">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="font-semibold text-navy-900 text-sm sm:text-base leading-tight">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-slate-500 mt-0.5 leading-snug">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {cached && (
              <span className="text-[10px] font-medium uppercase tracking-wide text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                Cached
              </span>
            )}
            {onRefresh && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-lg"
                onClick={onRefresh}
                disabled={loading}
                aria-label="Refresh AI"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              </Button>
            )}
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-slate-600 py-6 justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
            Thinking…
          </div>
        )}

        {!loading && error && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2.5 text-sm text-amber-900">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && children}
      </div>
    </div>
  );
}

export function AdminAiBulletList({
  bullets,
  text,
  intro,
}: {
  bullets?: string[];
  text?: string;
  intro?: string;
}) {
  return <AdminAiFormattedContent text={text} bullets={bullets} intro={intro} />;
}
