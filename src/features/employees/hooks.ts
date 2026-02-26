import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { employeeApi, type EmployeeListParams, type EmployeeCreateRequest, type EmployeeUpdateRequest } from "./api"

export const employeeKeys = {
  all: ["employees"] as const,
  lists: () => [...employeeKeys.all, "list"] as const,
  list: (params: EmployeeListParams) => [...employeeKeys.lists(), params] as const,
  details: () => [...employeeKeys.all, "detail"] as const,
  detail: (id: string) => [...employeeKeys.details(), id] as const,
  select: () => [...employeeKeys.all, "select"] as const,
}

export function useEmployees(params: EmployeeListParams = {}) {
  return useQuery({
    queryKey: employeeKeys.list(params),
    queryFn: () => employeeApi.getAll(params),
    staleTime: 0,
    gcTime: 0,
  })
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: employeeKeys.detail(id),
    queryFn: () => employeeApi.getById(id),
    enabled: !!id,
  })
}

export function useEmployeeForEdit(id: string) {
  return useQuery({
    queryKey: [...employeeKeys.details(), "edit", id],
    queryFn: () => employeeApi.getForEdit(id),
    enabled: !!id,
  })
}

export function useEmployeeSelect() {
  return useQuery({
    queryKey: employeeKeys.select(),
    queryFn: () => employeeApi.getSelect(),
  })
}

export function useCreateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: EmployeeCreateRequest) => employeeApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
    },
  })
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EmployeeUpdateRequest }) =>
      employeeApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: employeeKeys.details() })
    },
  })
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => employeeApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
    },
  })
}
