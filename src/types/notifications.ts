export type NotificationCategory =
  | "order"
  | "promotion"
  | "system"
  | "alert"
  | "info"
  | "success"
  | "error";

export type NotificationPreferences = {
  pushOptIn: boolean;
  mutedCategories: NotificationCategory[];
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
};

export type NotificationListItem = {
  _id: string;
  link?: string;
  isRead?: boolean;
  type?: string;
  title?: string;
  message?: string;
  createdAt?: string;
};

export type NotificationsListResponse = {
  status: string;
  success?: boolean;
  message?: string;
  data?: {
    notifications?: NotificationListItem[];
    unreadCount?: number;
  };
};

export type NotificationPreferencesPatch = Partial<NotificationPreferences>;
