import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { warehouseApi, type WarehouseListParams, type WarehouseCreateRequest, type WarehouseUpdateRequest } from "./api"

export function useWarehouses(params: WarehouseListParams = {}) {
  return useQuery({
    queryKey: ["warehouses", params],
    queryFn: () => warehouseApi.getAll(params),
    staleTime: 0,
    gcTime: 0,
  })
}

export function useWarehouse(id: string) {
  return useQuery({
    queryKey: ["warehouse", id],
    queryFn: () => warehouseApi.getById(id),
    enabled: !!id,
  })
}

export function useWarehouseForEdit(id: string) {
  return useQuery({
    queryKey: ["warehouse", "edit", id],
    queryFn: () => warehouseApi.getForEdit(id),
    enabled: !!id,
  })
}

export function useWarehouseSelect() {
  return useQuery({
    queryKey: ["warehouses", "select"],
    queryFn: () => warehouseApi.getSelect(),
  })
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: WarehouseCreateRequest) => warehouseApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] })
    },
  })
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: WarehouseUpdateRequest }) =>
      warehouseApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] })
      queryClient.invalidateQueries({ queryKey: ["warehouse"] })
    },
  })
}

export function useDeleteWarehouse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => warehouseApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] })
    },
  })
}
