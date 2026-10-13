"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  X as XIcon,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  Eye,
  Users,
  ShieldCheck,
  UserCheck,
  Smartphone,
  Monitor,
  Tablet,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";
import { inventoryApi } from "@/lib/api";
import type { AdminProductViewsBreakdown } from "@/lib/api-schemas";
import { cn, formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import OrderLineThumbnail from "@/components/orders/OrderLineThumbnail";

export interface ProductViewsBreakdownTarget {
  productId: string;
  productName?: string;
}

type Props = {
  target: ProductViewsBreakdownTarget | null;
  onClose: () => void;
  period?: string;
  year?: number;
  month?: number;
  /** Called after "Recount from log" so parent lists can refetch. */
  onCounterRecounted?: () => void;
};

type RecentFilter = "all" | "shoppers" | "staff";

const DEVICE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  mobile: Smartphone,
  desktop: Monitor,
  tablet: Tablet,
};

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
  accent: string;
}) {
  return (
    <div className='rounded-xl border border-gray-100 bg-white p-3 flex items-start gap-2.5'>
      <div className={cn("p-1.5 rounded-lg shrink-0", accent)}>
        <Icon className='h-3.5 w-3.5' />
      </div>
      <div className='min-w-0'>
        <p className='text-[10px] font-bold uppercase tracking-wide text-gray-400'>
          {label}
        </p>
        <p className='text-lg font-extrabold text-gray-900 tabular-nums leading-tight'>
          {value}
        </p>
        {hint ?
          <p className='text-[10px] text-gray-500 mt-0.5'>{hint}</p>
        : null}
      </div>
    </div>
  );
}

