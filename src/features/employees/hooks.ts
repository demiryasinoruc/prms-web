import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { employeeApi, type EmployeeListParams, type EmployeeCreateRequest, type EmployeeUpdateRequest } from "./api"

export function useEmployees(params: EmployeeListParams = {}) {
  return useQuery({
    queryKey: ["employees", params],
    queryFn: () => employeeApi.getAll(params),
    staleTime: 0,
    gcTime: 0,
  })
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: ["employee", id],
    queryFn: () => employeeApi.getById(id),
    enabled: !!id,
  })
}

export function useEmployeeForEdit(id: string) {
  return useQuery({
    queryKey: ["employee", "edit", id],
    queryFn: () => employeeApi.getForEdit(id),
    enabled: !!id,
  })
}

export function useEmployeeSelect() {
  return useQuery({
    queryKey: ["employees", "select"],
    queryFn: () => employeeApi.getSelect(),
  })
}

export function useCreateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: EmployeeCreateRequest) => employeeApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] })
    },
  })
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EmployeeUpdateRequest }) =>
      employeeApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] })
      queryClient.invalidateQueries({ queryKey: ["employee"] })
    },
  })
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => employeeApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] })
    },
  })
}
