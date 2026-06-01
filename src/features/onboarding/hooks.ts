import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { onboardingApi } from "./api"

export const onboardingKeys = {
  status: ["onboarding", "status"] as const,
  list: ["onboarding", "templates"] as const,
  detail: (key: string) => ["onboarding", "template", key] as const,
}

export function useOnboardingStatus() {
  return useQuery({
    queryKey: onboardingKeys.status,
    queryFn: onboardingApi.status,
    staleTime: 60_000,
  })
}

export function useSectorTemplates() {
  return useQuery({
    queryKey: onboardingKeys.list,
    queryFn: onboardingApi.list,
    staleTime: Infinity,
  })
}

export function useSectorTemplateDetail(key: string | null) {
  return useQuery({
    queryKey: onboardingKeys.detail(key ?? ""),
    queryFn: () => onboardingApi.detail(key as string),
    enabled: !!key,
    staleTime: Infinity,
  })
}

export function useApplyTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: onboardingApi.apply,
    onSuccess: () => {
      // Yeni içerikler oluştu — ilgili cache'leri invalidate et
      qc.invalidateQueries({ queryKey: onboardingKeys.status })
      qc.invalidateQueries({ queryKey: ["categories"] })
      qc.invalidateQueries({ queryKey: ["products"] })
      qc.invalidateQueries({ queryKey: ["extra-services"] })
      qc.invalidateQueries({ queryKey: ["category-attributes"] })
    },
  })
}

export function useSkipOnboarding() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: onboardingApi.skip,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: onboardingKeys.status })
    },
  })
}
