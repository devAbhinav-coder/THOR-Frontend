"use client";

import { Check, Circle, MapPin } from "lucide-react";
import { TrackingEvent } from "./orderDetailHelpers";
import { formatDateTime, cn } from "@/lib/utils";

export default function OrderTrackingTimeline({ events }: { events: TrackingEvent[] }) {
  if (!events.length) return null;

  return (
    <section className="bg-account-surface-container-lowest border border-account-outline-variant/30 p-6 md:p-8">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-account-on-surface-variant mb-6">
        Live Tracking
      </p>
      <ol className="space-y-0">
        {events.map((event, i) => {
          const isLast = i === events.length - 1;
          const done = event.state === "done";
          const current = event.state === "current";

          return (
            <li key={event.key} className="flex gap-4 relative pb-8 last:pb-0">
              {!isLast && (
                <span
                  className={cn(
                    "absolute left-[11px] top-6 bottom-0 w-px",
                    done ? "bg-account-secondary" : "bg-account-outline-variant/40",
                  )}
                />
              )}
              <div
                className={cn(
                  "relative z-10 h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                  done && "bg-account-secondary text-white",
                  current && "bg-account-secondary-container text-account-on-secondary-container ring-2 ring-account-secondary/30",
                  event.state === "upcoming" && "bg-account-surface-variant text-account-outline",
                )}
              >
                {done ?
                  <Check className="h-3.5 w-3.5" />
                : current ?
                  <MapPin className="h-3.5 w-3.5" />
                : <Circle className="h-2 w-2 fill-current" />}
              </div>
              <div className={cn("min-w-0 pt-0.5", event.state === "upcoming" && "opacity-50")}>
                <p className={cn(
                  "font-medium text-account-primary",
                  current && "font-semibold",
                )}>
                  {event.label}
                </p>
                {event.detail && (
                  <p className="text-sm text-account-on-surface-variant mt-0.5">{event.detail}</p>
                )}
                {event.timestamp && (
                  <p className="text-xs text-account-outline mt-1">{formatDateTime(event.timestamp)}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
