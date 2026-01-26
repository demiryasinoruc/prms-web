import { useQuery } from "@tanstack/react-query"
import { settingsApi } from "./api"

export const settingsKeys = {
  all: ["settings"] as const,
  company: () => [...settingsKeys.all, "company"] as const,
}

export function useCompanySettings() {
  return useQuery({
    queryKey: settingsKeys.company(),
    queryFn: () => settingsApi.getCompanySettings(),
    staleTime: 5 * 60 * 1000, // 5 dakika cache
  })
}
