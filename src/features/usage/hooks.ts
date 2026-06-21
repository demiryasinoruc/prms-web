import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { usageApi, isUnlimited, type LimitType } from "./api"

export const usageKeys = {
  all: ["usage"] as const,
  current: () => [...usageKeys.all, "current"] as const,
}

export function useUsage() {
  return useQuery({
    queryKey: usageKeys.current(),
    queryFn: usageApi.get,
    staleTime: 60 * 1000,
    retry: false,
  })
}

export interface SubscriptionUsageEntry {
  limitType: LimitType
  current: number
  max: number
  isUnlimited: boolean
}

/**
 * Abonelik kullanım verisini limit tipine göre erişilebilir bir map'e dönüştürür.
 * `useUsage` query'sini yeniden kullanır (duplike sorgu yok).
 *
 * - `byType(limitType)`: ilgili tipin durumunu döndürür (veri yoksa undefined)
 * - `isLoading`/`isError`: veri henüz gelmemişken uyarı göstermemek için
 */
export function useSubscriptionUsage() {
  const { data, isLoading, isError } = useUsage()

  const byTypeMap = useMemo(() => {
    const map = new Map<LimitType, SubscriptionUsageEntry>()
    for (const item of data?.items ?? []) {
      map.set(item.limitType, {
        limitType: item.limitType,
        current: item.current,
        max: item.max,
        isUnlimited: isUnlimited(item.max),
      })
    }
    return map
  }, [data])

  const byType = (limitType: LimitType): SubscriptionUsageEntry | undefined =>
    byTypeMap.get(limitType)

  return { data, isLoading, isError, byType }
}
