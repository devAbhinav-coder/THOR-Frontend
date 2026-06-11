"use client";

import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import {
  Bell,
  Check,
  Loader2,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationApi } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import Link from "next/link";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { queryKeys } from "@/lib/queryKeys";
import { useNotificationBrowserPush } from "@/hooks/useNotificationBrowserPush";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import NotificationPreferencesPanel from "@/components/layout/NotificationPreferencesPanel";
import {
  optimisticMarkNotificationRead,
  optimisticMarkAllNotificationsRead,
  optimisticClearAllNotifications,
  restoreNotificationsCache,
  invalidateNotifications,
} from "@/lib/notificationCache";
import type { NotificationsListResponse } from "@/types/notifications";
import {
  navBadgeCount,
  navDropdownAccent,
  navIconButton,
} from "@/lib/navbarStyles";

const notifActionItemClass =
  "flex w-full items-center gap-2.5 border-l-2 border-transparent px-3 py-2.5 text-left text-[13px] text-gray-700 transition-colors hover:border-[#c5a059] hover:bg-[#c5a059]/5 hover:text-gray-900 disabled:opacity-60";
const notifActionIconClass = "h-3.5 w-3.5 shrink-0 text-[#c5a059]";

const TOAST_CLEAR = "notif-clear-all";
const TOAST_MARK_READ = "notif-mark-all-read";

const PANEL_WIDTH = 380;
const PANEL_MARGIN = 10;
const PANEL_MAX_HEIGHT = 520;
const VIEWPORT_GAP = 8;
const PANEL_FLIP_THRESHOLD = 320;

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function triggerClassForVariant(variant: "navbar" | "admin" | "default") {
  if (variant === "navbar") {
    return cn(navIconButton, "relative");
  }
  if (variant === "admin") {
    return cn(
      "relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/85 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
    );
  }
  return "relative rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-200";
}

