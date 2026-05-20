"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { invalidateNotifications } from "@/lib/notificationCache";
import type {
  NotificationPreferences,
  NotificationPreferencesPatch,
} from "@/types/notifications";

export function useNotificationPreferences(enabled: boolean) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.notificationPreferences,
    queryFn: () => notificationApi.getPreferences(),
    enabled,
    staleTime: 60_000,
  });

  const updateMutation = useMutation({
    mutationFn: (patch: NotificationPreferencesPatch) =>
      notificationApi.updatePreferences(patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notificationPreferences,
      });
      invalidateNotifications(queryClient);
    },
  });

  const raw = query.data?.data?.preferences;
  const preferences: NotificationPreferences | undefined = raw
    ? {
        pushOptIn: raw.pushOptIn,
        mutedCategories: raw.mutedCategories as NotificationPreferences["mutedCategories"],
        quietHoursStart: raw.quietHoursStart,
        quietHoursEnd: raw.quietHoursEnd,
      }
    : undefined;

  return {
    preferences,
    isLoading: query.isLoading,
    isSaving: updateMutation.isPending,
    updatePreferences: updateMutation.mutate,
    updatePreferencesAsync: updateMutation.mutateAsync,
  };
}
