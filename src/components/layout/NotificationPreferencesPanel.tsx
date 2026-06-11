"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
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
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
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
    <div className="shrink-0 border-t border-[#c5a059]/15 bg-[#fafafa]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-[#c5a059]/5"
        aria-expanded={open}
      >
        <span className="text-[13px] font-medium text-gray-700">
          Notification settings
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-[#c5a059] transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="space-y-3 border-t border-[#c5a059]/15 bg-white px-4 py-3">
          {isLoading && !preferences ?
            <div className="flex items-center justify-center py-4 text-[13px] text-gray-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#c5a059]" />
              Loading preferences…
            </div>
          : <>
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-none border border-[#c5a059]/15 px-3 py-2.5">
                <span className="text-[13px] text-gray-700">
                  Push notifications
                </span>
                <input
                  type="checkbox"
                  checked={pushOptIn}
                  onChange={(e) => setPushOptIn(e.target.checked)}
                  className="h-4 w-4 rounded-none border-gray-300 accent-[#c5a059] text-[#c5a059] focus:ring-[#c5a059]/30"
                />
              </label>

              <div>
                <p className="mb-2 text-[12px] font-medium text-gray-500">
                  Mute categories
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {MUTEABLE_CATEGORIES.map(({ id, label }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleCategory(id)}
                      className={cn(
                        "rounded-none px-2.5 py-1 text-[12px] font-medium transition-colors",
                        muted.includes(id) ?
                          "bg-gray-100 text-gray-400 line-through"
                        : "bg-gray-50 text-gray-700 ring-1 ring-[#c5a059]/20 hover:bg-[#c5a059]/5 hover:text-[#c5a059]",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-[12px] font-medium text-gray-500">
                  Quiet hours
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={quietStart}
                    onChange={(e) => setQuietStart(e.target.value)}
                    className="w-full rounded-none border border-gray-200 bg-white px-2.5 py-1.5 text-[13px] text-gray-700 focus:border-[#c5a059]/50 focus:outline-none focus:ring-1 focus:ring-[#c5a059]/30"
                    aria-label="Quiet hours start"
                  />
                  <span className="text-[12px] text-gray-400">to</span>
                  <input
                    type="time"
                    value={quietEnd}
                    onChange={(e) => setQuietEnd(e.target.value)}
                    className="w-full rounded-none border border-gray-200 bg-white px-2.5 py-1.5 text-[13px] text-gray-700 focus:border-[#c5a059]/50 focus:outline-none focus:ring-1 focus:ring-[#c5a059]/30"
                    aria-label="Quiet hours end"
                  />
                </div>
                <p className="mt-1.5 text-[12px] text-gray-500">
                  No push during this window (your timezone).
                </p>
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex w-full items-center justify-center gap-1.5 rounded-none bg-[#c5a059] px-3 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#b8924d] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ?
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving…
                  </>
                : "Save preferences"}
              </button>
            </>
          }
        </div>
      )}
    </div>
  );
}
