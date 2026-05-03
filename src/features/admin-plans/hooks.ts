import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  subscriptionPlanApi,
  type SubscriptionPlanListParams,
  type SubscriptionPlanCreateRequest,
  type SubscriptionPlanUpdateRequest,
} from "./api"

export const subscriptionPlanKeys = {
  all: ["subscription-plans"] as const,
  lists: () => [...subscriptionPlanKeys.all, "list"] as const,
  list: (params: SubscriptionPlanListParams) => [...subscriptionPlanKeys.lists(), params] as const,
  forEdit: (id: number) => [...subscriptionPlanKeys.all, "forEdit", id] as const,
  select: () => [...subscriptionPlanKeys.all, "select"] as const,
}

export function useSubscriptionPlans(params: SubscriptionPlanListParams = {}) {
  return useQuery({
    queryKey: subscriptionPlanKeys.list(params),
    queryFn: () => subscriptionPlanApi.getAll(params),
    staleTime: 0,
    gcTime: 0,
  })
}

export function useSubscriptionPlanSelect() {
  return useQuery({
    queryKey: subscriptionPlanKeys.select(),
    queryFn: () => subscriptionPlanApi.getSelect(),
  })
}

export function useCreateSubscriptionPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SubscriptionPlanCreateRequest) => subscriptionPlanApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionPlanKeys.lists() })
      queryClient.invalidateQueries({ queryKey: subscriptionPlanKeys.select() })
    },
  })
}

export function useUpdateSubscriptionPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SubscriptionPlanUpdateRequest }) =>
      subscriptionPlanApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionPlanKeys.lists() })
      queryClient.invalidateQueries({ queryKey: subscriptionPlanKeys.select() })
    },
  })
}

export function useDeleteSubscriptionPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => subscriptionPlanApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionPlanKeys.lists() })
      queryClient.invalidateQueries({ queryKey: subscriptionPlanKeys.select() })
    },
  })
}
