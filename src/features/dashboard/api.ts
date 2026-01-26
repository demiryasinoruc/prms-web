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

export interface UpcomingMaintenance {
  id: string
  title: string
  inventorySerialNumber: string
  productName: string
  scheduledDate: string | null
  status: number
}

export interface RecentMaintenance {
  id: string
  title: string
  inventorySerialNumber: string
  productName: string
  completedDate: string | null
  maintenanceType: number
}

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>("/dashboard/stats")
    return response.data
  },
}
