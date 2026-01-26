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

export enum MaintenanceStatus {
  Scheduled = 1,
  InProgress = 2,
  Completed = 3,
  Cancelled = 4,
}

export const MaintenanceTypeLabels: Record<MaintenanceType, string> = {
  [MaintenanceType.Preventive]: "Periyodik Bakım",
  [MaintenanceType.Corrective]: "Arıza Giderme",
  [MaintenanceType.Inspection]: "Muayene/Kontrol",
  [MaintenanceType.Calibration]: "Kalibrasyon",
  [MaintenanceType.General]: "Genel Bakım",
}

export const MaintenanceStatusLabels: Record<MaintenanceStatus, string> = {
  [MaintenanceStatus.Scheduled]: "Planlandı",
  [MaintenanceStatus.InProgress]: "Devam Ediyor",
  [MaintenanceStatus.Completed]: "Tamamlandı",
  [MaintenanceStatus.Cancelled]: "İptal Edildi",
}

// Types
export interface MaintenanceRecord {
  id: string
  inventoryId: string
  inventorySerialNumber: string
  productName: string
  maintenanceScheduleId: string | null
  maintenanceScheduleName: string
  maintenanceType: MaintenanceType
  maintenanceTypeName: string
  status: MaintenanceStatus
  statusName: string
  title: string
  scheduledDate: string | null
  startDate: string | null
  completedDate: string | null
  totalCost: number | null
  performedBy: string
}

export interface MaintenanceRecordForEdit {
  id: string
  inventoryId: string
  maintenanceScheduleId: string | null
  maintenanceType: MaintenanceType
  status: MaintenanceStatus
  title: string
  description: string
  scheduledDate: string | null
  startDate: string | null
  completedDate: string | null
  lifespanAtMaintenance: number | null
  performedByEmployeeId: string | null
  performedByExternal: string
  totalCost: number | null
  laborCost: number | null
  partsCost: number | null
  nextScheduledDate: string | null
  nextScheduledLifespan: number | null
  notes: string
}

export interface MaintenanceRecordListParams {
  pageNumber?: number
  pageSize?: number
  searchTerm?: string
  sortBy?: string
  sortDir?: "asc" | "desc"
  inventoryId?: string
  maintenanceScheduleId?: string
  status?: MaintenanceStatus
  maintenanceType?: MaintenanceType
}

export interface MaintenanceRecordCreateRequest {
  inventoryId: string
  maintenanceScheduleId: string | null
  maintenanceType: MaintenanceType
  title: string
  description: string
  scheduledDate: string | null
  startDate: string | null
  completedDate: string | null
  lifespanAtMaintenance: number | null
  performedByEmployeeId: string | null
  performedByExternal: string | null
  totalCost: number | null
  laborCost: number | null
  partsCost: number | null
  nextScheduledDate: string | null
  nextScheduledLifespan: number | null
  notes: string | null
}

export interface MaintenanceRecordUpdateRequest {
  inventoryId: string
  maintenanceScheduleId: string | null
  maintenanceType: MaintenanceType
  status: MaintenanceStatus
  title: string
  description: string
  scheduledDate: string | null
  startDate: string | null
  completedDate: string | null
  lifespanAtMaintenance: number | null
  performedByEmployeeId: string | null
  performedByExternal: string | null
  totalCost: number | null
  laborCost: number | null
  partsCost: number | null
  nextScheduledDate: string | null
  nextScheduledLifespan: number | null
  notes: string | null
}

interface ApiListResponse {
  totalCount: number
  currentPage: number
  pageSize: number
  pageCount: number
  data: MaintenanceRecord[]
}

export const maintenanceRecordApi = {
  getAll: async (params: MaintenanceRecordListParams = {}) => {
    const response = await api.get<ApiListResponse>("/maintenancerecord", {
      params: {
        "Pagination.Page": params.pageNumber || 1,
        "Pagination.PageSize": params.pageSize || 10,
        "Searching.Search": params.searchTerm || undefined,
        "Sorting.SortBy": params.sortBy || undefined,
        "Sorting.SortDir": params.sortDir || undefined,
        "Filters.InventoryId": params.inventoryId || undefined,
        "Filters.MaintenanceScheduleId": params.maintenanceScheduleId || undefined,
        "Filters.Status": params.status,
        "Filters.MaintenanceType": params.maintenanceType,
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
    } as PaginatedResponse<MaintenanceRecord>
  },

  getForEdit: async (id: string) => {
    const response = await api.get<MaintenanceRecordForEdit>(
      `/maintenancerecord/get-for-edit/${id}`
    )
    return response.data
  },

  create: async (data: MaintenanceRecordCreateRequest) => {
    const response = await api.post("/maintenancerecord", {
      InventoryId: data.inventoryId,
      MaintenanceScheduleId: data.maintenanceScheduleId,
      MaintenanceType: data.maintenanceType,
      Title: data.title,
      Description: data.description,
      ScheduledDate: data.scheduledDate,
      StartDate: data.startDate,
      CompletedDate: data.completedDate,
      LifespanAtMaintenance: data.lifespanAtMaintenance,
      PerformedByEmployeeId: data.performedByEmployeeId,
      PerformedByExternal: data.performedByExternal,
      TotalCost: data.totalCost,
      LaborCost: data.laborCost,
      PartsCost: data.partsCost,
      NextScheduledDate: data.nextScheduledDate,
      NextScheduledLifespan: data.nextScheduledLifespan,
      Notes: data.notes,
    })
    return response.data
  },

  update: async (id: string, data: MaintenanceRecordUpdateRequest) => {
    const response = await api.put(`/maintenancerecord/${id}`, {
      InventoryId: data.inventoryId,
      MaintenanceScheduleId: data.maintenanceScheduleId,
      MaintenanceType: data.maintenanceType,
      Status: data.status,
      Title: data.title,
      Description: data.description,
      ScheduledDate: data.scheduledDate,
      StartDate: data.startDate,
      CompletedDate: data.completedDate,
      LifespanAtMaintenance: data.lifespanAtMaintenance,
      PerformedByEmployeeId: data.performedByEmployeeId,
      PerformedByExternal: data.performedByExternal,
      TotalCost: data.totalCost,
      LaborCost: data.laborCost,
      PartsCost: data.partsCost,
      NextScheduledDate: data.nextScheduledDate,
      NextScheduledLifespan: data.nextScheduledLifespan,
      Notes: data.notes,
    })
    return response.data
  },

  delete: async (id: string) => {
    await api.delete(`/maintenancerecord/${id}`)
  },
}
