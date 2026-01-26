import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  extraServiceApi,
  lookupApi,
  type ExtraServiceCreateRequest,
  type ExtraServiceUpdateRequest,
  type ExtraServiceParams,
} from "./api"

export function useExtraServices(params?: ExtraServiceParams) {
  return useQuery({
    queryKey: ["extra-services", params],
    queryFn: () => extraServiceApi.getAll(params),
    staleTime: 0,
    gcTime: 0,
  })
}

export function useExtraService(id: string | null) {
  return useQuery({
    queryKey: ["extra-service", id],
    queryFn: () => extraServiceApi.getById(id!),
    enabled: !!id,
  })
}

export function useExtraServiceSelect() {
  return useQuery({
    queryKey: ["extra-services", "select"],
    queryFn: () => extraServiceApi.getSelect(),
  })
}

export function useExtraServiceSelectForRental() {
  return useQuery({
    queryKey: ["extra-services", "select-for-rental"],
    queryFn: () => extraServiceApi.getSelectForRental(),
  })
}

export function useCreateExtraService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ExtraServiceCreateRequest) => extraServiceApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["extra-services"] })
    },
  })
}

export function useUpdateExtraService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ExtraServiceUpdateRequest }) =>
      extraServiceApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["extra-services"] })
      queryClient.invalidateQueries({ queryKey: ["extra-service"] })
    },
  })
}

export function useDeleteExtraService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => extraServiceApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["extra-services"] })
    },
  })
}

// Lookup hooks
export function usePricePeriods() {
  return useQuery({
    queryKey: ["price-periods", "select"],
    queryFn: () => lookupApi.getPricePeriods(),
    staleTime: Infinity,
  })
}

export function useCurrencies() {
  return useQuery({
    queryKey: ["currencies", "select"],
    queryFn: () => lookupApi.getCurrencies(),
    staleTime: Infinity,
  })
}

export function useCertificates() {
  return useQuery({
    queryKey: ["certificates", "select"],
    queryFn: () => lookupApi.getCertificates(),
  })
}
