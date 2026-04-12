"use client";

import { useState, useRef, useEffect, type ReactElement } from "react";
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

export default function NotificationBell({
  align = "right",
}: {
  align?: "left" | "right";
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const {
    notificationPermission,
    ensurePushSubscription,
    requestBrowserPermission,
  } = useNotificationBrowserPush(user);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const { data } = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () => notificationApi.getAll({ limit: 50 }),
    enabled: !!user,
    refetchInterval: user?.role === "admin" ? 15000 : 30000,
  });

  const notifications = data?.data?.notifications || [];
  const unreadCount = data?.data?.unreadCount || 0;

  useEffect(() => {
    if (!user) return;
    void ensurePushSubscription();
  }, [user, notifications.length, ensurePushSubscription]);

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

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-primary/80 hover:text-primary transition-colors focus:outline-none rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-95"
        aria-label="Notifications"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell className="w-6 h-6" strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow ring-2 ring-white dark:ring-neutral-900">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute mt-3 flex flex-col w-80 md:w-96 max-h-[80vh] sm:max-h-[60vh] rounded-2xl bg-white dark:bg-neutral-900 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 dark:border-neutral-800 overflow-hidden z-[200] animate-in slide-in-from-top-2 duration-200",
            align === "right"
              ? "right-0 origin-top-right"
              : "left-0 origin-top-left",
          )}
        >
          <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 bg-white dark:bg-neutral-900 border-b border-gray-100 dark:border-neutral-800 gap-2">
            <h3 className="font-bold text-gray-900 dark:text-white text-base shrink-0">
              Notifications
            </h3>
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              {notificationPermission === "default" && (
                <button
                  type="button"
                  onClick={() => void requestBrowserPermission()}
                  className="flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors"
                >
                  Enable alerts
                </button>
              )}
              {user?.role === "admin" && (
                <button
                  type="button"
                  onClick={() => sendTestPushMutation.mutate()}
                  disabled={sendTestPushMutation.isPending}
                  className="flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 disabled:opacity-60 disabled:cursor-not-allowed rounded-full transition-colors"
                >
                  {sendTestPushMutation.isPending ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
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
                  className="flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 disabled:opacity-60 disabled:cursor-not-allowed rounded-full transition-colors"
                >
                  {markAllAsReadMutation.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}
                  {markAllAsReadMutation.isPending ? "Working…" : "Mark read"}
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={() => clearAllMutation.mutate()}
                  disabled={clearAllMutation.isPending}
                  className="flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 hover:bg-red-50 hover:text-red-600 disabled:opacity-60 disabled:cursor-not-allowed rounded-full transition-colors"
                >
                  {clearAllMutation.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                  {clearAllMutation.isPending ? "Clearing…" : "Clear all"}
                </button>
              )}
            </div>
          </div>
          {notificationPermission === "denied" && (
            <div className="px-5 py-2 text-[11px] text-amber-700 bg-amber-50 border-b border-amber-100">
              Browser alerts are blocked for this site. Enable notifications
              from browser settings.
            </div>
          )}

          <div
            className="flex-1 overflow-y-auto overscroll-contain overflow-x-hidden no-scrollbar bg-gray-50/30 dark:bg-neutral-900/50"
            data-lenis-prevent
          >
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                  <Bell className="h-7 w-7 text-gray-300" />
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-neutral-100">
                  All caught up!
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  You have no new notifications.
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((n: { _id: string; link?: string; isRead?: boolean; type?: string; title?: string; message?: string; createdAt?: string }) => (
                  <Link
                    key={n._id}
                    href={n.link || "#"}
                    onClick={(e) => {
                      if (!n.link) e.preventDefault();
                      handleNotificationClick(n._id, !!n.isRead);
                    }}
                    className={cn(
                      "flex items-start gap-3 p-2 hover:bg-gray-50 dark:hover:bg-neutral-800/80 transition-colors relative group border-b border-gray-100 last:border-0",
                      !n.isRead
                        ? "bg-white dark:bg-neutral-900"
                        : "bg-gray-50/50 dark:bg-neutral-900/50 opacity-75 hover:opacity-100",
                    )}
                  >
                    {!n.isRead && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-500" />
                    )}

                    <div
                      className={cn(
                        "mt-0.5 p-2.5 rounded-full flex-shrink-0",
                        !n.isRead
                          ? "bg-brand-50 text-brand-600"
                          : "bg-gray-100 text-gray-500",
                      )}
                    >
                      {notificationTypeIcon(n.type || "system")}
                    </div>

                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-start justify-between gap-2 mb-1">
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
                        <span className="flex-shrink-0 text-[10px] font-semibold text-gray-400 whitespace-nowrap pt-0.5">
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
                          "text-xs leading-relaxed line-clamp-2",
                          !n.isRead
                            ? "text-gray-600 dark:text-gray-400 font-medium"
                            : "text-gray-500 dark:text-gray-500",
                        )}
                      >
                        {n.message}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="flex-shrink-0 p-3 bg-gray-50 dark:bg-neutral-900 border-t border-gray-100 items-center justify-center flex">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                End of notifications
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
