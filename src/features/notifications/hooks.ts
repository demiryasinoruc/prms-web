import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  notificationApi,
  NotificationStatus,
  type NotificationListParams,
  type NotificationUpdateStatusRequest,
} from "./api"

export const notificationKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  list: (params: NotificationListParams) => [...notificationKeys.lists(), params] as const,
  count: () => [...notificationKeys.all, "count"] as const,
  details: () => [...notificationKeys.all, "detail"] as const,
  detail: (id: string) => [...notificationKeys.details(), id] as const,
}

export function useNotifications(params: NotificationListParams = {}) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => notificationApi.getAll(params),
    staleTime: 0,
    gcTime: 0,
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.count(),
    queryFn: () => notificationApi.getCount(),
    // Bell badge için 30 sn'lik polling; arka planda hafif kalsın.
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  })
}

export function useNotificationDetail(id: string) {
  return useQuery({
    queryKey: notificationKeys.detail(id),
    queryFn: () => notificationApi.getById(id),
    enabled: !!id,
  })
}

export function useUpdateNotificationStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: NotificationUpdateStatusRequest }) =>
      notificationApi.updateStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      notificationApi.updateStatus(id, { status: NotificationStatus.Read }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}

export function useDeleteNotification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}
