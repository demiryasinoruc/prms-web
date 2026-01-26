import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  rentalApi,
  type RentalListParams,
  type PaginatedRentalResponse,
  type RentalCreateRequest,
  type RentalUpdateRequest,
  type RentalUpdateStatusRequest,
  type RentalPaymentRequest,
  type RentalItemReturnRequest,
} from "./api"

// Query Keys
export const rentalKeys = {
  all: ["rentals"] as const,
  lists: () => [...rentalKeys.all, "list"] as const,
  list: (params: RentalListParams) => [...rentalKeys.lists(), params] as const,
  details: () => [...rentalKeys.all, "detail"] as const,
  detail: (id: string) => [...rentalKeys.details(), id] as const,
  forEdit: (id: string) => [...rentalKeys.all, "forEdit", id] as const,
}

// Query Hooks
export function useRentals(params: RentalListParams = {}) {
  return useQuery({
    queryKey: rentalKeys.list(params),
    queryFn: () => rentalApi.getAll(params),
    staleTime: 0,
    gcTime: 0,
  })
}

export function useRentalDetail(id: string | null) {
  return useQuery({
    queryKey: rentalKeys.detail(id!),
    queryFn: () => rentalApi.getDetail(id!),
    enabled: !!id,
  })
}

export function useRentalForEdit(id: string | null) {
  return useQuery({
    queryKey: rentalKeys.forEdit(id!),
    queryFn: () => rentalApi.getForEdit(id!),
    enabled: !!id,
  })
}

// Mutation Hooks
export function useCreateRental() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: RentalCreateRequest) => rentalApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rentalKeys.lists() })
    },
  })
}

export function useUpdateRental() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RentalUpdateRequest }) =>
      rentalApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: rentalKeys.lists() })
      queryClient.invalidateQueries({ queryKey: rentalKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: rentalKeys.forEdit(variables.id) })
    },
  })
}

export function useUpdateRentalStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RentalUpdateStatusRequest }) =>
      rentalApi.updateStatus(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: rentalKeys.lists() })
      queryClient.invalidateQueries({ queryKey: rentalKeys.detail(variables.id) })
    },
  })
}

export function useAddRentalPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RentalPaymentRequest }) =>
      rentalApi.addPayment(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: rentalKeys.detail(variables.id) })
    },
  })
}

export function useReturnRentalItems() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, items }: { id: string; items: RentalItemReturnRequest[] }) =>
      rentalApi.returnItems(id, items),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: rentalKeys.lists() })
      queryClient.invalidateQueries({ queryKey: rentalKeys.detail(variables.id) })
    },
  })
}

export function useDeleteRental() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => rentalApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rentalKeys.lists() })
    },
  })
}
