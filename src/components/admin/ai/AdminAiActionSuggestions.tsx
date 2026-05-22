"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Zap } from "lucide-react";
import { adminAiApi } from "@/lib/adminAiApi";
import { cn } from "@/lib/utils";
import { AdminAiCard } from "./AdminAiCard";
import { AdminAiFormattedContent } from "./AdminAiFormattedContent";
import { useAdminAiStatus, aiErrorMessage } from "./useAdminAi";
import type { AdminAiRuleAction, AdminAiTextResult } from "./types";

const priorityStyles = {
  high: "border-rose-200 bg-rose-50/60 text-rose-900",
  medium: "border-amber-200 bg-amber-50/60 text-amber-900",
  low: "border-slate-200 bg-slate-50/80 text-slate-700",
};

export function AdminAiActionSuggestions() {
  const { status, loading: statusLoading } = useAdminAiStatus();
  const [rules, setRules] = useState<AdminAiRuleAction[]>([]);
  const [summary, setSummary] = useState<AdminAiTextResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!status?.enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await adminAiApi.getActionSuggestions();
      const d = res.data as { rules: AdminAiRuleAction[]; summary?: AdminAiTextResult | null };
      setRules(d.rules || []);
      setSummary(d.summary ?? null);
    } catch (e) {
      setError(aiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [status?.enabled]);

  useEffect(() => {
    if (!statusLoading && status?.enabled) load();
  }, [statusLoading, status?.enabled, load]);

  if (statusLoading || !status?.enabled) return null;
  if (!loading && !error && rules.length === 0) return null;

  return (
    <AdminAiCard
      title="Smart actions"
      subtitle="Priority tasks + profit & costs snapshot"
      loading={loading && rules.length === 0}
      error={error}
      onRefresh={load}
      compact
    >
      {summary?.text && (
        <div className="mb-4 border-b border-violet-100 pb-3">
          <AdminAiFormattedContent
            text={summary.text}
            bullets={summary.bullets}
            intro={summary.intro}
          />
        </div>
      )}
      <ul className="space-y-2">
        {rules.map((a) => (
          <li
            key={a.id}
            className={cn(
              "rounded-xl border px-3 py-2.5 flex items-start justify-between gap-2",
              priorityStyles[a.priority],
            )}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 shrink-0 opacity-70" />
                <span className="font-semibold text-sm">{a.title}</span>
              </div>
              <p className="text-xs mt-0.5 opacity-90 leading-snug">{a.detail}</p>
            </div>
            {a.href && (
              <Link
                href={a.href}
                className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-white/80 hover:bg-white transition"
                aria-label={`Go to ${a.title}`}
              >
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            )}
          </li>
        ))}
      </ul>
    </AdminAiCard>
  );
}
