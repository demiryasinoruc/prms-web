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
  forEdit: (id: string) => [...inventoryKeys.all, "forEdit", id] as const,
  select: () => [...inventoryKeys.all, "select"] as const,
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

export function useInventorySelect() {
  return useQuery({
    queryKey: inventoryKeys.select(),
    queryFn: () => inventoryApi.getSelect(),
  })
}

/**
 * Bir ürünün envanter durum dağılımı (kaç adet müsait, kirada, bakımda vb).
 * Product detail kart'ı için kullanılır.
 */
export function useInventoryStatsByProduct(productId: string | null) {
  return useQuery({
    queryKey: [...inventoryKeys.all, "stats", productId] as const,
    queryFn: async () => {
      const result = await inventoryApi.getAll({
        productId: productId!,
        pageNumber: 1,
        pageSize: 500,
      })
      const counts: Record<number, number> = {}
      for (const inv of result.data) {
        counts[inv.status] = (counts[inv.status] ?? 0) + 1
      }
      return {
        total: result.totalCount,
        counts,
      }
    },
    enabled: !!productId,
    staleTime: 30 * 1000,
  })
}

export function useInventorySelectByProduct(
  productId: string,
  productVariantId?: string | null,
  warehouseId?: string | null,
  startDate?: string | null,
  endDate?: string | null,
  excludeRentalId?: string | null,
  includeConflicting?: boolean,
) {
  return useQuery({
    queryKey: [
      ...inventoryKeys.all,
      "selectByProduct",
      productId,
      productVariantId,
      warehouseId,
      startDate,
      endDate,
      excludeRentalId,
      includeConflicting,
    ] as const,
    queryFn: () =>
      inventoryApi.getSelectByProduct(
        productId,
        productVariantId || undefined,
        warehouseId || undefined,
        startDate || undefined,
        endDate || undefined,
        excludeRentalId || undefined,
        includeConflicting,
      ),
    enabled: !!productId,
    staleTime: 0,
  })
}

// Mutation Hooks
export function useCreateInventory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: InventoryCreateRequest) => inventoryApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: inventoryKeys.select() })
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
      queryClient.invalidateQueries({ queryKey: inventoryKeys.forEdit(variables.id) })
      queryClient.invalidateQueries({ queryKey: inventoryKeys.select() })
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
      queryClient.invalidateQueries({ queryKey: inventoryKeys.select() })
    },
  })
}

export function useDeleteInventory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => inventoryApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: inventoryKeys.select() })
    },
  })
}
