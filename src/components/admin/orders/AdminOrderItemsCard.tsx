"use client";

import Link from "next/link";
import { ExternalLink, Package } from "lucide-react";
import type { Order } from "@/types";
import OrderLineThumbnail from "@/components/orders/OrderLineThumbnail";
import OrderLineCogEditor from "@/components/admin/orders/OrderLineCogEditor";
import {
  isUsableOrderLineImage,
  isManualOfflineOrderLine,
} from "@/lib/offlineOrder";
import { cn, formatPrice } from "@/lib/utils";
import AdminOrderSectionCard from "./AdminOrderSectionCard";
import AdminCopyButton from "./AdminCopyButton";

function productSlug(it: Order["items"][number]): string | null {
  if (it.slug) return it.slug;
  if (typeof it.product === "object" && it.product && "slug" in it.product) {
    return (it.product as { slug?: string }).slug ?? null;
  }
  return null;
}

export default function AdminOrderItemsCard({
  order,
  onZoom,
  onLineCostSaved,
}: {
  order: Order;
  onZoom: (src: string) => void;
  onLineCostSaved: (lineIndex: number, costAtSale: number) => void;
}) {
  const items = order.items ?? [];
  const totalQty = items.reduce((s, it) => s + (it.quantity || 0), 0);
  const itemsSubtotal = items.reduce(
    (s, it) => s + (it.price || 0) * (it.quantity || 0),
    0,
  );
  const cogsKnown = items.every(
    (it) => isManualOfflineOrderLine(it) ? (it.costAtSale ?? 0) > 0 : true,
  );
  const totalCogs = items.reduce(
    (s, it) => s + (it.costAtSale ?? 0) * (it.quantity || 0),
    0,
  );
  const hasAnyCogs = items.some((it) => (it.costAtSale ?? 0) > 0);

  return (
    <AdminOrderSectionCard
      id='items'
      icon={Package}
      tone='brand'
      title={
        <>
          Items{" "}
          <span className='text-gray-400 font-medium'>
            · {items.length} line{items.length === 1 ? "" : "s"} · {totalQty} pc
            {totalQty === 1 ? "" : "s"}
          </span>
        </>
      }
      flush
    >
      <ul className='divide-y divide-gray-100'>
        {items.map((it, idx) => {
          const isManual = isManualOfflineOrderLine(it);
          const usableImg = isUsableOrderLineImage(it.image, {
            isOfflineManual: isManual,
          });
          const slug = productSlug(it);
          const variantBits = [it.variant?.size, it.variant?.color].filter(
            Boolean,
          ) as string[];
          const lineTotal = (it.price || 0) * (it.quantity || 0);
          const unitCogs = it.costAtSale ?? 0;
          const margin =
            unitCogs > 0 && it.price > 0 ?
              Math.round(((it.price - unitCogs) / it.price) * 100)
            : null;

          return (
            <li
              key={idx}
              className='group px-5 py-4 flex gap-4 hover:bg-gray-50/70 transition-colors'
            >
              <OrderLineThumbnail
                image={it.image}
                name={it.name}
                isOfflineManual={isManual}
                className={cn(
                  "h-[72px] w-[60px] rounded-xl shadow-sm transition-transform",
                  usableImg && "group-hover:scale-[1.03] group-hover:border-brand-300",
                )}
                sizes='60px'
                onClick={() => {
                  if (usableImg) onZoom(it.image!);
                }}
              />

              <div className='flex-1 min-w-0'>
                <div className='flex items-start justify-between gap-4'>
                  <div className='min-w-0'>
                    <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
                      <p className='text-sm font-semibold text-gray-900 leading-snug'>
                        {it.name}
                      </p>
                      {isManual ?
                        <span className='text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border border-amber-200 bg-amber-50 text-amber-800'>
                          Manual line
                        </span>
                      : null}
                      {slug ?
                        <Link
                          href={`/shop/${encodeURIComponent(slug)}`}
                          target='_blank'
                          className='inline-flex items-center gap-0.5 text-[11px] font-semibold text-brand-700 hover:underline'
                        >
                          View <ExternalLink className='h-3 w-3' />
                        </Link>
                      : null}
                    </div>

                    <div className='mt-1.5 flex flex-wrap items-center gap-1.5'>
                      {variantBits.map((b) => (
                        <span
                          key={b}
                          className='inline-flex items-center rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-700'
                        >
                          {b}
                        </span>
                      ))}
                      {it.variant?.colorCode ?
                        <span
                          className='h-3.5 w-3.5 rounded-full border border-gray-200'
                          style={{ backgroundColor: it.variant.colorCode }}
                          title={it.variant.color}
                        />
                      : null}
                      {it.variant?.sku ?
                        <span className='inline-flex items-center gap-0.5 text-[11px] text-gray-500 font-mono'>
                          {it.variant.sku}
                          <AdminCopyButton value={it.variant.sku} label='Copy SKU' iconOnly />
                        </span>
                      : null}
                      {it.lineCategory ?
                        <span className='text-[11px] text-gray-500'>
                          · {it.lineCategory}
                        </span>
                      : null}
                    </div>
                  </div>

                  <div className='text-right shrink-0'>
                    <p className='text-sm font-bold text-gray-900 tabular-nums'>
                      {formatPrice(lineTotal)}
                    </p>
                    <p className='text-[11px] text-gray-500 tabular-nums mt-0.5'>
                      {it.quantity} × {formatPrice(it.price)}
                    </p>
                  </div>
                </div>

                {(unitCogs > 0 || isManual) && (
                  <div className='mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px]'>
                    {unitCogs > 0 ?
                      <>
                        <span className='text-gray-500'>
                          COGS{" "}
                          <span className='font-semibold text-gray-800 tabular-nums'>
                            {formatPrice(unitCogs)}
                          </span>{" "}
                          / unit
                        </span>
                        {margin !== null ?
                          <span
                            className={cn(
                              "inline-flex items-center rounded-md px-1.5 py-0.5 font-semibold tabular-nums",
                              margin >= 40 ? "bg-emerald-50 text-emerald-800"
                              : margin >= 15 ? "bg-amber-50 text-amber-800"
                              : "bg-red-50 text-red-800",
                            )}
                          >
                            {margin}% margin
                          </span>
                        : null}
                      </>
                    : null}
                    {isManual ?
                      <OrderLineCogEditor
                        orderId={order._id}
                        lineIndex={idx}
                        quantity={it.quantity}
                        unitPrice={it.price}
                        costAtSale={it.costAtSale}
                        onSaved={(saved) => onLineCostSaved(idx, saved)}
                      />
                    : null}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className='px-5 py-3 border-t border-gray-100 bg-gray-50/60 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-sm'>
        <div className='flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-gray-500'>
          <span>
            Items subtotal{" "}
            <span className='font-semibold text-gray-900 tabular-nums'>
              {formatPrice(itemsSubtotal)}
            </span>
          </span>
          {hasAnyCogs ?
            <span>
              Total COGS{" "}
              <span className='font-semibold text-gray-900 tabular-nums'>
                {formatPrice(totalCogs)}
              </span>
              {!cogsKnown ?
                <span className='ml-1 text-amber-700'>(some lines missing)</span>
              : null}
            </span>
          : null}
        </div>
        <span className='text-xs text-gray-500'>
          Order total{" "}
          <span className='font-bold text-gray-900 tabular-nums text-sm'>
            {formatPrice(order.total)}
          </span>
        </span>
      </div>
    </AdminOrderSectionCard>
  );
}
