import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { warehouseApi, type WarehouseListParams, type WarehouseCreateRequest, type WarehouseUpdateRequest } from "./api"

export const warehouseKeys = {
  all: ["warehouses"] as const,
  lists: () => [...warehouseKeys.all, "list"] as const,
  list: (params: WarehouseListParams) => [...warehouseKeys.lists(), params] as const,
  details: () => [...warehouseKeys.all, "detail"] as const,
  detail: (id: string) => [...warehouseKeys.details(), id] as const,
  select: () => [...warehouseKeys.all, "select"] as const,
}

export function useWarehouses(params: WarehouseListParams = {}) {
  return useQuery({
    queryKey: warehouseKeys.list(params),
    queryFn: () => warehouseApi.getAll(params),
    staleTime: 0,
    gcTime: 0,
  })
}

export function useWarehouse(id: string) {
  return useQuery({
    queryKey: warehouseKeys.detail(id),
    queryFn: () => warehouseApi.getById(id),
    enabled: !!id,
  })
}

export function useWarehouseForEdit(id: string) {
  return useQuery({
    queryKey: [...warehouseKeys.details(), "edit", id],
    queryFn: () => warehouseApi.getForEdit(id),
    enabled: !!id,
  })
}

export function useWarehouseSelect() {
  return useQuery({
    queryKey: warehouseKeys.select(),
    queryFn: () => warehouseApi.getSelect(),
  })
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: WarehouseCreateRequest) => warehouseApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.lists() })
    },
  })
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: WarehouseUpdateRequest }) =>
      warehouseApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.lists() })
      queryClient.invalidateQueries({ queryKey: warehouseKeys.details() })
    },
  })
}

export function useDeleteWarehouse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => warehouseApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.lists() })
    },
  })
}
