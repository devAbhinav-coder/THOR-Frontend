"use client";

import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { adminAiApi } from "@/lib/adminAiApi";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AdminAiFormattedContent } from "./AdminAiFormattedContent";
import Link from "next/link";
import { useAdminAiStatus, aiErrorMessage } from "./useAdminAi";
import type { AdminAiTextResult } from "./types";

type ExplainKind = "order" | "user" | "returns";

type Props = {
  kind: ExplainKind;
  orderId?: string;
  userId?: string;
  label?: string;
  className?: string;
};

export function AdminAiExplainButton({
  kind,
  orderId,
  userId,
  label = "AI explain",
  className,
}: Props) {
  const { status } = useAdminAiStatus();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AdminAiTextResult | null>(null);

  if (!status?.enabled) return null;

  const run = async () => {
    setOpen(true);
    setLoading(true);
    setError(null);
    setData(null);
    try {
      let res;
      if (kind === "order" && orderId) res = await adminAiApi.explainOrder(orderId);
      else if (kind === "user" && userId) res = await adminAiApi.explainUser(userId);
      else if (kind === "returns") res = await adminAiApi.explainReturns();
      else throw new Error("Missing context for AI explain.");
      setData(res.data as AdminAiTextResult);
    } catch (e) {
      setError(aiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-xl border-violet-200 bg-violet-50/50 text-violet-900 hover:bg-violet-100 gap-1.5"
        onClick={() => {
          if (open && data) setOpen(false);
          else void run();
        }}
        disabled={loading}
      >
        <Sparkles className="h-3.5 w-3.5" />
        {loading ? "Analyzing…" : label}
      </Button>

      {open && (
        <div className="absolute z-50 left-0 sm:left-auto sm:right-0 mt-2 w-[min(calc(100vw-2rem),26rem)] rounded-xl border border-violet-200 bg-white shadow-xl p-4 max-h-[min(70vh,24rem)] overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wide text-violet-800">
              Rani AI
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 rounded-lg hover:bg-slate-100"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {loading && (
            <p className="text-sm text-slate-500 py-4 text-center">Thinking…</p>
          )}
          {error && <p className="text-sm text-amber-800">{error}</p>}
          {data && !loading && (
            <>
              {data.cached && (
                <span className="text-[10px] text-emerald-600 font-medium block mb-2">Cached</span>
              )}
              <AdminAiFormattedContent
                text={data.text}
                bullets={data.bullets}
                intro={data.intro}
              />
              <Link
                href="/admin/ai"
                className="mt-3 inline-flex text-xs font-semibold text-violet-700 hover:text-violet-900"
              >
                Ask more in Business Assistant →
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
