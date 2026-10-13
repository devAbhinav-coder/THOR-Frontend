"use client";

import { useMemo, useState } from "react";
import { History, Mail, MessageCircle, BellRing } from "lucide-react";
import type { Order } from "@/types";
import { cn, formatDateTime } from "@/lib/utils";
import AdminOrderSectionCard from "./AdminOrderSectionCard";
import { orderStatusMeta } from "./AdminOrderStatusBadge";

type Entry =
  | {
      kind: "status";
      at: string;
      status: string;
      note?: string;
      actor?: "customer" | "admin";
    }
  | {
      kind: "comm";
      at: string;
      channel: "email" | "in_app" | "whatsapp";
      label: string;
      subject?: string;
    };

const ACTOR_CHIP: Record<string, string> = {
  admin: "bg-navy-50 text-navy-800 ring-navy-100",
  customer: "bg-brand-50 text-brand-800 ring-brand-100",
  system: "bg-gray-100 text-gray-600 ring-gray-200",
};

function commIcon(channel: "email" | "in_app" | "whatsapp") {
  if (channel === "email") return Mail;
  if (channel === "whatsapp") return MessageCircle;
  return BellRing;
}

/** Unified vertical log: status changes (with actor + note) and customer communications. */
export default function AdminOrderActivityLog({ order }: { order: Order }) {
  const [filter, setFilter] = useState<"all" | "status" | "comm">("all");

  const entries = useMemo<Entry[]>(() => {
    const statusEntries: Entry[] = (order.statusHistory ?? []).map((h) => ({
      kind: "status",
      at: h.timestamp,
      status: h.status,
      note: h.note?.trim() || undefined,
      actor: h.actor,
    }));
    const commEntries: Entry[] = (order.customerCommunications ?? []).map(
      (c) => ({
        kind: "comm",
        at: c.sentAt,
        channel: c.channel,
        label: c.kind.replace(/_/g, " "),
        subject: c.subject,
      }),
    );
    if (statusEntries.length === 0 && order.createdAt) {
      statusEntries.push({
        kind: "status",
        at: order.createdAt,
        status: "pending",
      });
    }
    return [...statusEntries, ...commEntries].sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
    );
  }, [order.statusHistory, order.customerCommunications, order.createdAt]);

  const shown = entries.filter((e) => filter === "all" || e.kind === filter);
  const commCount = entries.filter((e) => e.kind === "comm").length;
  const statusCount = entries.length - commCount;

  return (
    <AdminOrderSectionCard
      id='activity'
      icon={History}
      tone='navy'
      title='Activity log'
      description='Every status change and customer message, newest first.'
      action={
        <div className='inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 text-[11px] font-semibold'>
          {(
            [
              ["all", `All ${entries.length}`],
              ["status", `Status ${statusCount}`],
              ["comm", `Sent ${commCount}`],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type='button'
              onClick={() => setFilter(id)}
              className={cn(
                "px-2.5 py-1 rounded-md transition-colors",
                filter === id ?
                  "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-800",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      }
    >
      {shown.length === 0 ?
        <p className='text-sm text-gray-500'>Nothing logged yet.</p>
      : <div className='max-h-[28rem] overflow-y-auto -mx-1 px-1 [scrollbar-width:thin]'>
          <ol className='relative ml-4 border-l-2 border-gray-200 space-y-5 py-2'>
          {shown.map((e, i) => {
            if (e.kind === "status") {
              const m = orderStatusMeta(e.status);
              const Icon = m.icon;
              const actor = e.actor ?? "system";
              return (
                <li key={`s-${e.at}-${i}`} className='relative pl-7 pr-1'>
                  <span
                    className={cn(
                      "absolute -left-[10px] top-0.5 h-[18px] w-[18px] rounded-full ring-4 ring-white flex items-center justify-center",
                      m.dot,
                    )}
                    aria-hidden
                  >
                    <Icon className='h-2.5 w-2.5 text-white' />
                  </span>
                  <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
                    <p className='text-sm font-semibold text-gray-900'>{m.label}</p>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-1.5 py-px text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset",
                        ACTOR_CHIP[actor],
                      )}
                    >
                      {actor}
                    </span>
                    <time className='text-[11px] text-gray-400 ml-auto tabular-nums'>
                      {formatDateTime(e.at)}
                    </time>
                  </div>
                  {e.note ?
                    <p className='mt-1 text-xs text-gray-600 whitespace-pre-wrap leading-relaxed rounded-lg bg-gray-50 border border-gray-100 px-2.5 py-1.5'>
                      {e.note}
                    </p>
                  : null}
                </li>
              );
            }
            const Icon = commIcon(e.channel);
            return (
              <li key={`c-${e.at}-${i}`} className='relative pl-7 pr-1'>
                <span
                  className='absolute -left-[10px] top-0.5 h-[18px] w-[18px] rounded-full ring-4 ring-white bg-white border border-gray-300 flex items-center justify-center text-gray-500'
                  aria-hidden
                >
                  <Icon className='h-2.5 w-2.5' />
                </span>
                <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
                  <p className='text-sm text-gray-800'>
                    <span className='font-semibold capitalize'>{e.label}</span>
                    <span className='text-gray-500'> sent to customer</span>
                  </p>
                  <span className='inline-flex items-center rounded-full px-1.5 py-px text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-800 ring-1 ring-inset ring-indigo-100'>
                    {e.channel.replace("_", "-")}
                  </span>
                  <time className='text-[11px] text-gray-400 ml-auto tabular-nums'>
                    {formatDateTime(e.at)}
                  </time>
                </div>
                {e.subject ?
                  <p className='mt-0.5 text-xs text-gray-500 truncate'>{e.subject}</p>
                : null}
              </li>
            );
          })}
          </ol>
        </div>
      }
    </AdminOrderSectionCard>
  );
}
