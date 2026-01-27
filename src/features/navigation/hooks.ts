import { useQuery } from "@tanstack/react-query"
import { navigationApi } from "./api"

export const navigationKeys = {
  all: ["navigation"] as const,
}

export function useNavigation() {
  return useQuery({
    queryKey: navigationKeys.all,
    queryFn: navigationApi.getNavigation,
    staleTime: 5 * 60 * 1000, // 5 dakika cache (navigasyon sık değişmez)
    gcTime: 10 * 60 * 1000,
  })
}
