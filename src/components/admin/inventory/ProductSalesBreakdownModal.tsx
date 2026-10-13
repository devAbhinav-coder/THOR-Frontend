"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  X as XIcon,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  ShoppingBag,
  Clock3,
  RotateCcw,
  Ban,
} from "lucide-react";
import toast from "react-hot-toast";
import { inventoryApi } from "@/lib/api";
import type { AdminProductSalesBreakdown } from "@/lib/api-schemas";
import { cn, formatPrice, formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import OrderLineThumbnail from "@/components/orders/OrderLineThumbnail";

export interface ProductSalesBreakdownTarget {
  productId: string;
  productName?: string;
  sku?: string;
}

type Props = {
  target: ProductSalesBreakdownTarget | null;
  onClose: () => void;
  period?: string;
  year?: number;
  month?: number;
  /** Called after "Re-sync counter" so parent lists can refetch. */
  onCountersSynced?: () => void;
};

type LineFilter = "all" | "counted" | "not_counted";

const BUCKET_STYLES: Record<
  AdminProductSalesBreakdown["lines"][number]["bucket"],
  { label: string; cls: string }
> = {
  paid: { label: "Paid · counted", cls: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  pending: { label: "Awaiting payment", cls: "bg-amber-50 text-amber-700 border-amber-100" },
  refunded: { label: "Refunded", cls: "bg-purple-50 text-purple-700 border-purple-100" },
  cancelled: { label: "Cancelled", cls: "bg-gray-100 text-gray-500 border-gray-200" },
};

const CHANNEL_STYLES: Record<string, string> = {
  website_prepaid: "bg-brand-50 text-brand-700 border-brand-100",
  website_cod: "bg-blue-50 text-blue-700 border-blue-100",
  stall: "bg-orange-50 text-orange-700 border-orange-100",
  personal_contact: "bg-pink-50 text-pink-700 border-pink-100",
  b2b: "bg-navy-50 text-navy-700 border-navy-100",
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

function variantLabel(l: { size?: string; color?: string; sku: string }) {
  const v = [l.size, l.color].filter(Boolean).join(" / ");
  return v || l.sku;
}

export default function ProductSalesBreakdownModal({
  target,
  onClose,
  period = "lifetime",
  year,
  month,
  onCountersSynced,
}: Props) {
  const queryClient = useQueryClient();
  const open = Boolean(target);
  const [skuFilter, setSkuFilter] = useState<string>("");
  const [lineFilter, setLineFilter] = useState<LineFilter>("all");
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setSkuFilter(target?.sku ?? "");
    setLineFilter("all");
  }, [target?.productId, target?.sku]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const params = useMemo(() => {
    const p: { sku?: string; period?: string; year?: number; month?: number } =
      { period };
    if (skuFilter) p.sku = skuFilter;
    if (period === "year" && year) p.year = year;
    if (period === "month") {
      p.year = year;
      p.month = month;
    }
    return p;
  }, [skuFilter, period, year, month]);

  const queryKey = [
    "admin-product-sales-breakdown",
    target?.productId ?? "",
    params,
  ] as const;

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey,
    enabled: open && Boolean(target?.productId),
    queryFn: async () => {
      const res = await inventoryApi.getProductSales(
        target!.productId,
        params,
      );
      return res.data.breakdown;
    },
  });

  if (!open || typeof document === "undefined") return null;

  const b = data;
  const lines =
    b?.lines.filter((l) =>
      lineFilter === "all" ? true
      : lineFilter === "counted" ? l.counted
      : !l.counted,
    ) ?? [];

  const drift = b?.totals.counterDrift ?? 0;
  const showDrift = period === "lifetime" && b != null && drift !== 0;

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await inventoryApi.recalculateSoldCounters();
      toast.success(res.message || "Sold counters re-synced");
      await queryClient.invalidateQueries({
        queryKey: ["admin-product-sales-breakdown"],
      });
      onCountersSynced?.();
      void refetch();
    } catch (e) {
      toast.error((e as { message?: string })?.message || "Re-sync failed");
    } finally {
      setSyncing(false);
    }
  };

  return createPortal(
    <div
      className='fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4'
      onClick={onClose}
      role='dialog'
      aria-modal='true'
      aria-label='Sold units breakdown'
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
            <p className='text-[10px] font-bold uppercase tracking-wide text-brand-700'>
              Sold units · source of truth
            </p>
            <h3 className='text-base font-bold text-gray-900 truncate'>
              {b?.product.name ?? target?.productName ?? "Loading…"}
            </h3>
            <p className='text-[11px] text-gray-500'>
              {b?.period.label ?? "—"} · counted from{" "}
              <strong>paid order lines</strong> (website + offline + B2B). Same
              number as Revenue, Analytics and Dashboard.
            </p>
          </div>
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
              Could not load sales breakdown.
              <div className='mt-3'>
                <Button variant='outline' size='sm' onClick={() => void refetch()}>
                  Retry
                </Button>
              </div>
            </div>
          : <>
              {/* SKU chips */}
              {b.bySku.length > 1 && (
                <div className='flex flex-wrap items-center gap-1.5'>
                  <span className='text-[10px] font-bold uppercase text-gray-400 mr-1'>
                    SKU
                  </span>
                  <button
                    type='button'
                    onClick={() => setSkuFilter("")}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors",
                      skuFilter === "" ?
                        "bg-navy-900 text-white border-navy-900"
                      : "bg-white text-gray-600 border-gray-200 hover:border-brand-200",
                    )}
                  >
                    All SKUs
                  </button>
                  {b.bySku.map((s) => (
                    <button
                      key={s.sku}
                      type='button'
                      onClick={() => setSkuFilter(s.sku)}
                      title={s.sku}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors inline-flex items-center gap-1.5",
                        skuFilter === s.sku ?
                          "bg-navy-900 text-white border-navy-900"
                        : "bg-white text-gray-600 border-gray-200 hover:border-brand-200",
                      )}
                    >
                      {variantLabel(s)}
                      <span
                        className={cn(
                          "tabular-nums text-[10px] px-1 rounded",
                          skuFilter === s.sku ?
                            "bg-white/20"
                          : "bg-gray-100 text-gray-700",
                        )}
                      >
                        {s.paidUnits}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* KPIs */}
              <div className='grid grid-cols-2 lg:grid-cols-4 gap-2.5'>
                <Kpi
                  icon={ShoppingBag}
                  label='Sold (paid)'
                  value={b.totals.paidUnits.toLocaleString("en-IN")}
                  hint={`${b.totals.paidOrders} order${b.totals.paidOrders === 1 ? "" : "s"} · ${formatPrice(b.totals.paidRevenue)}`}
                  accent='bg-emerald-100 text-emerald-700'
                />
                <Kpi
                  icon={Clock3}
                  label='Reserved · unpaid'
                  value={b.totals.pendingUnits.toLocaleString("en-IN")}
                  hint={
                    b.totals.pendingUnits > 0 ?
                      `${b.totals.pendingOrders} order${b.totals.pendingOrders === 1 ? "" : "s"} · COD in transit / payment pending`
                    : "Nothing pending"
                  }
                  accent='bg-amber-100 text-amber-700'
                />
                <Kpi
                  icon={RotateCcw}
                  label='Refunded'
                  value={b.totals.refundedUnits.toLocaleString("en-IN")}
                  hint='Was paid, then refunded / returned'
                  accent='bg-purple-100 text-purple-700'
                />
                <Kpi
                  icon={Ban}
                  label='Cancelled'
                  value={b.totals.cancelledUnits.toLocaleString("en-IN")}
                  hint='Never counted'
                  accent='bg-gray-100 text-gray-600'
                />
              </div>

              {/* Counter drift */}
              {showDrift && (
                <div className='rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-3 flex flex-wrap items-start gap-3'>
                  <AlertTriangle className='h-4 w-4 text-amber-600 mt-0.5 shrink-0' />
                  <div className='text-xs text-amber-900 flex-1 min-w-[12rem]'>
                    <p className='font-bold'>
                      Catalog counter shows {b.totals.counterUnits}, paid orders
                      show {b.totals.paidUnits} ({drift > 0 ? "+" : ""}
                      {drift}).
                    </p>
                    <p className='text-[11px] text-amber-800 mt-0.5 leading-relaxed'>
                      The counter is bumped when stock is <em>reserved</em>{" "}
                      (checkout hold, COD placed, offline order created) and
                      lags behind payments / cancellations. Admin pages now use
                      paid orders; the counter only affects storefront
                      “bestsellers” ranking. Re-sync it from order history any
                      time.
                    </p>
                  </div>
                  <Button
                    type='button'
                    size='sm'
                    variant='outline'
                    className='rounded-lg h-8 text-xs gap-1.5 bg-white'
                    disabled={syncing}
                    onClick={handleSync}
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5", syncing && "animate-spin")} />
                    {syncing ? "Syncing…" : "Re-sync counter"}
                  </Button>
                </div>
              )}

              {/* By channel */}
              <section className='rounded-xl border border-gray-100 overflow-hidden'>
                <div className='px-3.5 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between'>
                  <p className='text-[11px] font-bold uppercase tracking-wide text-gray-600'>
                    By channel / source
                  </p>
                  <p className='text-[10px] text-gray-400'>paid lines only</p>
                </div>
                {b.byChannel.length === 0 ?
                  <p className='px-3.5 py-4 text-xs text-gray-500'>
                    No orders for this {skuFilter ? "SKU" : "product"} in this
                    period.
                  </p>
                : <table className='w-full text-xs'>
                    <thead>
                      <tr className='text-[10px] uppercase tracking-wide text-gray-400'>
                        <th className='text-left px-3.5 py-2 font-semibold'>Channel</th>
                        <th className='text-right px-3.5 py-2 font-semibold'>Orders</th>
                        <th className='text-right px-3.5 py-2 font-semibold'>Units</th>
                        <th className='text-right px-3.5 py-2 font-semibold'>Revenue</th>
                        <th className='text-right px-3.5 py-2 font-semibold'>Unpaid units</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-50'>
                      {b.byChannel.map((c) => (
                        <tr key={c.channel}>
                          <td className='px-3.5 py-2'>
                            <span
                              className={cn(
                                "inline-flex px-2 py-0.5 rounded-md border text-[11px] font-semibold",
                                CHANNEL_STYLES[c.channel] ??
                                  "bg-gray-50 text-gray-700 border-gray-200",
                              )}
                            >
                              {c.label}
                            </span>
                          </td>
                          <td className='px-3.5 py-2 text-right tabular-nums'>{c.orders}</td>
                          <td className='px-3.5 py-2 text-right tabular-nums font-bold text-gray-900'>
                            {c.units}
                          </td>
                          <td className='px-3.5 py-2 text-right tabular-nums font-semibold text-brand-800'>
                            {formatPrice(c.revenue)}
                          </td>
                          <td className='px-3.5 py-2 text-right tabular-nums text-amber-700'>
                            {c.pendingUnits > 0 ? c.pendingUnits : <span className='text-gray-300'>-</span>}
                          </td>
                        </tr>
                      ))}
                      <tr className='bg-gray-50/70 font-bold'>
                        <td className='px-3.5 py-2 text-gray-700'>Total</td>
                        <td className='px-3.5 py-2 text-right tabular-nums'>{b.totals.paidOrders}</td>
                        <td className='px-3.5 py-2 text-right tabular-nums text-gray-900'>
                          {b.totals.paidUnits}
                        </td>
                        <td className='px-3.5 py-2 text-right tabular-nums text-brand-800'>
                          {formatPrice(b.totals.paidRevenue)}
                        </td>
                        <td className='px-3.5 py-2 text-right tabular-nums text-amber-700'>
                          {b.totals.pendingUnits > 0 ? b.totals.pendingUnits : <span className='text-gray-300'>-</span>}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                }
              </section>

              {/* Per SKU (only when viewing all SKUs) */}
              {!skuFilter && b.bySku.length > 1 && (
                <section className='rounded-xl border border-gray-100 overflow-hidden'>
                  <div className='px-3.5 py-2 bg-gray-50 border-b border-gray-100'>
                    <p className='text-[11px] font-bold uppercase tracking-wide text-gray-600'>
                      Per SKU
                    </p>
                  </div>
                  <div className='overflow-x-auto'>
                    <table className='w-full text-xs min-w-[520px]'>
                      <thead>
                        <tr className='text-[10px] uppercase tracking-wide text-gray-400'>
                          <th className='text-left px-3.5 py-2 font-semibold'>Variant</th>
                          <th className='text-left px-3.5 py-2 font-semibold'>SKU</th>
                          <th className='text-right px-3.5 py-2 font-semibold'>Stock</th>
                          <th className='text-right px-3.5 py-2 font-semibold'>Sold</th>
                          <th className='text-right px-3.5 py-2 font-semibold'>Unpaid</th>
                          <th className='text-right px-3.5 py-2 font-semibold'>Refunded</th>
                          <th className='text-right px-3.5 py-2 font-semibold'>Cancelled</th>
                          {period === "lifetime" && (
                            <th className='text-right px-3.5 py-2 font-semibold'>Counter</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className='divide-y divide-gray-50'>
                        {b.bySku.map((s) => (
                          <tr
                            key={s.sku}
                            className='hover:bg-gray-50/70 cursor-pointer'
                            onClick={() => setSkuFilter(s.sku)}
                            title='Show only this SKU'
                          >
                            <td className='px-3.5 py-2 font-medium text-gray-800'>
                              {variantLabel(s)}
                            </td>
                            <td className='px-3.5 py-2 font-mono text-[11px] text-gray-500'>{s.sku}</td>
                            <td className='px-3.5 py-2 text-right tabular-nums'>{s.stock}</td>
                            <td className='px-3.5 py-2 text-right tabular-nums font-bold text-gray-900'>
                              {s.paidUnits}
                            </td>
                            <td className='px-3.5 py-2 text-right tabular-nums text-amber-700'>
                              {s.pendingUnits || <span className='text-gray-300'>-</span>}
                            </td>
                            <td className='px-3.5 py-2 text-right tabular-nums text-purple-700'>
                              {s.refundedUnits || <span className='text-gray-300'>-</span>}
                            </td>
                            <td className='px-3.5 py-2 text-right tabular-nums text-gray-500'>
                              {s.cancelledUnits || <span className='text-gray-300'>-</span>}
                            </td>
                            {period === "lifetime" && (
                              <td
                                className={cn(
                                  "px-3.5 py-2 text-right tabular-nums",
                                  s.counterUnits !== s.paidUnits ?
                                    "text-amber-700 font-semibold"
                                  : "text-gray-400",
                                )}
                              >
                                {s.counterUnits}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* Order lines */}
              <section className='rounded-xl border border-gray-100 overflow-hidden'>
                <div className='px-3.5 py-2 bg-gray-50 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2'>
                  <p className='text-[11px] font-bold uppercase tracking-wide text-gray-600'>
                    Orders ({lines.length})
                  </p>
                  <div className='flex items-center gap-1'>
                    {(
                      [
                        { id: "all", label: "All" },
                        { id: "counted", label: "Counted" },
                        { id: "not_counted", label: "Not counted" },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type='button'
                        onClick={() => setLineFilter(f.id)}
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[10px] font-semibold border",
                          lineFilter === f.id ?
                            "bg-brand-600 text-white border-brand-600"
                          : "bg-white text-gray-600 border-gray-200 hover:border-brand-200",
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
                {lines.length === 0 ?
                  <p className='px-3.5 py-5 text-xs text-gray-500 text-center'>
                    No order lines match.
                  </p>
                : <div className='overflow-x-auto'>
                    <table className='w-full text-xs min-w-[760px]'>
                      <thead>
                        <tr className='text-[10px] uppercase tracking-wide text-gray-400'>
                          <th className='text-left px-3.5 py-2 font-semibold'>Order</th>
                          <th className='text-left px-3.5 py-2 font-semibold'>Date</th>
                          <th className='text-left px-3.5 py-2 font-semibold'>Customer</th>
                          <th className='text-left px-3.5 py-2 font-semibold'>Channel</th>
                          <th className='text-left px-3.5 py-2 font-semibold'>Variant</th>
                          <th className='text-right px-3.5 py-2 font-semibold'>Qty</th>
                          <th className='text-right px-3.5 py-2 font-semibold'>Line total</th>
                          <th className='text-left px-3.5 py-2 font-semibold'>Counted?</th>
                          <th className='text-left px-3.5 py-2 font-semibold'>Order status</th>
                        </tr>
                      </thead>
                      <tbody className='divide-y divide-gray-50'>
                        {lines.map((l, idx) => {
                          const bucket = BUCKET_STYLES[l.bucket];
                          return (
                            <tr
                              key={`${l.orderId}-${l.sku}-${idx}`}
                              className={cn(
                                "hover:bg-gray-50/70",
                                !l.counted && "text-gray-500",
                              )}
                            >
                              <td className='px-3.5 py-2'>
                                <a
                                  href={`/admin/orders/${encodeURIComponent(l.orderId)}`}
                                  target='_blank'
                                  rel='noreferrer'
                                  className='inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-brand-700 hover:underline'
                                  title='Open order in a new tab'
                                >
                                  {l.orderNumber}
                                  <ExternalLink className='h-3 w-3' />
                                </a>
                              </td>
                              <td className='px-3.5 py-2 whitespace-nowrap'>
                                {formatDateTime(l.createdAt)}
                              </td>
                              <td className='px-3.5 py-2 max-w-[140px] truncate'>
                                {l.customerName || <span className='text-gray-300'>-</span>}
                              </td>
                              <td className='px-3.5 py-2'>
                                <span
                                  className={cn(
                                    "inline-flex px-1.5 py-0.5 rounded-md border text-[10px] font-semibold whitespace-nowrap",
                                    CHANNEL_STYLES[l.channel] ??
                                      "bg-gray-50 text-gray-700 border-gray-200",
                                  )}
                                >
                                  {l.channelLabel}
                                </span>
                              </td>
                              <td className='px-3.5 py-2'>
                                <p className='font-medium text-gray-800'>{variantLabel(l)}</p>
                                <p className='font-mono text-[10px] text-gray-400'>{l.sku}</p>
                              </td>
                              <td className='px-3.5 py-2 text-right tabular-nums font-bold text-gray-900'>
                                {l.quantity}
                              </td>
                              <td className='px-3.5 py-2 text-right tabular-nums'>
                                <p className='font-semibold'>{formatPrice(l.lineTotal)}</p>
                                <p className='text-[10px] text-gray-400'>
                                  {l.quantity} × {formatPrice(l.price)}
                                </p>
                              </td>
                              <td className='px-3.5 py-2'>
                                <span
                                  className={cn(
                                    "inline-flex px-1.5 py-0.5 rounded-md border text-[10px] font-semibold whitespace-nowrap",
                                    bucket.cls,
                                  )}
                                >
                                  {bucket.label}
                                </span>
                              </td>
                              <td className='px-3.5 py-2 capitalize whitespace-nowrap'>
                                {l.status}
                                <span className='block text-[10px] text-gray-400'>
                                  pay: {l.paymentStatus} · {l.paymentMethod.replace("_", " ")}
                                </span>
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
                    Showing the latest 600 orders only. Narrow the period or
                    SKU to see everything.
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
