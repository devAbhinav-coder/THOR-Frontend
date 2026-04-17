"use client";

import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  type ReactElement,
} from "react";
import { createPortal } from "react-dom";
import {
  Bell,
  Check,
  Trash2,
  Loader2,
  PackageOpen,
  AlertCircle,
  Info,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationApi } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import Link from "next/link";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { queryKeys } from "@/lib/queryKeys";
import { useNotificationBrowserPush } from "@/hooks/useNotificationBrowserPush";

const TOAST_CLEAR = "notif-clear-all";
const TOAST_MARK_READ = "notif-mark-all-read";

const NOTIFICATION_TYPE_ICONS: Record<string, ReactElement> = {
  order: <PackageOpen className="w-5 h-5 text-blue-500" />,
  alert: <AlertCircle className="w-5 h-5 text-red-500" />,
};

function notificationTypeIcon(type: string): ReactElement {
  return (
    NOTIFICATION_TYPE_ICONS[type] ?? (
      <Info className="w-5 h-5 text-emerald-500" />
    )
  );
}

const PANEL_WIDTH = 384; // matches max-w-96
const PANEL_MARGIN = 12; // mt-3
const PANEL_MAX_HEIGHT = 520;
const VIEWPORT_GAP = 8;
const PANEL_FLIP_THRESHOLD = 320;

