"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotificationBrowserPush } from "@/hooks/useNotificationBrowserPush";
import { cn } from "@/lib/utils";

const BANNER_DISMISS_KEY = "hor_notif_banner_dismiss_v1";

/**
 * Logged-in users see this strip when push is configured but permission is still "default".
 * Also triggers one automatic permission request per session (silent) where the browser allows it.
 */
export default function BrowserNotificationPrompt() {
  const { user, isAuthenticated, isLoading, hasSessionChecked } = useAuthStore();
  const [dismissed, setDismissed] = useState(false);
  const [deferVisible, setDeferVisible] = useState(false);
  const isAuthedStable = hasSessionChecked && !isLoading && isAuthenticated;

  const { notificationPermission, pushConfigured, requestBrowserPermission } =
    useNotificationBrowserPush(isAuthedStable ? user : null, {
      autoRequestPermissionOnce: true,
    });

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissed(sessionStorage.getItem(BANNER_DISMISS_KEY) === "1");
  }, []);

  useEffect(() => {
    if (notificationPermission !== "default" || pushConfigured !== true) {
      setDeferVisible(false);
      return;
    }
    const t = window.setTimeout(() => setDeferVisible(true), 1800);
    return () => window.clearTimeout(t);
  }, [notificationPermission, pushConfigured]);

  const dismiss = () => {
    if (typeof window !== "undefined")
      sessionStorage.setItem(BANNER_DISMISS_KEY, "1");
    setDismissed(true);
  };

  if (!isAuthedStable || !user) return null;
  if (pushConfigured !== true) return null;
  if (notificationPermission !== "default") return null;
  if (dismissed || !deferVisible) return null;

  return (
    <div
      className={cn(
        "relative z-[45] w-full border-b border-brand-200/80 bg-gradient-to-r from-brand-50 via-white to-amber-50/90",
        "shadow-sm pt-[max(0px,env(safe-area-inset-top))]",
      )}
      role="region"
      aria-label="Browser notifications"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div className="flex items-start gap-3 min-w-0">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-md">
            <Bell className="h-4 w-4" strokeWidth={2} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-navy-900 leading-snug">
              Stay updated on orders &amp; alerts
            </p>
            <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
              Enable browser notifications so you don&apos;t miss shipping
              updates — you can change this anytime in site settings.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 sm:pl-2">
          <button
            type="button"
            onClick={() => void requestBrowserPermission()}
            className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            Enable notifications
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white/80 sm:hidden"
            aria-label="Dismiss notification prompt"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
