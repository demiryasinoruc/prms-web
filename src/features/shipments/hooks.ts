import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  rentalShipmentApi,
  type RentalShipmentListParams,
  type RentalShipmentUpdateRequest,
} from "./api"

// Depo + araç + personel select hook'larını yeniden kullan (filtre / dialog için)
export { useWarehouseSelect } from "@/features/warehouses/hooks"
export { useVehicleSelectByWarehouse } from "@/features/vehicles/hooks"
export { useEmployeeSelectByWarehouse } from "@/features/employees/hooks"

export const rentalShipmentKeys = {
  all: ["rental-shipments"] as const,
  lists: () => [...rentalShipmentKeys.all, "list"] as const,
  list: (params: RentalShipmentListParams) =>
    [...rentalShipmentKeys.lists(), params] as const,
  details: () => [...rentalShipmentKeys.all, "detail"] as const,
  detail: (id: string) => [...rentalShipmentKeys.details(), id] as const,
  forEdit: (id: string) => [...rentalShipmentKeys.all, "forEdit", id] as const,
}

// KURAL 7: liste hook'unda staleTime/gcTime 0 (sıralama döngüsünün bozulmaması için)
export function useRentalShipments(params: RentalShipmentListParams = {}) {
  return useQuery({
    queryKey: rentalShipmentKeys.list(params),
    queryFn: () => rentalShipmentApi.getAll(params),
    staleTime: 0,
    gcTime: 0,
  })
}

export function useRentalShipmentDetail(id: string | null) {
  return useQuery({
    queryKey: rentalShipmentKeys.detail(id!),
    queryFn: () => rentalShipmentApi.getDetail(id!),
    enabled: !!id,
  })
}

export function useRentalShipmentForEdit(id: string | null) {
  return useQuery({
    queryKey: rentalShipmentKeys.forEdit(id!),
    queryFn: () => rentalShipmentApi.getForEdit(id!),
    enabled: !!id,
  })
}

export function useUpdateRentalShipment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RentalShipmentUpdateRequest }) =>
      rentalShipmentApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: rentalShipmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: rentalShipmentKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: rentalShipmentKeys.forEdit(variables.id) })
      toast.success("Sevkiyat güncellendi")
    },
  })
}

export function useDeleteRentalShipment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => rentalShipmentApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rentalShipmentKeys.lists() })
      toast.success("Sevkiyat silindi")
    },
  })
}

// Durum geçiş mutation'ları — invalidate: liste + detay + envanter (stok değişir)
function useShipmentStatusMutation(
  action: (id: string) => Promise<void>,
  successMessage: string,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => action(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: rentalShipmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: rentalShipmentKeys.detail(id) })
      // Sevkiyat stok hareketi yarattığından envanter listelerini de tazele
      queryClient.invalidateQueries({ queryKey: ["inventory"] })
      toast.success(successMessage)
    },
  })
}

export function useDispatchRentalShipment() {
  return useShipmentStatusMutation(rentalShipmentApi.dispatch, "Sevkiyat yola çıkarıldı")
}

export function useDeliverRentalShipment() {
  return useShipmentStatusMutation(rentalShipmentApi.deliver, "Sevkiyat teslim edildi")
}

export function useCancelRentalShipment() {
  return useShipmentStatusMutation(rentalShipmentApi.cancel, "Sevkiyat iptal edildi")
}
