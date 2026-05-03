import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  adminCompanyApi,
  type AdminCompanyListParams,
  type ExtendSubscriptionRequest,
  type ChangePlanRequest,
  type CreateSubscriptionRequest,
} from "./api"

export const adminCompanyKeys = {
  all: ["admin-companies"] as const,
  lists: () => [...adminCompanyKeys.all, "list"] as const,
  list: (params: AdminCompanyListParams) => [...adminCompanyKeys.lists(), params] as const,
  history: (companyId: string) => [...adminCompanyKeys.all, "history", companyId] as const,
}

export function useAdminCompanies(params: AdminCompanyListParams = {}) {
  return useQuery({
    queryKey: adminCompanyKeys.list(params),
    queryFn: () => adminCompanyApi.getAll(params),
    staleTime: 0,
    gcTime: 0,
  })
}

export function useSubscriptionHistory(companyId: string | null) {
  return useQuery({
    queryKey: adminCompanyKeys.history(companyId || ""),
    queryFn: () => adminCompanyApi.getSubscriptionHistory(companyId!),
    enabled: !!companyId,
  })
}

export function useExtendSubscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ companyId, data }: { companyId: string; data: ExtendSubscriptionRequest }) =>
      adminCompanyApi.extendSubscription(companyId, data),
    onSuccess: (_, { companyId }) => {
      queryClient.invalidateQueries({ queryKey: adminCompanyKeys.lists() })
      queryClient.invalidateQueries({ queryKey: adminCompanyKeys.history(companyId) })
    },
  })
}

export function useChangePlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ companyId, data }: { companyId: string; data: ChangePlanRequest }) =>
      adminCompanyApi.changePlan(companyId, data),
    onSuccess: (_, { companyId }) => {
      queryClient.invalidateQueries({ queryKey: adminCompanyKeys.lists() })
      queryClient.invalidateQueries({ queryKey: adminCompanyKeys.history(companyId) })
    },
  })
}

export function useCreateSubscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ companyId, data }: { companyId: string; data: CreateSubscriptionRequest }) =>
      adminCompanyApi.createSubscription(companyId, data),
    onSuccess: (_, { companyId }) => {
      queryClient.invalidateQueries({ queryKey: adminCompanyKeys.lists() })
      queryClient.invalidateQueries({ queryKey: adminCompanyKeys.history(companyId) })
    },
  })
}
