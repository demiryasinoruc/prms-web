import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { customerApi, type CustomerListParams, type CustomerCreateRequest, type CustomerUpdateRequest } from "./api"

export const customerKeys = {
  all: ["customers"] as const,
  lists: () => [...customerKeys.all, "list"] as const,
  list: (params: CustomerListParams) => [...customerKeys.lists(), params] as const,
  details: () => [...customerKeys.all, "detail"] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
  select: () => [...customerKeys.all, "select"] as const,
  forEdit: (id: string) => [...customerKeys.all, "forEdit", id] as const,
}

export function useCustomers(params: CustomerListParams = {}) {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => customerApi.getAll(params),
    staleTime: 0,
    gcTime: 0,
  })
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => customerApi.getById(id),
    enabled: !!id,
  })
}

export function useCustomerForEdit(id: string) {
  return useQuery({
    queryKey: customerKeys.forEdit(id),
    queryFn: () => customerApi.getForEdit(id),
    enabled: !!id,
  })
}

export function useCustomerSelect() {
  return useQuery({
    queryKey: customerKeys.select(),
    queryFn: () => customerApi.getSelect(),
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CustomerCreateRequest) => customerApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() })
      queryClient.invalidateQueries({ queryKey: customerKeys.select() })
    },
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CustomerUpdateRequest }) =>
      customerApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() })
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: customerKeys.forEdit(id) })
      queryClient.invalidateQueries({ queryKey: customerKeys.select() })
    },
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => customerApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() })
      queryClient.invalidateQueries({ queryKey: customerKeys.select() })
    },
  })
}

// Helper hook to get customer addresses
export function useCustomerAddresses(customerId: string) {
  const { data: customer, ...rest } = useCustomer(customerId)
  return {
    data: customer?.addresses || [],
    ...rest,
  }
}
