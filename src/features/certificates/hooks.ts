import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  certificateApi,
  type CertificateListParams,
  type CertificateCreateRequest,
  type CertificateUpdateRequest,
} from "./api"

export const certificateKeys = {
  all: ["certificates"] as const,
  lists: () => [...certificateKeys.all, "list"] as const,
  list: (params: CertificateListParams) => [...certificateKeys.lists(), params] as const,
  select: () => [...certificateKeys.all, "select"] as const,
}

export function useCertificates(params: CertificateListParams = {}) {
  return useQuery({
    queryKey: certificateKeys.list(params),
    queryFn: () => certificateApi.getAll(params),
    staleTime: 0,
    gcTime: 0,
  })
}

export function useCertificateSelect() {
  return useQuery({
    queryKey: certificateKeys.select(),
    queryFn: () => certificateApi.getSelect(),
  })
}

export function useCreateCertificate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CertificateCreateRequest) => certificateApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: certificateKeys.lists() })
      queryClient.invalidateQueries({ queryKey: certificateKeys.select() })
    },
  })
}

export function useUpdateCertificate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CertificateUpdateRequest }) =>
      certificateApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: certificateKeys.lists() })
      queryClient.invalidateQueries({ queryKey: certificateKeys.select() })
    },
  })
}

export function useDeleteCertificate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => certificateApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: certificateKeys.lists() })
      queryClient.invalidateQueries({ queryKey: certificateKeys.select() })
    },
  })
}