function BucketTable({
  title,
  rows,
  total,
  emptyText,
}: {
  title: string;
  rows: AdminProductViewsBreakdown["bySource"];
  total: number;
  emptyText: string;
}) {
  return (
    <section className='rounded-xl border border-gray-100 overflow-hidden'>
      <div className='px-3.5 py-2 bg-gray-50 border-b border-gray-100'>
        <p className='text-[11px] font-bold uppercase tracking-wide text-gray-600'>
          {title}
        </p>
      </div>
      {rows.length === 0 ?
        <p className='px-3.5 py-4 text-xs text-gray-500'>{emptyText}</p>
      : <table className='w-full text-xs'>
          <thead>
            <tr className='text-[10px] uppercase tracking-wide text-gray-400'>
              <th className='text-left px-3.5 py-1.5 font-semibold'>Source</th>
              <th className='text-right px-3.5 py-1.5 font-semibold'>Views</th>
              <th className='text-right px-3.5 py-1.5 font-semibold'>People</th>
              <th className='text-right px-3.5 py-1.5 font-semibold w-24'>Share</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-50'>
            {rows.map((r) => {
              const pct = total > 0 ? Math.round((r.views / total) * 100) : 0;
              const DevIcon = DEVICE_ICON[r.key];
              return (
                <tr key={r.key}>
                  <td className='px-3.5 py-1.5 font-medium text-gray-800 capitalize'>
                    <span className='inline-flex items-center gap-1.5'>
                      {DevIcon ? <DevIcon className='h-3 w-3 text-gray-400' /> : null}
                      {r.label}
                    </span>
                  </td>
                  <td className='px-3.5 py-1.5 text-right tabular-nums font-bold text-gray-900'>
                    {r.views}
                  </td>
                  <td className='px-3.5 py-1.5 text-right tabular-nums text-gray-600'>
                    {r.sessions}
                  </td>
                  <td className='px-3.5 py-1.5'>
                    <div className='flex items-center gap-1.5 justify-end'>
                      <div className='h-1.5 w-12 rounded-full bg-gray-100 overflow-hidden'>
                        <div
                          className='h-full bg-indigo-400'
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className='tabular-nums text-[10px] text-gray-500 w-7 text-right'>
                        {pct}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      }
    </section>
  );
}

export default function ProductViewsBreakdownModal({
  target,
  onClose,
  period = "lifetime",
  year,
  month,
  onCounterRecounted,
}: Props) {
  const queryClient = useQueryClient();
  const open = Boolean(target);
  const [recentFilter, setRecentFilter] = useState<RecentFilter>("all");
  const [recounting, setRecounting] = useState(false);

  useEffect(() => {
    setRecentFilter("all");
  }, [target?.productId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const params = useMemo(() => {
    const p: { period?: string; year?: number; month?: number } = { period };
    if (period === "year" && year) p.year = year;
    if (period === "month") {
      p.year = year;
      p.month = month;
    }
    return p;
  }, [period, year, month]);

  const queryKey = [
    "admin-product-views-breakdown",
    target?.productId ?? "",
    params,
  ] as const;

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey,
    enabled: open && Boolean(target?.productId),
    queryFn: async () => {
      const res = await inventoryApi.getProductViews(target!.productId, params);
      return res.data.breakdown;
    },
  });

  if (!open || typeof document === "undefined") return null;

  const b = data;
  const recent =
    b?.recent.filter((r) =>
      recentFilter === "all" ? true
      : recentFilter === "staff" ? r.isStaff
      : !r.isStaff,
    ) ?? [];

  const drift = b?.totals.counterDrift ?? 0;
  const isLifetime = period === "lifetime";
  const showDrift = isLifetime && b != null && drift !== 0;
  const maxDay = b ? Math.max(1, ...b.byDay.map((d) => d.views)) : 1;

  // Did the page-view log start after this product went live? Then early views
  // only exist in the counter and a recount would under-report.
  const logStartedAfterLaunch =
    b?.coverage.logStartedAt && b.product.createdAt ?
      new Date(b.coverage.logStartedAt).getTime() >
        new Date(b.product.createdAt).getTime() + 24 * 60 * 60 * 1000
    : false;

  const handleRecountAll = async () => {
    const ok = window.confirm(
      "Recount view counters for ALL products from the page-view log?\n\nEvery product's view number becomes its unique shopper sessions (admin / staff excluded). Products with no logged views go to 0. Storefront “popular” ordering will follow.",
    );
    if (!ok) return;
    setRecounting(true);
    try {
      const res = await inventoryApi.recountAllProductViews();
      toast.success(res.message || "View counters recounted");
      await queryClient.invalidateQueries({
        queryKey: ["admin-product-views-breakdown"],
      });
      onCounterRecounted?.();
      void refetch();
    } catch (e) {
      toast.error((e as { message?: string })?.message || "Recount failed");
    } finally {
      setRecounting(false);
    }
  };

  const handleRecount = async () => {
    if (!target) return;
    const ok = window.confirm(
      `Set this product's view counter to ${b?.totals.uniqueSessions ?? 0} (unique shopper sessions in the page-view log)?${
        logStartedAfterLaunch ?
          "\n\nNote: the page-view log started after this product launched, so earlier views will be dropped."
        : ""
      }`,
    );
    if (!ok) return;
    setRecounting(true);
    try {
      const res = await inventoryApi.recountProductViews(target.productId);
      toast.success(res.message || "View counter updated");
      await queryClient.invalidateQueries({
        queryKey: ["admin-product-views-breakdown"],
      });
      onCounterRecounted?.();
      void refetch();
    } catch (e) {
      toast.error((e as { message?: string })?.message || "Recount failed");
    } finally {
      setRecounting(false);
    }
  };

  return createPortal(
    <div
      className='fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4'
      onClick={onClose}
      role='dialog'
      aria-modal='true'
      aria-label='Product views breakdown'
    >
      <div
        className='bg-white w-full sm:max-w-5xl max-h-[94vh] sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex items-start gap-3 px-4 sm:px-5 py-3.5 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white'>
          {b?.product.image || target?.productName ?
            <div className='w-10 shrink-0' style={{ aspectRatio: "3/4" }}>
              <OrderLineThumbnail
                image={b?.product.image}
                name={b?.product.name ?? target?.productName ?? "Product"}
                className='h-full w-full rounded-lg'
                sizes='40px'
              />
            </div>
          : null}
          <div className='min-w-0 flex-1'>
            <p className='text-[10px] font-bold uppercase tracking-wide text-indigo-700'>
              Product views · where they came from
            </p>
            <h3 className='text-base font-bold text-gray-900 truncate'>
              {b?.product.name ?? target?.productName ?? "Loading…"}
            </h3>
            <p className='text-[11px] text-gray-500'>
              {b?.period.label ?? "—"} · from the storefront page-view log.
              Admin / staff visits are shown separately and never counted.
            </p>
          </div>
          {b ?
            <a
              href={`/shop/${encodeURIComponent(b.product.slug)}`}
              target='_blank'
              rel='noreferrer'
              className='h-8 px-2.5 rounded-lg border border-gray-200 inline-flex items-center gap-1 text-[11px] font-semibold text-gray-600 hover:bg-gray-50 shrink-0'
              title='Open product page in a new tab'
            >
              PDP <ExternalLink className='h-3 w-3' />
            </a>
          : null}
          <button
            type='button'
            onClick={() => void refetch()}
            className='h-8 w-8 rounded-lg border border-gray-200 grid place-items-center hover:bg-gray-50 shrink-0'
            aria-label='Refresh'
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5 text-gray-500", isFetching && "animate-spin")}
            />
          </button>
          <button
            type='button'
            onClick={onClose}
            className='h-8 w-8 rounded-lg hover:bg-gray-100 grid place-items-center shrink-0'
            aria-label='Close'
          >
            <XIcon className='h-4 w-4' />
          </button>
        </div>

        <div className='overflow-y-auto flex-1 px-4 sm:px-5 py-4 space-y-4'>
          {isLoading ?
            <div className='space-y-3'>
              {[...Array(5)].map((_, i) => (
                <div key={i} className='h-12 rounded-xl bg-gray-100 animate-pulse' />
              ))}
            </div>
          : isError || !b ?
            <div className='py-10 text-center text-sm text-gray-500'>
              Could not load views breakdown.
              <div className='mt-3'>
                <Button variant='outline' size='sm' onClick={() => void refetch()}>
                  Retry
                </Button>
              </div>
            </div>
          : <>
              {/* KPIs */}
              <div className='grid grid-cols-2 lg:grid-cols-4 gap-2.5'>
                <Kpi
                  icon={Users}
                  label='Unique shoppers'
                  value={b.totals.uniqueSessions.toLocaleString("en-IN")}
                  hint='Distinct browser sessions · the “true” view number'
                  accent='bg-indigo-100 text-indigo-700'
                />
                <Kpi
                  icon={Eye}
                  label='Page opens'
                  value={b.totals.pageViews.toLocaleString("en-IN")}
                  hint={`${b.totals.uniqueSessionDays.toLocaleString("en-IN")} shopper-days · reloads & re-visits included`}
                  accent='bg-sky-100 text-sky-700'
                />
                <Kpi
                  icon={UserCheck}
                  label='Logged-in shoppers'
                  value={b.totals.loggedInViews.toLocaleString("en-IN")}
                  hint={`${b.totals.guestViews.toLocaleString("en-IN")} guest opens`}
                  accent='bg-emerald-100 text-emerald-700'
                />
                <Kpi
                  icon={ShieldCheck}
                  label='Admin / staff opens'
                  value={b.totals.staffViews.toLocaleString("en-IN")}
                  hint='Excluded from every number above'
                  accent='bg-gray-100 text-gray-600'
                />
              </div>

              {/* Counter vs log */}
              {isLifetime && (
                <div
                  className={cn(
                    "rounded-xl border px-3.5 py-3 flex flex-wrap items-start gap-3",
                    showDrift ?
                      "border-amber-200 bg-amber-50/70"
                    : "border-gray-100 bg-gray-50/60",
                  )}
                >
                  {showDrift ?
                    <AlertTriangle className='h-4 w-4 text-amber-600 mt-0.5 shrink-0' />
                  : <Info className='h-4 w-4 text-gray-400 mt-0.5 shrink-0' />}
                  <div
                    className={cn(
                      "text-xs flex-1 min-w-[12rem]",
                      showDrift ? "text-amber-900" : "text-gray-700",
                    )}
                  >
                    <p className='font-bold'>
                      Catalog counter: {b.totals.counterViewCount.toLocaleString("en-IN")}
                      {" · "}
                      Log says {b.totals.uniqueSessions.toLocaleString("en-IN")} unique shoppers
                      {showDrift ? ` (${drift > 0 ? "+" : ""}${drift})` : " · in sync"}
                    </p>
                    <p
                      className={cn(
                        "text-[11px] mt-0.5 leading-relaxed",
                        showDrift ? "text-amber-800" : "text-gray-500",
                      )}
                    >
                      The counter is the number shown on the product list. It
                      now increments once per shopper per product (30-min
                      server dedupe), skips admin / staff logins and bots.
                      Older numbers were seeded starting values plus every
                      page reload, including your own.
                      {b.coverage.firstLoggedAt ?
                        <>
                          {" "}
                          Log for this product starts{" "}
                          {formatDateTime(b.coverage.firstLoggedAt)}.
                        </>
                      : " No page-view log entries yet for this product."}
                      {logStartedAfterLaunch && b.coverage.logStartedAt ?
                        <>
                          {" "}
                          Store-wide logging began{" "}
                          {formatDateTime(b.coverage.logStartedAt)}, after this
                          product launched, so views before that only exist in
                          the counter.
                        </>
                      : null}
                    </p>
                  </div>
                  {showDrift && (
                    <div className='flex flex-col gap-1.5 items-stretch'>
                      <Button
                        type='button'
                        size='sm'
                        variant='outline'
                        className='rounded-lg h-8 text-xs gap-1.5 bg-white'
                        disabled={recounting}
                        onClick={handleRecount}
                      >
                        <RefreshCw className={cn("h-3.5 w-3.5", recounting && "animate-spin")} />
                        {recounting ? "Recounting…" : "Recount this product"}
                      </Button>
                      <button
                        type='button'
                        disabled={recounting}
                        onClick={handleRecountAll}
                        className='text-[10px] font-semibold text-amber-800 underline underline-offset-2 hover:text-amber-950 disabled:opacity-50'
                      >
                        Recount all products
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Daily trend */}
              {b.byDay.length > 0 && (
                <section className='rounded-xl border border-gray-100 overflow-hidden'>
                  <div className='px-3.5 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between'>
                    <p className='text-[11px] font-bold uppercase tracking-wide text-gray-600'>
                      By day (IST)
                    </p>
                    <p className='text-[10px] text-gray-400'>
                      last {b.byDay.length} active day{b.byDay.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className='px-3.5 py-3 flex items-end gap-[3px] h-24 overflow-x-auto'>
                    {b.byDay.map((d) => (
                      <div
                        key={d.date}
                        className='flex-1 min-w-[6px] max-w-[18px] flex flex-col justify-end h-full group relative'
                        title={`${d.date}: ${d.views} opens · ${d.sessions} shoppers`}
                      >
                        <div
                          className='w-full rounded-t bg-indigo-400 group-hover:bg-indigo-600 transition-colors'
                          style={{ height: `${Math.max(4, (d.views / maxDay) * 100)}%` }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className='px-3.5 pb-2 flex justify-between text-[10px] text-gray-400'>
                    <span>{b.byDay[0]?.date}</span>
                    <span>{b.byDay[b.byDay.length - 1]?.date}</span>
                  </div>
                </section>
              )}

              {/* Breakdown tables */}
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-3'>
                <BucketTable
                  title='Traffic source'
                  rows={b.bySource}
                  total={b.totals.pageViews}
                  emptyText='No shopper views in this period.'
                />
                <BucketTable
                  title='Device'
                  rows={b.byDevice}
                  total={b.totals.pageViews}
                  emptyText='No shopper views in this period.'
                />
                <BucketTable
                  title='Country'
                  rows={b.byCountry}
                  total={b.totals.pageViews}
                  emptyText='No shopper views in this period.'
                />
                <BucketTable
                  title='Campaign (UTM)'
                  rows={b.byCampaign}
                  total={b.totals.pageViews}
                  emptyText='No tagged campaign traffic.'
                />
              </div>

              {/* Recent views */}
              <section className='rounded-xl border border-gray-100 overflow-hidden'>
                <div className='px-3.5 py-2 bg-gray-50 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2'>
                  <p className='text-[11px] font-bold uppercase tracking-wide text-gray-600'>
                    Recent opens ({recent.length})
                  </p>
                  <div className='flex items-center gap-1'>
                    {(
                      [
                        { id: "all", label: "All" },
                        { id: "shoppers", label: "Shoppers" },
                        { id: "staff", label: "Admin / staff" },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type='button'
                        onClick={() => setRecentFilter(f.id)}
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[10px] font-semibold border",
                          recentFilter === f.id ?
                            "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-gray-600 border-gray-200 hover:border-indigo-200",
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
                {recent.length === 0 ?
                  <p className='px-3.5 py-5 text-xs text-gray-500 text-center'>
                    No page opens match.
                  </p>
                : <div className='overflow-x-auto'>
                    <table className='w-full text-xs min-w-[720px]'>
                      <thead>
                        <tr className='text-[10px] uppercase tracking-wide text-gray-400'>
                          <th className='text-left px-3.5 py-2 font-semibold'>When</th>
                          <th className='text-left px-3.5 py-2 font-semibold'>Who</th>
                          <th className='text-left px-3.5 py-2 font-semibold'>Source</th>
                          <th className='text-left px-3.5 py-2 font-semibold'>Device</th>
                          <th className='text-left px-3.5 py-2 font-semibold'>Location</th>
                          <th className='text-left px-3.5 py-2 font-semibold'>Page</th>
                          <th className='text-left px-3.5 py-2 font-semibold'>Session</th>
                        </tr>
                      </thead>
                      <tbody className='divide-y divide-gray-50'>
                        {recent.map((r, idx) => {
                          const DevIcon = r.device ? DEVICE_ICON[r.device] : undefined;
                          return (
                            <tr
                              key={`${r.sessionKey}-${r.at}-${idx}`}
                              className={cn(
                                "hover:bg-gray-50/70",
                                r.isStaff && "text-gray-400",
                              )}
                            >
                              <td className='px-3.5 py-2 whitespace-nowrap'>
                                {formatDateTime(r.at)}
                              </td>
                              <td className='px-3.5 py-2'>
                                <span
                                  className={cn(
                                    "inline-flex px-1.5 py-0.5 rounded-md border text-[10px] font-semibold whitespace-nowrap",
                                    r.isStaff ?
                                      "bg-gray-100 text-gray-500 border-gray-200"
                                    : r.loggedIn ?
                                      "bg-emerald-50 text-emerald-700 border-emerald-100"
                                    : "bg-sky-50 text-sky-700 border-sky-100",
                                  )}
                                >
                                  {r.isStaff ?
                                    "Admin / staff"
                                  : r.loggedIn ?
                                    "Logged-in shopper"
                                  : "Guest"}
                                </span>
                              </td>
                              <td className='px-3.5 py-2'>
                                <p className='font-medium text-gray-800'>
                                  {r.referrerSource || "Direct"}
                                </p>
                                {r.utmSource || r.utmCampaign ?
                                  <p className='text-[10px] text-gray-400 truncate max-w-[160px]'>
                                    {[r.utmSource, r.utmMedium, r.utmCampaign]
                                      .filter(Boolean)
                                      .join(" / ")}
                                  </p>
                                : null}
                              </td>
                              <td className='px-3.5 py-2 capitalize'>
                                <span className='inline-flex items-center gap-1'>
                                  {DevIcon ? <DevIcon className='h-3 w-3 text-gray-400' /> : null}
                                  {r.device || "-"}
                                </span>
                              </td>
                              <td className='px-3.5 py-2 whitespace-nowrap'>
                                {[r.region, r.country].filter(Boolean).join(", ") || (
                                  <span className='text-gray-300'>-</span>
                                )}
                              </td>
                              <td className='px-3.5 py-2 font-mono text-[10px] text-gray-500 truncate max-w-[180px]'>
                                {r.path}
                              </td>
                              <td className='px-3.5 py-2 font-mono text-[10px] text-gray-400'>
                                {r.sessionKey.slice(0, 8)}…
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                }
                {b.truncated && (
                  <p className='px-3.5 py-2 text-[10px] text-amber-700 bg-amber-50 border-t border-amber-100'>
                    Analysed the latest 5,000 page opens only. Narrow the
                    period to see everything.
                  </p>
                )}
              </section>
            </>
          }
        </div>
      </div>
    </div>,
    document.body,
  );
}
