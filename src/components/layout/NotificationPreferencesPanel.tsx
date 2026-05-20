"use client";

import { useEffect, useState } from "react";
import { Loader2, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  NotificationCategory,
  NotificationPreferences,
} from "@/types/notifications";

const MUTEABLE_CATEGORIES: { id: NotificationCategory; label: string }[] = [
  { id: "order", label: "Orders" },
  { id: "promotion", label: "Promotions" },
  { id: "system", label: "System" },
  { id: "alert", label: "Alerts" },
  { id: "info", label: "Info" },
];

type Props = {
  preferences: NotificationPreferences | undefined;
  isLoading: boolean;
  isSaving: boolean;
  onSave: (patch: Partial<NotificationPreferences>) => void;
};

export default function NotificationPreferencesPanel({
  preferences,
  isLoading,
  isSaving,
  onSave,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pushOptIn, setPushOptIn] = useState(true);
  const [muted, setMuted] = useState<NotificationCategory[]>([]);
  const [quietStart, setQuietStart] = useState("");
  const [quietEnd, setQuietEnd] = useState("");

  useEffect(() => {
    if (!preferences) return;
    setPushOptIn(preferences.pushOptIn);
    setMuted(preferences.mutedCategories ?? []);
    setQuietStart(preferences.quietHoursStart ?? "");
    setQuietEnd(preferences.quietHoursEnd ?? "");
  }, [preferences]);

  const toggleCategory = (id: NotificationCategory) => {
    setMuted((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    onSave({
      pushOptIn,
      mutedCategories: muted,
      quietHoursStart: quietStart.trim() ? quietStart : null,
      quietHoursEnd: quietEnd.trim() ? quietEnd : null,
    });
  };

  return (
    <div className="flex-shrink-0 border-t border-gray-100 dark:border-neutral-800">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-neutral-800/80"
        aria-expanded={open}
      >
        <span className="flex items-center gap-1.5">
          <Settings2 className="h-3.5 w-3.5" />
          Notification settings
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
          {open ? "Hide" : "Show"}
        </span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-gray-100 bg-gray-50/80 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/80">
          {isLoading && !preferences ? (
            <div className="flex items-center justify-center py-4 text-xs text-gray-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading preferences…
            </div>
          ) : (
            <>
              <label className="flex cursor-pointer items-center justify-between gap-2">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                  Push notifications
                </span>
                <input
                  type="checkbox"
                  checked={pushOptIn}
                  onChange={(e) => setPushOptIn(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
              </label>

              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                  Mute categories
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {MUTEABLE_CATEGORIES.map(({ id, label }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleCategory(id)}
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors",
                        muted.includes(id)
                          ? "bg-gray-200 text-gray-600 line-through dark:bg-neutral-700 dark:text-gray-400"
                          : "bg-white text-gray-700 ring-1 ring-gray-200 dark:bg-neutral-800 dark:text-gray-200 dark:ring-neutral-600"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                  Quiet hours
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={quietStart}
                    onChange={(e) => setQuietStart(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
                    aria-label="Quiet hours start"
                  />
                  <span className="text-xs text-gray-400">to</span>
                  <input
                    type="time"
                    value={quietEnd}
                    onChange={(e) => setQuietEnd(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
                    aria-label="Quiet hours end"
                  />
                </div>
                <p className="mt-1 text-[10px] text-gray-500">
                  No push during this window (your timezone).
                </p>
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save preferences"
                )}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
