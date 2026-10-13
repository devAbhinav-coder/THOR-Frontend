"use client";

import { ExternalLink, PackageSearch, Pencil, Truck } from "lucide-react";
import type { Order } from "@/types";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import AdminOrderSectionCard, { MicroLabel } from "./AdminOrderSectionCard";
import AdminCopyButton from "./AdminCopyButton";

export function getAutoTrackingUrl(carrier?: string, trackingNumber?: string) {
  const awb = trackingNumber?.trim();
  if (!awb) return null;
  const c = (carrier || "").toLowerCase().trim();

  if (c.includes("delhivery"))
    return `https://www.delhivery.com/track/package/${encodeURIComponent(awb)}`;
  if (c.includes("bluedart") || c.includes("blue dart"))
    return `https://www.bluedart.com/tracking?wbnum=${encodeURIComponent(awb)}`;
  if (c.includes("fedex") || c.includes("fed ex"))
    return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(awb)}`;
  if (c.includes("dhl"))
    return `https://www.dhl.com/global-en/home/tracking/tracking-express.html?submit=1&tracking-id=${encodeURIComponent(awb)}`;
  if (c.includes("ecom") || c.includes("ecom express"))
    return `https://www.ecomexpress.in/tracking/?awb_field=${encodeURIComponent(awb)}`;
  if (c.includes("dtdc"))
    return `https://www.dtdc.in/trace.asp?strCnno=${encodeURIComponent(awb)}`;
  if (
    c.includes("india post") ||
    c.includes("indiapost") ||
    c.includes("speed post")
  )
    return `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx?trackingid=${encodeURIComponent(awb)}`;

  return `https://www.google.com/search?q=${encodeURIComponent(`${carrier || "courier"} tracking ${awb}`)}`;
}

export default function AdminOrderTrackingCard({
  order,
  onEdit,
}: {
  order: Order;
  onEdit: () => void;
}) {
  const awb = order.trackingNumber?.trim();
  const href = order.trackingUrl || getAutoTrackingUrl(order.shippingCarrier, awb);
  const d = order.delhivery;
  const canEdit = ["confirmed", "processing", "shipped"].includes(order.status);
  const offlineHandover = order.offlineMeta?.fulfillment === "offline_handover";

  return (
    <AdminOrderSectionCard
      id='tracking'
      icon={Truck}
      tone='sky'
      title='Tracking'
      description={
        order.shippedAt ? `Shipped ${formatDateTime(order.shippedAt)}`
        : order.deliveredAt ? `Delivered ${formatDateTime(order.deliveredAt)}`
        : undefined
      }
      action={
        canEdit ?
          <button
            type='button'
            onClick={onEdit}
            className='inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-brand-700 hover:bg-brand-50'
          >
            <Pencil className='h-3 w-3' />
            {awb ? "Edit" : "Add"}
          </button>
        : null
      }
    >
      {awb ?
        <div className='space-y-3'>
          <div className='grid grid-cols-2 gap-2'>
            <div className='rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5 min-w-0'>
              <MicroLabel>Courier</MicroLabel>
              <p className='text-sm font-semibold text-gray-900 mt-0.5 truncate'>
                {order.shippingCarrier || "-"}
              </p>
            </div>
            <div className='rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5 min-w-0'>
              <MicroLabel>AWB</MicroLabel>
              <p className='text-sm font-semibold text-gray-900 font-mono mt-0.5 flex items-center gap-1 min-w-0'>
                <span className='truncate'>{awb}</span>
                <AdminCopyButton value={awb} label='Copy AWB' iconOnly />
              </p>
            </div>
          </div>

          {d?.lastPackageStatus ?
            <div className='flex items-center justify-between gap-2 text-xs rounded-lg border border-indigo-100 bg-indigo-50/60 px-3 py-2'>
              <span className='text-indigo-950'>
                <span className='font-semibold'>{d.lastPackageStatus}</span>
                {d.rtoDetected ?
                  <span className='ml-1.5 inline-flex items-center rounded bg-red-100 text-red-800 px-1.5 py-px text-[10px] font-bold uppercase'>
                    RTO
                  </span>
                : null}
              </span>
              {d.lastTrackSyncAt ?
                <span className='text-[10px] text-gray-500 shrink-0'>
                  {formatDateTime(d.lastTrackSyncAt)}
                </span>
              : null}
            </div>
          : null}

          {href ?
            <Button asChild variant='outline' className='w-full rounded-xl gap-1.5 h-10'>
              <a href={href} target='_blank' rel='noreferrer'>
                <PackageSearch className='h-4 w-4' /> Track package{" "}
                <ExternalLink className='h-3.5 w-3.5 opacity-60' />
              </a>
            </Button>
          : null}

          {order.status !== "shipped" && order.status !== "delivered" ?
            <p className='text-[11px] text-gray-500 text-center'>
              Tracking is saved; the customer sees the track button once the order
              is <b>Shipped</b>.
            </p>
          : null}
        </div>
      : <div className='text-center py-3'>
          <div className='h-10 w-10 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mx-auto mb-2.5'>
            <Truck className='h-5 w-5 text-gray-300' />
          </div>
          <p className='text-sm font-medium text-gray-600'>
            {offlineHandover ? "Offline handover - no courier" : "No tracking yet"}
          </p>
          {!offlineHandover && canEdit ?
            <>
              <p className='text-[11px] text-gray-400 mt-1 max-w-[220px] mx-auto leading-snug'>
                Use Delhivery automation on the left, or add a manual courier.
              </p>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='mt-3 rounded-xl'
                onClick={onEdit}
              >
                Add tracking &amp; mark shipped
              </Button>
            </>
          : null}
        </div>
      }
    </AdminOrderSectionCard>
  );
}
