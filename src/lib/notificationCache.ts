import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import type {
  NotificationListItem,
  NotificationsListResponse,
} from "@/types/notifications";

export function getNotificationsCache(
  queryClient: QueryClient
): NotificationsListResponse | undefined {
  return queryClient.getQueryData<NotificationsListResponse>(
    queryKeys.notifications
  );
}

export function setNotificationsCache(
  queryClient: QueryClient,
  updater: (
    prev: NotificationsListResponse | undefined
  ) => NotificationsListResponse | undefined
): void {
  queryClient.setQueryData<NotificationsListResponse>(
    queryKeys.notifications,
    updater
  );
}

function patchList(
  prev: NotificationsListResponse | undefined,
  patch: {
    notifications?: NotificationListItem[];
    unreadCount?: number;
  }
): NotificationsListResponse | undefined {
  if (!prev?.data) return prev;
  return {
    ...prev,
    data: {
      ...prev.data,
      ...(patch.notifications !== undefined
        ? { notifications: patch.notifications }
        : {}),
      ...(patch.unreadCount !== undefined
        ? { unreadCount: patch.unreadCount }
        : {}),
    },
  };
}

/** Optimistic single read — decrements badge immediately. */
export function optimisticMarkNotificationRead(
  queryClient: QueryClient,
  notificationId: string
): NotificationsListResponse | undefined {
  const prev = getNotificationsCache(queryClient);
  if (!prev?.data?.notifications) return prev;

  let decremented = false;
  const notifications = prev.data.notifications.map((n) => {
    if (n._id !== notificationId || n.isRead) return n;
    decremented = true;
    return { ...n, isRead: true };
  });

  const unreadCount = Math.max(
    0,
    (prev.data.unreadCount ?? 0) - (decremented ? 1 : 0)
  );

  const next = patchList(prev, { notifications, unreadCount });
  setNotificationsCache(queryClient, () => next);
  return prev;
}

/** Optimistic mark-all — badge goes to zero immediately. */
export function optimisticMarkAllNotificationsRead(
  queryClient: QueryClient
): NotificationsListResponse | undefined {
  const prev = getNotificationsCache(queryClient);
  if (!prev?.data?.notifications) return prev;

  const notifications = prev.data.notifications.map((n) => ({
    ...n,
    isRead: true,
  }));
  const next = patchList(prev, { notifications, unreadCount: 0 });
  setNotificationsCache(queryClient, () => next);
  return prev;
}

/** Optimistic clear — empty list and zero badge. */
export function optimisticClearAllNotifications(
  queryClient: QueryClient
): NotificationsListResponse | undefined {
  const prev = getNotificationsCache(queryClient);
  if (!prev) return prev;
  const next = patchList(prev, { notifications: [], unreadCount: 0 });
  setNotificationsCache(queryClient, () => next);
  return prev;
}

export function restoreNotificationsCache(
  queryClient: QueryClient,
  snapshot: NotificationsListResponse | undefined
): void {
  if (snapshot !== undefined) {
    queryClient.setQueryData(queryKeys.notifications, snapshot);
  }
}

export function invalidateNotifications(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
}