export default function NotificationBell({
  align = "right",
  onOpenChange,
}: {
  align?: "left" | "right";
  /** Fires when the dropdown opens/closes — e.g. keep parent sidebar expanded while interacting. */
  onOpenChange?: (open: boolean) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [panelPos, setPanelPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const {
    notificationPermission,
    ensurePushSubscription,
    requestBrowserPermission,
  } = useNotificationBrowserPush(user);

  const updatePanelPosition = useCallback(() => {
    const btn = triggerRef.current?.querySelector("button");
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(PANEL_WIDTH, vw - 16);
    let left = align === "right" ? rect.right - width : rect.left;
    left = Math.max(VIEWPORT_GAP, Math.min(left, vw - width - VIEWPORT_GAP));

    const measuredPanelHeight = panelRef.current?.offsetHeight;
    const desiredHeight = Math.min(
      measuredPanelHeight ?? PANEL_MAX_HEIGHT,
      vh - VIEWPORT_GAP * 2,
    );
    const spaceBelow = vh - rect.bottom - PANEL_MARGIN - VIEWPORT_GAP;
    const spaceAbove = rect.top - PANEL_MARGIN - VIEWPORT_GAP;
    const minComfortSpace = Math.min(PANEL_FLIP_THRESHOLD, desiredHeight);
    const shouldOpenUpward =
      spaceBelow < minComfortSpace && spaceAbove > spaceBelow;

    const top = shouldOpenUpward
      ? Math.max(VIEWPORT_GAP, rect.top - PANEL_MARGIN - desiredHeight)
      : Math.min(vh - desiredHeight - VIEWPORT_GAP, rect.bottom + PANEL_MARGIN);
    setPanelPos({ top, left, width });
  }, [align]);

  /** Keep TanStack Query hooks contiguous (before layout/DOM effects) — avoids hook-order issues with HMR / strict mode. */
  const { data } = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () => notificationApi.getAll({ limit: 50 }),
    enabled: !!user,
    refetchInterval: user?.role === "admin" ? 15000 : 30000,
  });

  const notifications = data?.data?.notifications || [];
  const unreadCount = data?.data?.unreadCount || 0;

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onMutate: () => {
      toast.loading("Marking all as read…", { id: TOAST_MARK_READ });
    },
    onSuccess: () => {
      toast.dismiss(TOAST_MARK_READ);
      toast.success("All marked as read");
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
    onError: (err: { message?: string }) => {
      toast.dismiss(TOAST_MARK_READ);
      toast.error(err?.message || "Could not update notifications.");
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: () => notificationApi.clearAll(),
    onMutate: () => {
      toast.loading("Clearing notifications…", { id: TOAST_CLEAR });
    },
    onSuccess: () => {
      toast.dismiss(TOAST_CLEAR);
      toast.success("All notifications cleared");
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
      setIsOpen(false);
    },
    onError: (err: { message?: string }) => {
      toast.dismiss(TOAST_CLEAR);
      toast.error(err?.message || "Could not clear notifications.");
    },
  });

  const sendTestPushMutation = useMutation({
    mutationFn: () => notificationApi.sendTestPushToSelf(),
    onSuccess: () => {
      toast.success("Test push sent. Check your browser/device notifications.");
    },
    onError: (err: { message?: string }) => {
      toast.error(err?.message || "Could not send test push.");
    },
  });

  const handleNotificationClick = (id: string, isRead: boolean) => {
    if (!isRead) markAsReadMutation.mutate(id);
    setIsOpen(false);
  };

  useLayoutEffect(() => {
    if (!isOpen) {
      setPanelPos(null);
      return;
    }
    // First pass uses fallback size, second pass repositions with measured panel height.
    updatePanelPosition();
    const raf = requestAnimationFrame(() => updatePanelPosition());
    return () => cancelAnimationFrame(raf);
  }, [isOpen, updatePanelPosition, notifications.length]);

  useEffect(() => {
    if (!isOpen) return;
    const onResizeOrScroll = () => updatePanelPosition();
    window.addEventListener("resize", onResizeOrScroll);
    window.addEventListener("scroll", onResizeOrScroll, true);
    return () => {
      window.removeEventListener("resize", onResizeOrScroll);
      window.removeEventListener("scroll", onResizeOrScroll, true);
    };
  }, [isOpen, updatePanelPosition]);

  useEffect(() => {
    onOpenChangeRef.current?.(isOpen);
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const t = event.target as Node;
      if (
        triggerRef.current?.contains(t) ||
        panelRef.current?.contains(t)
      ) {
        return;
      }
      setIsOpen(false);
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!user) return;
    void ensurePushSubscription();
  }, [user, notifications.length, ensurePushSubscription]);

  if (!user) return null;

  const dropdown = isOpen &&
    panelPos &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        ref={panelRef}
        style={{
          position: "fixed",
          top: panelPos.top,
          left: panelPos.left,
          width: panelPos.width,
          zIndex: 10050,
        }}
        className="flex max-h-[min(80vh,520px)] min-h-0 flex-col overflow-hidden rounded-2xl bg-white shadow-[0_12px_40px_-8px_rgba(0,0,0,0.25)] ring-1 ring-black/5 animate-in slide-in-from-top-2 duration-200 dark:bg-neutral-900 dark:ring-white/10"
      >
        <div className="flex flex-shrink-0 items-center justify-between gap-2 border-b border-gray-100 bg-white px-5 py-4 dark:border-neutral-800 dark:bg-neutral-900">
          <h3 className="shrink-0 text-base font-bold text-gray-900 dark:text-white">
            Notifications
          </h3>
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {notificationPermission === "default" && (
              <button
                type="button"
                onClick={() => void requestBrowserPermission()}
                className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
              >
                Enable alerts
              </button>
            )}
            {user?.role === "admin" && (
              <button
                type="button"
                onClick={() => sendTestPushMutation.mutate()}
                disabled={sendTestPushMutation.isPending}
                className="flex items-center gap-1 rounded-full bg-purple-50 px-2 py-1.5 text-xs font-semibold text-purple-700 transition-colors hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sendTestPushMutation.isPending ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Sending…
                  </>
                ) : (
                  "Test push"
                )}
              </button>
            )}
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="flex items-center gap-1 rounded-full bg-brand-50 px-2 py-1.5 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {markAllAsReadMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
                {markAllAsReadMutation.isPending ? "Working…" : "Mark read"}
              </button>
            )}
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={() => clearAllMutation.mutate()}
                disabled={clearAllMutation.isPending}
                className="flex items-center gap-1 rounded-full bg-gray-50 px-2 py-1.5 text-xs font-semibold text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {clearAllMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
                {clearAllMutation.isPending ? "Clearing…" : "Clear all"}
              </button>
            )}
          </div>
        </div>
        {notificationPermission === "denied" && (
          <div className="border-b border-amber-100 bg-amber-50 px-5 py-2 text-[11px] text-amber-700">
            Browser alerts are blocked for this site. Enable notifications from
            browser settings.
          </div>
        )}

        <div
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain bg-gray-50/30 [scrollbar-gutter:stable] dark:bg-neutral-900/50"
          data-lenis-prevent
        >
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
                <Bell className="h-7 w-7 text-gray-300" />
              </div>
              <p className="text-sm font-bold text-gray-900 dark:text-neutral-100">
                All caught up!
              </p>
              <p className="mt-1 text-xs text-gray-500">
                You have no new notifications.
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map(
                (n: {
                  _id: string;
                  link?: string;
                  isRead?: boolean;
                  type?: string;
                  title?: string;
                  message?: string;
                  createdAt?: string;
                }) => (
                  <Link
                    key={n._id}
                    href={n.link || "#"}
                    onClick={(e) => {
                      if (!n.link) e.preventDefault();
                      handleNotificationClick(n._id, !!n.isRead);
                    }}
                    className={cn(
                      "group relative flex items-start gap-3 border-b border-gray-100 p-2 transition-colors last:border-0 hover:bg-gray-50 dark:hover:bg-neutral-800/80",
                      !n.isRead
                        ? "bg-white dark:bg-neutral-900"
                        : "bg-gray-50/50 opacity-75 hover:opacity-100 dark:bg-neutral-900/50",
                    )}
                  >
                    {!n.isRead && (
                      <div className="absolute bottom-0 left-0 top-0 w-1 bg-brand-500" />
                    )}

                    <div
                      className={cn(
                        "mt-0.5 flex-shrink-0 rounded-full p-2.5",
                        !n.isRead
                          ? "bg-brand-50 text-brand-600"
                          : "bg-gray-100 text-gray-500",
                      )}
                    >
                      {notificationTypeIcon(n.type || "system")}
                    </div>

                    <div className="min-w-0 flex-1 pr-2">
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "text-sm leading-snug",
                            !n.isRead
                              ? "font-bold text-gray-900 dark:text-white"
                              : "font-semibold text-gray-600 dark:text-gray-300",
                          )}
                        >
                          {n.title}
                        </p>
                        <span className="flex-shrink-0 whitespace-nowrap pt-0.5 text-[10px] font-semibold text-gray-400">
                          {n.createdAt
                            ? new Date(n.createdAt).toLocaleDateString(
                                undefined,
                                { month: "short", day: "numeric" },
                              )
                            : ""}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "line-clamp-2 text-xs leading-relaxed",
                          !n.isRead
                            ? "font-medium text-gray-600 dark:text-gray-400"
                            : "text-gray-500 dark:text-gray-500",
                        )}
                      >
                        {n.message}
                      </p>
                    </div>
                  </Link>
                ),
              )}
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="flex flex-shrink-0 items-center justify-center border-t border-gray-100 bg-gray-50 p-3 dark:border-neutral-800 dark:bg-neutral-900">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              End of notifications
            </span>
          </div>
        )}
      </div>,
      document.body,
    );

  return (
    <div className="relative" ref={triggerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full p-2 text-primary/80 transition-colors hover:bg-neutral-100 focus:outline-none active:scale-95 dark:hover:bg-neutral-800"
        aria-label="Notifications"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell className="h-6 w-6" strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow ring-2 ring-white dark:ring-neutral-900">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {dropdown}
    </div>
  );
}
