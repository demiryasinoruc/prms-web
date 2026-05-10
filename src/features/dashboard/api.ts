import api from "@/lib/axios"

export interface DashboardStats {
  activeRentalsCount: number
  totalProductsCount: number
  activeCustomersCount: number
  availableInventoryCount: number
  totalInventoryCount: number
  // Maintenance Stats
  activeMaintenanceSchedulesCount: number
  scheduledMaintenanceCount: number
  inProgressMaintenanceCount: number
  overdueMaintenanceCount: number
}

export interface RecentRental {
  id: string
  rentalNumber: string
  customerName: string
  createdDate: string
  status: number
}

export interface UpcomingReturn {
  id: string
  rentalNumber: string
  customerName: string
  plannedEndDate: string
  status: number
}

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>("/dashboard/stats")
    return response.data
  },
  getRecentRentals: async (): Promise<RecentRental[]> => {
    const response = await api.get<RecentRental[]>("/dashboard/recent-rentals")
    return response.data
  },
  getUpcomingReturns: async (): Promise<UpcomingReturn[]> => {
    const response = await api.get<UpcomingReturn[]>("/dashboard/upcoming-returns")
    return response.data
  },
}
