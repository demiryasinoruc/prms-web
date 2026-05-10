import { useQuery } from "@tanstack/react-query"
import { usageApi } from "./api"

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