export default function NotificationBell({
  align = "right",
  onOpenChange,
  variant = "default",
}: {
  align?: "left" | "right";
  onOpenChange?: (open: boolean) => void;
  variant?: "navbar" | "admin" | "default";
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [panelPos, setPanelPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;
  const { user, isAuthenticated, isLoading, hasSessionChecked } = useAuthStore();
  const isAuthedStable = hasSessionChecked && !isLoading && isAuthenticated;
  const queryClient = useQueryClient();
  const {
    notificationPermission,
    ensurePushSubscription,
    requestBrowserPermission,
  } = useNotificationBrowserPush(isAuthedStable ? user : null);

  const {
    preferences,
    isLoading: preferencesLoading,
    isSaving: preferencesSaving,
    updatePreferences,
  } = useNotificationPreferences(isAuthedStable && !!user);

  const closePanel = useCallback(() => {
    setIsOpen(false);
    setShowActions(false);
  }, []);

  const togglePanel = useCallback(() => {
    setIsOpen((open) => {
      if (open) setShowActions(false);
      return !open;
    });
  }, []);

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

  const { data } = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () => notificationApi.getAll({ limit: 50 }),
    enabled: isAuthedStable && !!user,
    refetchInterval: user?.role === "admin" ? 15000 : 30000,
  });

  const notifications = data?.data?.notifications || [];
  const unreadCount = data?.data?.unreadCount || 0;

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onMutate: (id) => {
      const snapshot = optimisticMarkNotificationRead(queryClient, id);
      return { snapshot };
    },
    onError: (_err, _id, ctx) => {
      restoreNotificationsCache(
        queryClient,
        ctx?.snapshot as NotificationsListResponse | undefined,
      );
    },
    onSettled: () => invalidateNotifications(queryClient),
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onMutate: () => {
      toast.loading("Marking all as read…", { id: TOAST_MARK_READ });
      const snapshot = optimisticMarkAllNotificationsRead(queryClient);
      return { snapshot };
    },
    onSuccess: () => {
      toast.dismiss(TOAST_MARK_READ);
      toast.success("All marked as read");
      setShowActions(false);
    },
    onError: (err: { message?: string }, _v, ctx) => {
      toast.dismiss(TOAST_MARK_READ);
      restoreNotificationsCache(
        queryClient,
        ctx?.snapshot as NotificationsListResponse | undefined,
      );
      toast.error(err?.message || "Could not update notifications.");
    },
    onSettled: () => invalidateNotifications(queryClient),
  });

  const clearAllMutation = useMutation({
    mutationFn: () => notificationApi.clearAll(),
    onMutate: () => {
      toast.loading("Clearing notifications…", { id: TOAST_CLEAR });
      const snapshot = optimisticClearAllNotifications(queryClient);
      return { snapshot };
    },
    onSuccess: () => {
      toast.dismiss(TOAST_CLEAR);
      toast.success("All notifications cleared");
      closePanel();
    },
    onError: (err: { message?: string }, _v, ctx) => {
      toast.dismiss(TOAST_CLEAR);
      restoreNotificationsCache(
        queryClient,
        ctx?.snapshot as NotificationsListResponse | undefined,
      );
      toast.error(err?.message || "Could not clear notifications.");
    },
    onSettled: () => invalidateNotifications(queryClient),
  });

  const sendTestPushMutation = useMutation({
    mutationFn: () => notificationApi.sendTestPushToSelf(),
    onSuccess: () => {
      toast.success("Test push sent. Check your browser/device notifications.");
      setShowActions(false);
    },
    onError: (err: { message?: string }) => {
      toast.error(err?.message || "Could not send test push.");
    },
  });

  const handleNotificationClick = (id: string, isRead: boolean) => {
    if (!isRead) markAsReadMutation.mutate(id);
    closePanel();
  };

  useLayoutEffect(() => {
    if (!isOpen) {
      setPanelPos(null);
      return;
    }
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
    if (!isOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      closePanel();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePanel();
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, closePanel]);

  useEffect(() => {
    if (!isAuthedStable || !user) return;
    void ensurePushSubscription();
  }, [isAuthedStable, user?._id, ensurePushSubscription]);

  if (!isAuthedStable || !user) return null;

  const badgeClass =
    variant === "navbar" ? navBadgeCount : (
      "absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#eb5757] px-0.5 text-[9px] font-semibold leading-none text-white ring-2 ring-white"
    );

  const dropdown =
    isOpen &&
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
        className="flex max-h-[min(80vh,520px)] min-h-0 flex-col overflow-hidden rounded-none border border-[#c5a059]/25 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.12)] animate-[fadeIn_0.2s_ease-out_both]"
        role="dialog"
        aria-label="Notifications"
      >
        <div className={navDropdownAccent} aria-hidden />
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#c5a059]/15 px-4 py-3">
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold tracking-tight text-gray-900">
              Inbox
            </h3>
            {unreadCount > 0 ?
              <p className="text-[12px] text-gray-500">
                {unreadCount} unread
              </p>
            : <p className="text-[12px] text-gray-500">You&apos;re all caught up</p>}
          </div>

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowActions((open) => !open)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-none text-gray-500 transition-colors hover:bg-[#c5a059]/10 hover:text-[#c5a059]"
              aria-label="Notification actions"
              aria-expanded={showActions}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {showActions ?
              <div className="absolute right-0 top-[calc(100%+4px)] z-10 min-w-[12rem] overflow-hidden rounded-none border border-[#c5a059]/25 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.12)]">
                <div className={navDropdownAccent} aria-hidden />
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => markAllAsReadMutation.mutate()}
                    disabled={markAllAsReadMutation.isPending}
                    className={notifActionItemClass}
                  >
                    {markAllAsReadMutation.isPending ?
                      <Loader2 className={cn(notifActionIconClass, "animate-spin")} />
                    : <Check className={notifActionIconClass} />}
                    Mark all as read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={() => clearAllMutation.mutate()}
                    disabled={clearAllMutation.isPending}
                    className={notifActionItemClass}
                  >
                    {clearAllMutation.isPending ?
                      <Loader2 className={cn(notifActionIconClass, "animate-spin")} />
                    : <Trash2 className={notifActionIconClass} />}
                    Clear all
                  </button>
                )}
                {notificationPermission === "default" && (
                  <button
                    type="button"
                    onClick={() => {
                      void requestBrowserPermission();
                      setShowActions(false);
                    }}
                    className={notifActionItemClass}
                  >
                    <Bell className={notifActionIconClass} />
                    Enable alerts
                  </button>
                )}
                {user?.role === "admin" && (
                  <button
                    type="button"
                    onClick={() => sendTestPushMutation.mutate()}
                    disabled={sendTestPushMutation.isPending}
                    className={notifActionItemClass}
                  >
                    {sendTestPushMutation.isPending ?
                      <Loader2 className={cn(notifActionIconClass, "animate-spin")} />
                    : <Bell className={notifActionIconClass} />}
                    Send test push
                  </button>
                )}
              </div>
            : null}
          </div>
        </div>

        {notificationPermission === "denied" && (
          <div className="border-b border-amber-100 bg-amber-50 px-4 py-2.5 text-[12px] leading-snug text-amber-800">
            Browser alerts are blocked. Enable notifications in your browser
            settings.
          </div>
        )}

        <div
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain bg-white scrollbar-hide touch-pan-y"
          data-lenis-prevent
          onClick={() => setShowActions(false)}
        >
          {notifications.length === 0 ?
            <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-none border border-[#c5a059]/20 bg-[#c5a059]/5 text-[#c5a059]">
                <Bell className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <p className="text-[14px] font-medium text-gray-900">
                No notifications yet
              </p>
              <p className="mt-1 max-w-[16rem] text-[13px] leading-relaxed text-gray-500">
                Updates about your orders and account will show up here.
              </p>
            </div>
          : <div className="flex flex-col">
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
                      "group relative flex items-start gap-3 border-b border-gray-100 px-4 py-3 transition-colors last:border-0 hover:bg-[#c5a059]/5",
                      !n.isRead && "bg-[#fafafa]",
                    )}
                  >
                    {!n.isRead ?
                      <div
                        className="absolute bottom-0 left-0 top-0 w-[2px] bg-[#c5a059]"
                        aria-hidden
                      />
                    : null}
                    <div className="mt-1.5 flex w-2 shrink-0 justify-center">
                      {!n.isRead ?
                        <span className="h-2 w-2 rounded-none bg-[#c5a059]" />
                      : <span className="h-2 w-2 bg-transparent" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p
                          className={cn(
                            "text-[14px] leading-snug text-gray-900",
                            !n.isRead ? "font-semibold" : "font-medium",
                          )}
                        >
                          {n.title}
                        </p>
                        <span className="shrink-0 pt-0.5 text-[12px] text-gray-400">
                          {formatRelativeTime(n.createdAt)}
                        </span>
                      </div>
                      {n.message ?
                        <p className="mt-0.5 line-clamp-2 text-[13px] leading-relaxed text-gray-500">
                          {n.message}
                        </p>
                      : null}
                    </div>
                  </Link>
                ),
              )}
            </div>
          }
        </div>

        <NotificationPreferencesPanel
          preferences={preferences}
          isLoading={preferencesLoading}
          isSaving={preferencesSaving}
          onSave={(patch) => {
            updatePreferences(patch, {
              onSuccess: () => toast.success("Notification preferences saved"),
              onError: (err: { message?: string }) =>
                toast.error(err?.message || "Could not save preferences."),
            });
          }}
        />
      </div>,
      document.body,
    );

  return (
    <div className="relative" ref={triggerRef}>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          togglePanel();
        }}
        className={triggerClassForVariant(variant)}
        aria-label="Notifications"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <Bell
          className={cn(
            variant === "navbar" ? "h-5 w-5" : "h-[1.125rem] w-[1.125rem]",
          )}
          strokeWidth={variant === "navbar" ? 1.75 : 1.5}
        />
        {unreadCount > 0 && (
          <span className={badgeClass}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {dropdown}
    </div>
  );
}
