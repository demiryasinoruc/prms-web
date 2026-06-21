import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  warehouseTransferApi,
  type WarehouseTransferListParams,
  type WarehouseTransferCreateRequest,
  type WarehouseTransferUpdateRequest,
} from "./api"
import { inventoryApi, InventoryStatus } from "@/features/inventory/api"

// Depo select hook'unu yeniden kullan (kaynak/hedef depo dropdown'ları için)
export { useWarehouseSelect } from "@/features/warehouses/hooks"

export const warehouseTransferKeys = {
  all: ["warehouse-transfers"] as const,
  lists: () => [...warehouseTransferKeys.all, "list"] as const,
  list: (params: WarehouseTransferListParams) =>
    [...warehouseTransferKeys.lists(), params] as const,
  details: () => [...warehouseTransferKeys.all, "detail"] as const,
  detail: (id: string) => [...warehouseTransferKeys.details(), id] as const,
  forEdit: (id: string) => [...warehouseTransferKeys.all, "forEdit", id] as const,
  inventoryByWarehouse: (warehouseId: string) =>
    [...warehouseTransferKeys.all, "inventory", warehouseId] as const,
}

export function useWarehouseTransfers(params: WarehouseTransferListParams = {}) {
  return useQuery({
    queryKey: warehouseTransferKeys.list(params),
    queryFn: () => warehouseTransferApi.getAll(params),
    staleTime: 0,
    gcTime: 0,
  })
}

export function useWarehouseTransferDetail(id: string | null) {
  return useQuery({
    queryKey: warehouseTransferKeys.detail(id!),
    queryFn: () => warehouseTransferApi.getDetail(id!),
    enabled: !!id,
  })
}

export function useWarehouseTransferForEdit(id: string | null) {
  return useQuery({
    queryKey: warehouseTransferKeys.forEdit(id!),
    queryFn: () => warehouseTransferApi.getForEdit(id!),
    enabled: !!id,
  })
}

/**
 * Kaynak depodaki müsait envanter satırlarını select için getirir.
 * `/inventory/select` depo filtresi desteklemediğinden envanter liste
 * endpoint'i kaynak depo + Müsait durum ile filtrelenir ve seçenek listesine
 * dönüştürülür.
 */
export interface TransferInventoryOption {
  id: string
  label: string
  productName: string
  serialNumber: string
  variantSku: string | null
}

export function useTransferInventorySelect(warehouseId: string | null | undefined) {
  return useQuery({
    queryKey: warehouseTransferKeys.inventoryByWarehouse(warehouseId || ""),
    queryFn: async (): Promise<TransferInventoryOption[]> => {
      const result = await inventoryApi.getAll({
        warehouseId: warehouseId!,
        status: InventoryStatus.Available,
        isActive: true,
        pageNumber: 1,
        pageSize: 500,
      })
      return result.data.map((inv) => {
        const variantSku = inv.productVariantSku || null
        const parts = [inv.productName]
        if (variantSku) parts.push(variantSku)
        if (inv.serialNumber) parts.push(inv.serialNumber)
        return {
          id: inv.id,
          label: parts.join(" · "),
          productName: inv.productName,
          serialNumber: inv.serialNumber,
          variantSku,
        }
      })
    },
    enabled: !!warehouseId,
    staleTime: 0,
  })
}

export function useCreateWarehouseTransfer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: WarehouseTransferCreateRequest) => warehouseTransferApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseTransferKeys.lists() })
    },
  })
}

export function useUpdateWarehouseTransfer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: WarehouseTransferUpdateRequest }) =>
      warehouseTransferApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: warehouseTransferKeys.lists() })
      queryClient.invalidateQueries({ queryKey: warehouseTransferKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: warehouseTransferKeys.forEdit(variables.id) })
    },
  })
}

export function useDeleteWarehouseTransfer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => warehouseTransferApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseTransferKeys.lists() })
    },
  })
}

// Durum geçiş mutation'ları — invalidate: liste + detay
function useTransferStatusMutation(action: (id: string) => Promise<void>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => action(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: warehouseTransferKeys.lists() })
      queryClient.invalidateQueries({ queryKey: warehouseTransferKeys.detail(id) })
      // Stok değiştiği için envanter listelerini de tazele
      queryClient.invalidateQueries({ queryKey: ["inventory"] })
    },
  })
}

export function useDispatchWarehouseTransfer() {
  return useTransferStatusMutation(warehouseTransferApi.dispatch)
}

export function useReceiveWarehouseTransfer() {
  return useTransferStatusMutation(warehouseTransferApi.receive)
}

export function useCancelWarehouseTransfer() {
  return useTransferStatusMutation(warehouseTransferApi.cancel)
}
