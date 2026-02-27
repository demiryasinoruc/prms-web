import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  calendarApi,
  type CalendarEventListParams,
  type CalendarEventCreateRequest,
  type CalendarEventUpdateRequest,
} from "./api"

export const calendarKeys = {
  all: ["calendar-events"] as const,
  lists: () => [...calendarKeys.all, "list"] as const,
  list: (params: CalendarEventListParams) => [...calendarKeys.lists(), params] as const,
  details: () => [...calendarKeys.all, "detail"] as const,
  detail: (id: string) => [...calendarKeys.details(), id] as const,
  forEdit: (id: string) => [...calendarKeys.all, "forEdit", id] as const,
}

export function useCalendarEvents(params: CalendarEventListParams = {}) {
  return useQuery({
    queryKey: calendarKeys.list(params),
    queryFn: () => calendarApi.getAll(params),
    staleTime: 0,
    gcTime: 0,
  })
}

export function useCalendarEventDetail(id: string | null) {
  return useQuery({
    queryKey: calendarKeys.detail(id!),
    queryFn: () => calendarApi.getDetail(id!),
    enabled: !!id,
  })
}

export function useCreateCalendarEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CalendarEventCreateRequest) => calendarApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.lists() })
    },
  })
}

export function useUpdateCalendarEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CalendarEventUpdateRequest }) =>
      calendarApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.lists() })
      queryClient.invalidateQueries({ queryKey: calendarKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: calendarKeys.forEdit(variables.id) })
    },
  })
}

export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => calendarApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.lists() })
    },
  })
}
