import api from "@/lib/axios"
import type { PaginatedResponse } from "@/types/api"

// Enums
export enum MaintenanceType {
  Preventive = 1,
  Corrective = 2,
  Inspection = 3,
  Calibration = 4,
  General = 5,
}

export enum MaintenanceTriggerType {
  Usage = 1,
  Time = 2,
  Both = 3,
}

export const MaintenanceTypeLabels: Record<MaintenanceType, string> = {
  [MaintenanceType.Preventive]: "Periyodik Bakım",
  [MaintenanceType.Corrective]: "Arıza Giderme",
  [MaintenanceType.Inspection]: "Muayene/Kontrol",
  [MaintenanceType.Calibration]: "Kalibrasyon",
  [MaintenanceType.General]: "Genel Bakım",
}

export const MaintenanceTriggerTypeLabels: Record<MaintenanceTriggerType, string> = {
  [MaintenanceTriggerType.Usage]: "Ömür Bazlı",
  [MaintenanceTriggerType.Time]: "Zaman Bazlı",
  [MaintenanceTriggerType.Both]: "Her İkisi",
}

// Types
export interface MaintenanceSchedule {
  id: string
  categoryId: string | null
  categoryName: string
  productId: string | null
  productName: string
  name: string
  maintenanceType: MaintenanceType
  maintenanceTypeName: string
  triggerType: MaintenanceTriggerType
  triggerTypeName: string
  usageInterval: number | null
  dayInterval: number | null
  inheritToChildren: boolean
  isActive: boolean
}

export interface MaintenanceScheduleForEdit {
  id: string
  categoryId: string | null
  productId: string | null
  name: string
  description: string
  maintenanceType: MaintenanceType
  triggerType: MaintenanceTriggerType
  usageInterval: number | null
  dayInterval: number | null
  estimatedDurationHours: number | null
  estimatedCost: number | null
  alertDaysBefore: number | null
  alertUsageBefore: number | null
  inheritToChildren: boolean
  isActive: boolean
}

export interface MaintenanceScheduleListParams {
  pageNumber?: number
  pageSize?: number
  searchTerm?: string
  sortBy?: string
  sortDir?: "asc" | "desc"
  categoryId?: string
  productId?: string
  isActive?: boolean
}

export interface MaintenanceScheduleCreateRequest {
  categoryId: string | null
  productId: string | null
  name: string
  description: string
  maintenanceType: MaintenanceType
  triggerType: MaintenanceTriggerType
  usageInterval: number | null
  dayInterval: number | null
  estimatedDurationHours: number | null
  estimatedCost: number | null
  alertDaysBefore: number | null
  alertUsageBefore: number | null
  inheritToChildren: boolean
}

export interface MaintenanceScheduleUpdateRequest {
  categoryId: string | null
  productId: string | null
  name: string
  description: string
  maintenanceType: MaintenanceType
  triggerType: MaintenanceTriggerType
  usageInterval: number | null
  dayInterval: number | null
  estimatedDurationHours: number | null
  estimatedCost: number | null
  alertDaysBefore: number | null
  alertUsageBefore: number | null
  inheritToChildren: boolean
  isActive: boolean
}

interface ApiListResponse {
  totalCount: number
  currentPage: number
  pageSize: number
  pageCount: number
  data: MaintenanceSchedule[]
}

export const maintenanceScheduleApi = {
  getAll: async (params: MaintenanceScheduleListParams = {}) => {
    const response = await api.get<ApiListResponse>("/maintenanceschedule", {
      params: {
        "Pagination.Page": params.pageNumber || 1,
        "Pagination.PageSize": params.pageSize || 10,
        "Searching.Search": params.searchTerm || undefined,
        "Sorting.SortBy": params.sortBy || undefined,
        "Sorting.SortDir": params.sortDir || undefined,
        "Filters.CategoryId": params.categoryId || undefined,
        "Filters.ProductId": params.productId || undefined,
        "Filters.IsActive": params.isActive,
      },
    })

    const apiData = response.data
    return {
      items: apiData.data,
      totalCount: apiData.totalCount,
      pageNumber: apiData.currentPage,
      pageSize: apiData.pageSize,
      totalPages: apiData.pageCount,
      hasPreviousPage: apiData.currentPage > 1,
      hasNextPage: apiData.currentPage < apiData.pageCount,
    } as PaginatedResponse<MaintenanceSchedule>
  },

  getForEdit: async (id: string) => {
    const response = await api.get<MaintenanceScheduleForEdit>(
      `/maintenanceschedule/get-for-edit/${id}`
    )
    return response.data
  },

  create: async (data: MaintenanceScheduleCreateRequest) => {
    const response = await api.post("/maintenanceschedule", {
      CategoryId: data.categoryId,
      ProductId: data.productId,
      Name: data.name,
      Description: data.description,
      MaintenanceType: data.maintenanceType,
      TriggerType: data.triggerType,
      UsageInterval: data.usageInterval,
      DayInterval: data.dayInterval,
      EstimatedDurationHours: data.estimatedDurationHours,
      EstimatedCost: data.estimatedCost,
      AlertDaysBefore: data.alertDaysBefore,
      AlertUsageBefore: data.alertUsageBefore,
      InheritToChildren: data.inheritToChildren,
    })
    return response.data
  },

  update: async (id: string, data: MaintenanceScheduleUpdateRequest) => {
    const response = await api.put(`/maintenanceschedule/${id}`, {
      CategoryId: data.categoryId,
      ProductId: data.productId,
      Name: data.name,
      Description: data.description,
      MaintenanceType: data.maintenanceType,
      TriggerType: data.triggerType,
      UsageInterval: data.usageInterval,
      DayInterval: data.dayInterval,
      EstimatedDurationHours: data.estimatedDurationHours,
      EstimatedCost: data.estimatedCost,
      AlertDaysBefore: data.alertDaysBefore,
      AlertUsageBefore: data.alertUsageBefore,
      InheritToChildren: data.inheritToChildren,
      IsActive: data.isActive,
    })
    return response.data
  },

  delete: async (id: string) => {
    await api.delete(`/maintenanceschedule/${id}`)
  },
}
