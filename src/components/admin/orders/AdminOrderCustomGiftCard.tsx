"use client";

import Image from "next/image";
import { ExternalLink, Gift } from "lucide-react";
import type { Order } from "@/types";
import AdminOrderSectionCard, { MicroLabel } from "./AdminOrderSectionCard";
import AdminCopyButton from "./AdminCopyButton";

function isUrl(v: unknown): v is string {
  return typeof v === "string" && /^https?:\/\//.test(v);
}

/** Bespoke / custom gift specifications submitted by the customer. */
export default function AdminOrderCustomGiftCard({ order }: { order: Order }) {
  if (!order.customRequestId && order.productType !== "custom") return null;

  const items = order.items ?? [];

  return (
    <AdminOrderSectionCard
      id='custom'
      icon={Gift}
      tone='brand'
      title='Bespoke gift specifications'
      description='Customer-submitted answers for each personalised line.'
      className='border-brand-200/80 bg-gradient-to-b from-brand-50/40 to-white'
      action={
        order.customRequestId ?
          <span className='inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-white px-2 py-1 text-[11px] font-mono text-gray-800'>
            {order.customRequestId}
            <AdminCopyButton value={order.customRequestId} label='Copy request ID' iconOnly />
          </span>
        : null
      }
    >
      <div className='space-y-3'>
        {items.map((item, i) => {
          const answers = item.customFieldAnswers ?? [];
          return (
            <div
              key={i}
              className='rounded-xl border border-brand-100 bg-white p-4'
            >
              <div className='flex items-start justify-between gap-3'>
                <p className='text-sm font-semibold text-gray-900'>{item.name}</p>
                <span className='text-xs text-gray-500 shrink-0'>Qty {item.quantity}</span>
              </div>
              {answers.length === 0 ?
                <p className='text-xs text-gray-400 mt-2'>No custom answers on this line.</p>
              : <dl className='mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2'>
                  {answers.map((a, j) => (
                    <div
                      key={j}
                      className='rounded-lg bg-brand-50/60 border border-brand-100 px-3 py-2'
                    >
                      <MicroLabel className='text-brand-700/80'>{a.label}</MicroLabel>
                      {isUrl(a.value) ?
                        <a
                          href={a.value}
                          target='_blank'
                          rel='noreferrer'
                          className='mt-1.5 flex items-center gap-3 group'
                        >
                          <span className='relative h-16 w-16 rounded-md overflow-hidden border border-brand-200 bg-white shrink-0'>
                            <Image
                              src={a.value}
                              alt={a.label}
                              fill
                              sizes='64px'
                              className='object-cover'
                            />
                          </span>
                          <span className='text-[11px] font-semibold text-brand-700 group-hover:underline inline-flex items-center gap-1'>
                            Open full image <ExternalLink className='h-3 w-3' />
                          </span>
                        </a>
                      : <dd className='text-sm font-medium text-gray-900 mt-0.5 whitespace-pre-wrap break-words'>
                          {a.value || "-"}
                        </dd>
                      }
                    </div>
                  ))}
                </dl>
              }
            </div>
          );
        })}
      </div>
    </AdminOrderSectionCard>
  );
}
