import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  employeeLeaveApi,
  type EmployeeLeaveListParams,
  type EmployeeLeaveCreateRequest,
  type EmployeeLeaveUpdateRequest,
} from "./api"

// Çalışan dropdown'u için mevcut employees select hook'unu yeniden kullan
export { useEmployeeSelect } from "@/features/employees/hooks"

export const employeeLeaveKeys = {
  all: ["employee-leaves"] as const,
  lists: () => [...employeeLeaveKeys.all, "list"] as const,
  list: (params: EmployeeLeaveListParams) => [...employeeLeaveKeys.lists(), params] as const,
  forEdit: (id: string) => [...employeeLeaveKeys.all, "forEdit", id] as const,
}

export function useEmployeeLeaves(params: EmployeeLeaveListParams = {}) {
  return useQuery({
    queryKey: employeeLeaveKeys.list(params),
    queryFn: () => employeeLeaveApi.getAll(params),
    staleTime: 0,
    gcTime: 0,
  })
}

export function useEmployeeLeaveForEdit(id: string) {
  return useQuery({
    queryKey: employeeLeaveKeys.forEdit(id),
    queryFn: () => employeeLeaveApi.getForEdit(id),
    enabled: !!id,
  })
}

export function useCreateEmployeeLeave() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: EmployeeLeaveCreateRequest) => employeeLeaveApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeLeaveKeys.lists() })
    },
  })
}

export function useUpdateEmployeeLeave() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EmployeeLeaveUpdateRequest }) =>
      employeeLeaveApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: employeeLeaveKeys.lists() })
      queryClient.invalidateQueries({ queryKey: employeeLeaveKeys.forEdit(variables.id) })
    },
  })
}

export function useDeleteEmployeeLeave() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => employeeLeaveApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeLeaveKeys.lists() })
    },
  })
}
