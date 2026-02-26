import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { vehicleApi, type VehicleListParams, type VehicleCreateRequest, type VehicleUpdateRequest } from "./api"

export const vehicleKeys = {
  all: ["vehicles"] as const,
  lists: () => [...vehicleKeys.all, "list"] as const,
  list: (params: VehicleListParams) => [...vehicleKeys.lists(), params] as const,
  details: () => [...vehicleKeys.all, "detail"] as const,
  detail: (id: string) => [...vehicleKeys.details(), id] as const,
  select: () => [...vehicleKeys.all, "select"] as const,
}

export function useVehicles(params: VehicleListParams = {}) {
  return useQuery({
    queryKey: vehicleKeys.list(params),
    queryFn: () => vehicleApi.getAll(params),
    staleTime: 0,
    gcTime: 0,
  })
}

export function useVehicle(id: string) {
  return useQuery({
    queryKey: vehicleKeys.detail(id),
    queryFn: () => vehicleApi.getById(id),
    enabled: !!id,
  })
}

export function useVehicleForEdit(id: string) {
  return useQuery({
    queryKey: [...vehicleKeys.details(), "edit", id],
    queryFn: () => vehicleApi.getForEdit(id),
    enabled: !!id,
  })
}

export function useVehicleSelect() {
  return useQuery({
    queryKey: vehicleKeys.select(),
    queryFn: () => vehicleApi.getSelect(),
  })
}

export function useCreateVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: VehicleCreateRequest) => vehicleApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() })
    },
  })
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: VehicleUpdateRequest }) =>
      vehicleApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() })
      queryClient.invalidateQueries({ queryKey: vehicleKeys.details() })
    },
  })
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => vehicleApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() })
    },
  })
}
