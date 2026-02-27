import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  extraServiceApi,
  lookupApi,
  type ExtraServiceCreateRequest,
  type ExtraServiceUpdateRequest,
  type ExtraServiceParams,
} from "./api"
import { lookupKeys } from "@/lib/lookup-keys"
import { certificateKeys } from "@/features/certificates/hooks"

export const extraServiceKeys = {
  all: ["extra-services"] as const,
  lists: () => [...extraServiceKeys.all, "list"] as const,
  list: (params?: ExtraServiceParams) => [...extraServiceKeys.lists(), params] as const,
  details: () => [...extraServiceKeys.all, "detail"] as const,
  detail: (id: string) => [...extraServiceKeys.details(), id] as const,
  select: () => [...extraServiceKeys.all, "select"] as const,
  selectForRental: () => [...extraServiceKeys.all, "select-for-rental"] as const,
}

export function useExtraServices(params?: ExtraServiceParams) {
  return useQuery({
    queryKey: extraServiceKeys.list(params),
    queryFn: () => extraServiceApi.getAll(params),
    staleTime: 0,
    gcTime: 0,
  })
}

export function useExtraService(id: string | null) {
  return useQuery({
    queryKey: extraServiceKeys.detail(id!),
    queryFn: () => extraServiceApi.getById(id!),
    enabled: !!id,
  })
}

export function useExtraServiceSelect() {
  return useQuery({
    queryKey: extraServiceKeys.select(),
    queryFn: () => extraServiceApi.getSelect(),
  })
}

export function useExtraServiceSelectForRental() {
  return useQuery({
    queryKey: extraServiceKeys.selectForRental(),
    queryFn: () => extraServiceApi.getSelectForRental(),
  })
}

export function useCreateExtraService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ExtraServiceCreateRequest) => extraServiceApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: extraServiceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: extraServiceKeys.select() })
      queryClient.invalidateQueries({ queryKey: extraServiceKeys.selectForRental() })
    },
  })
}

export function useUpdateExtraService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ExtraServiceUpdateRequest }) =>
      extraServiceApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: extraServiceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: extraServiceKeys.details() })
      queryClient.invalidateQueries({ queryKey: extraServiceKeys.select() })
      queryClient.invalidateQueries({ queryKey: extraServiceKeys.selectForRental() })
    },
  })
}

export function useDeleteExtraService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => extraServiceApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: extraServiceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: extraServiceKeys.select() })
      queryClient.invalidateQueries({ queryKey: extraServiceKeys.selectForRental() })
    },
  })
}

// Lookup hooks
export function usePricePeriods() {
  return useQuery({
    queryKey: lookupKeys.pricePeriods(),
    queryFn: () => lookupApi.getPricePeriods(),
    staleTime: Infinity,
  })
}

export function useCurrencies() {
  return useQuery({
    queryKey: lookupKeys.currencies(),
    queryFn: () => lookupApi.getCurrencies(),
    staleTime: Infinity,
  })
}

export function useCertificates() {
  return useQuery({
    queryKey: certificateKeys.select(),
    queryFn: () => lookupApi.getCertificates(),
  })
}
