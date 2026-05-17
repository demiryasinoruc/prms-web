import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { subscriptionApi, type BillingCycle } from "./api"

export const subscriptionKeys = {
  all: ["subscription"] as const,
  me: () => [...subscriptionKeys.all, "me"] as const,
  plans: () => [...subscriptionKeys.all, "plans"] as const,
  paymentMethods: () => [...subscriptionKeys.all, "payment-methods"] as const,
  invoices: () => [...subscriptionKeys.all, "invoices"] as const,
}

export function useMySubscription() {
  return useQuery({
    queryKey: subscriptionKeys.me(),
    queryFn: subscriptionApi.getMe,
    staleTime: 60 * 1000,
  })
}

export function usePlanOptions() {
  return useQuery({
    queryKey: subscriptionKeys.plans(),
    queryFn: subscriptionApi.getPlans,
    staleTime: 5 * 60 * 1000,
  })
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: subscriptionKeys.paymentMethods(),
    queryFn: subscriptionApi.getPaymentMethods,
    staleTime: 30 * 1000,
  })
}

export function useInvoices() {
  return useQuery({
    queryKey: subscriptionKeys.invoices(),
    queryFn: subscriptionApi.getInvoices,
    staleTime: 60 * 1000,
  })
}

export function useSetDefaultPaymentMethod() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => subscriptionApi.setDefaultPaymentMethod(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: subscriptionKeys.paymentMethods() }),
  })
}

export function useDeletePaymentMethod() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => subscriptionApi.deletePaymentMethod(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: subscriptionKeys.paymentMethods() }),
  })
}

export function useCancelSubscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => subscriptionApi.cancelSubscription(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: subscriptionKeys.me() }),
  })
}

export function useUpgradePlan() {
  return useMutation({
    mutationFn: ({ planId, cycle }: { planId: number; cycle: BillingCycle }) =>
      subscriptionApi.upgradePlan(planId, cycle),
  })
}
