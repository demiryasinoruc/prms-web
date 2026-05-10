import { useQuery } from "@tanstack/react-query"
import { dashboardApi } from "./api"

export const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: () => [...dashboardKeys.all, "stats"] as const,
  recentRentals: () => [...dashboardKeys.all, "recent-rentals"] as const,
  upcomingReturns: () => [...dashboardKeys.all, "upcoming-returns"] as const,
}

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: () => dashboardApi.getStats(),
  })
}

export function useRecentRentals() {
  return useQuery({
    queryKey: dashboardKeys.recentRentals(),
    queryFn: () => dashboardApi.getRecentRentals(),
  })
}

export function useUpcomingReturns() {
  return useQuery({
    queryKey: dashboardKeys.upcomingReturns(),
    queryFn: () => dashboardApi.getUpcomingReturns(),
  })
}
