import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  maintenanceScheduleApi,
  type MaintenanceScheduleListParams,
  type MaintenanceScheduleCreateRequest,
  type MaintenanceScheduleUpdateRequest,
} from "./api"

export const maintenanceScheduleKeys = {
  all: ["maintenanceSchedules"] as const,
  lists: () => [...maintenanceScheduleKeys.all, "list"] as const,
  list: (params: MaintenanceScheduleListParams) => [...maintenanceScheduleKeys.lists(), params] as const,
  forEdit: (id: string) => [...maintenanceScheduleKeys.all, "forEdit", id] as const,
}

export function useMaintenanceSchedules(params: MaintenanceScheduleListParams = {}) {
  return useQuery({
    queryKey: maintenanceScheduleKeys.list(params),
    queryFn: () => maintenanceScheduleApi.getAll(params),
    staleTime: 0,
    gcTime: 0,
  })
}

export function useMaintenanceScheduleForEdit(id: string | null) {
  return useQuery({
    queryKey: maintenanceScheduleKeys.forEdit(id!),
    queryFn: () => maintenanceScheduleApi.getForEdit(id!),
    enabled: !!id,
  })
}

export function useCreateMaintenanceSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: MaintenanceScheduleCreateRequest) => maintenanceScheduleApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maintenanceScheduleKeys.lists() })
    },
  })
}

export function useUpdateMaintenanceSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MaintenanceScheduleUpdateRequest }) =>
      maintenanceScheduleApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: maintenanceScheduleKeys.lists() })
      queryClient.invalidateQueries({ queryKey: maintenanceScheduleKeys.forEdit(variables.id) })
    },
  })
}

export function useDeleteMaintenanceSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => maintenanceScheduleApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maintenanceScheduleKeys.lists() })
    },
  })
}
