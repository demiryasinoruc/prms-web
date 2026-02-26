import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  inventoryApi,
  type InventoryListParams,
  type InventoryCreateRequest,
  type InventoryUpdateRequest,
  type InventoryStatus,
} from "./api"

// Query Keys
export const inventoryKeys = {
  all: ["inventory"] as const,
  lists: () => [...inventoryKeys.all, "list"] as const,
  list: (params: InventoryListParams) => [...inventoryKeys.lists(), params] as const,
  details: () => [...inventoryKeys.all, "detail"] as const,
  detail: (id: string) => [...inventoryKeys.details(), id] as const,
}

// Query Hooks
export function useInventory(params: InventoryListParams = {}) {
  return useQuery({
    queryKey: inventoryKeys.list(params),
    queryFn: () => inventoryApi.getAll(params),
    staleTime: 0,
    gcTime: 0,
  })
}

export function useInventoryDetail(id: string | null) {
  return useQuery({
    queryKey: inventoryKeys.detail(id!),
    queryFn: () => inventoryApi.getDetail(id!),
    enabled: !!id,
  })
}

// Mutation Hooks
export function useCreateInventory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: InventoryCreateRequest) => inventoryApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() })
    },
  })
}

export function useUpdateInventory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: InventoryUpdateRequest }) =>
      inventoryApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(variables.id) })
    },
  })
}

export function useUpdateInventoryStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: InventoryStatus }) =>
      inventoryApi.updateStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(variables.id) })
    },
  })
}

export function useDeleteInventory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => inventoryApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() })
    },
  })
}
