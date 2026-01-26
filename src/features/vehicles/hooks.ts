import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { vehicleApi, type VehicleListParams, type VehicleCreateRequest, type VehicleUpdateRequest } from "./api"

export function useVehicles(params: VehicleListParams = {}) {
  return useQuery({
    queryKey: ["vehicles", params],
    queryFn: () => vehicleApi.getAll(params),
    staleTime: 0,
    gcTime: 0,
  })
}

export function useVehicle(id: string) {
  return useQuery({
    queryKey: ["vehicle", id],
    queryFn: () => vehicleApi.getById(id),
    enabled: !!id,
  })
}

export function useVehicleForEdit(id: string) {
  return useQuery({
    queryKey: ["vehicle", "edit", id],
    queryFn: () => vehicleApi.getForEdit(id),
    enabled: !!id,
  })
}

export function useVehicleSelect() {
  return useQuery({
    queryKey: ["vehicles", "select"],
    queryFn: () => vehicleApi.getSelect(),
  })
}

export function useCreateVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: VehicleCreateRequest) => vehicleApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] })
    },
  })
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: VehicleUpdateRequest }) =>
      vehicleApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] })
      queryClient.invalidateQueries({ queryKey: ["vehicle"] })
    },
  })
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => vehicleApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] })
    },
  })
}
