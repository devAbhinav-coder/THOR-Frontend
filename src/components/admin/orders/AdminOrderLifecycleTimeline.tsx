"use client";

import type { ReactNode } from "react";
import {
  CheckCircle2,
  Circle,
  Compass,
  RotateCcw,
  Truck,
  Undo2,
  XCircle,
} from "lucide-react";
import { Order } from "@/types";
import { buildOrderLifecycleTimeline } from "@/lib/orderLifecycle";
import { cn, formatDateTime } from "@/lib/utils";

const FAILURE_STATUSES = new Set(["cancelled", "return_rejected"]);
const WARNING_STATUSES = new Set([
  "return_requested",
  "return_approved",
  "refunded",
]);

export default function AdminOrderLifecycleTimeline({ order }: { order: Order }) {
  const events = buildOrderLifecycleTimeline(order);

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.18)] overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 via-white to-white">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Compass className="h-4 w-4 text-blue-600" /> Order lifecycle
          </h2>
        </div>
        <p className="p-6 text-sm text-gray-500">No status updates recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.18)] overflow-hidden">
      <div className="px-5 sm:px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 via-white to-white">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Compass className="h-4 w-4 text-blue-600" /> Order lifecycle
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Only steps that actually happened on this order.
        </p>
      </div>
      <div className="p-5 sm:p-8 w-full overflow-x-auto pb-4">
        <div
          className="flex items-start min-w-[280px] relative mt-6 font-sans"
          style={{ minWidth: `${Math.max(events.length * 140, 280)}px` }}
        >
          {events.map((event, index) => {
            const isCompleted = event.state === "done" || event.state === "current";
            const isFailure = FAILURE_STATUSES.has(event.status);
            const isWarning = WARNING_STATUSES.has(event.status);
            const timestamp =
              event.timestamp ? formatDateTime(event.timestamp) : "";

            let icon: ReactNode;
            if (event.status === "delivered" && isCompleted) {
              icon = (
                <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-full z-10 border border-emerald-100/50 relative top-0.5">
                  <CheckCircle2 className="h-4 w-4 text-white fill-emerald-600" />
                  <span className="text-emerald-800 text-[13px] font-bold capitalize pt-px">
                    Delivered
                  </span>
                </div>
              );
            } else if (isFailure && isCompleted) {
              icon = (
                <div className="flex items-center gap-1.5 bg-red-50 px-3 py-1.5 rounded-full z-10 border border-red-100 relative top-0.5">
                  <XCircle className="h-4 w-4 text-red-600 fill-red-600" />
                  <span className="text-red-800 text-[13px] font-bold capitalize pt-px">
                    {event.label}
                  </span>
                </div>
              );
            } else if (isWarning && isCompleted) {
              icon =
                event.status === "refunded" ?
                  <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-full z-10 border border-orange-200 relative top-0.5 shadow-sm">
                    <Undo2 className="h-4 w-4 text-orange-600 shrink-0" />
                    <span className="text-orange-900 text-[13px] font-bold capitalize pt-px">
                      Refunded
                    </span>
                  </div>
                : <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full z-10 border border-amber-200 relative top-0.5 shadow-sm">
                    <RotateCcw className="h-4 w-4 text-amber-600 shrink-0" />
                    <span className="text-amber-900 text-[13px] font-bold capitalize pt-px">
                      {event.label}
                    </span>
                  </div>;
            } else if (event.status === "shipped") {
              icon = (
                <div className="bg-white px-3 z-10">
                  <Truck
                    className={cn(
                      "h-6 w-6 mt-1",
                      isCompleted ? "text-blue-600 fill-blue-600" : "text-gray-300",
                    )}
                  />
                </div>
              );
            } else if (isCompleted) {
              icon = (
                <div className="bg-white px-2 z-10">
                  <CheckCircle2 className="h-6 w-6 text-white fill-emerald-600 rounded-full mt-1.5" />
                </div>
              );
            } else {
              icon = (
                <div className="bg-white px-2 z-10">
                  <Circle className="h-2 w-2 text-gray-300 fill-gray-300 mt-3" />
                </div>
              );
            }

            return (
              <div
                key={event.key}
                className={cn(
                  "relative flex flex-col items-center",
                  index === events.length - 1 ? "flex-[0.5]" : "flex-1",
                )}
              >
                {index < events.length - 1 && (
                  <div
                    className={cn(
                      "absolute top-5 left-[50%] right-[-50%] h-[2px] z-0",
                      isCompleted && !isFailure ? "bg-emerald-600" : "bg-gray-200",
                      isFailure ? "bg-red-200" : "",
                    )}
                  />
                )}

                <div className="relative z-10 flex justify-center h-10 items-center w-full">
                  {icon}
                </div>

                <div className="mt-3 text-center max-w-[120px]">
                  <p
                    className={cn(
                      "text-[13px] font-bold leading-snug",
                      isCompleted ? "text-gray-900" : "text-gray-500",
                    )}
                  >
                    {event.label}
                  </p>
                  {timestamp && (
                    <p className="text-[11px] text-gray-500 mt-1">{timestamp}</p>
                  )}
                  {event.detail && (
                    <p className="text-[10px] text-gray-500 mt-1 line-clamp-3">
                      {event.detail}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
