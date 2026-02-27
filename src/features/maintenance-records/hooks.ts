import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  maintenanceRecordApi,
  type MaintenanceRecordListParams,
  type MaintenanceRecordCreateRequest,
  type MaintenanceRecordUpdateRequest,
} from "./api"

export const maintenanceRecordKeys = {
  all: ["maintenanceRecords"] as const,
  lists: () => [...maintenanceRecordKeys.all, "list"] as const,
  list: (params: MaintenanceRecordListParams) => [...maintenanceRecordKeys.lists(), params] as const,
  forEdit: (id: string) => [...maintenanceRecordKeys.all, "forEdit", id] as const,
}

export function useMaintenanceRecords(params: MaintenanceRecordListParams = {}) {
  return useQuery({
    queryKey: maintenanceRecordKeys.list(params),
    queryFn: () => maintenanceRecordApi.getAll(params),
    staleTime: 0,
    gcTime: 0,
  })
}

export function useMaintenanceRecordForEdit(id: string | null) {
  return useQuery({
    queryKey: maintenanceRecordKeys.forEdit(id!),
    queryFn: () => maintenanceRecordApi.getForEdit(id!),
    enabled: !!id,
    // Kayıt değiştiğinde eski veriyi gösterme
    placeholderData: undefined,
  })
}

export function useCreateMaintenanceRecord() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: MaintenanceRecordCreateRequest) => maintenanceRecordApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maintenanceRecordKeys.lists() })
    },
  })
}

export function useUpdateMaintenanceRecord() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MaintenanceRecordUpdateRequest }) =>
      maintenanceRecordApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: maintenanceRecordKeys.lists() })
      queryClient.invalidateQueries({ queryKey: maintenanceRecordKeys.forEdit(variables.id) })
    },
  })
}

export function useDeleteMaintenanceRecord() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => maintenanceRecordApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maintenanceRecordKeys.lists() })
    },
  })
}
