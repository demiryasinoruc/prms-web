import api from "@/lib/axios"
import type { PaginatedResponse } from "@/types/api"

// İzin türü enum + Türkçe etiketler
export enum LeaveType {
  Annual = 1,
  Sick = 2,
  Unpaid = 3,
  Other = 4,
}

export const LeaveTypeLabels: Record<LeaveType, string> = {
  [LeaveType.Annual]: "Yıllık",
  [LeaveType.Sick]: "Hastalık",
  [LeaveType.Unpaid]: "Ücretsiz",
  [LeaveType.Other]: "Diğer",
}

// Liste item tipi (backend camelCase döner)
export interface EmployeeLeave {
  id: string
  employeeId: string
  employeeFullName: string
  leaveType: LeaveType
  startDate: string
  endDate: string
  notes: string | null
}

// Düzenleme için getirilen veri
export interface EmployeeLeaveForEdit {
  id: string
  employeeId: string
  leaveType: LeaveType
  startDate: string
  endDate: string
  notes: string | null
}

export interface EmployeeLeaveListParams {
  pageNumber?: number
  pageSize?: number
  searchTerm?: string
  sortBy?: string
  sortDir?: "asc" | "desc"
  employeeId?: string
  leaveType?: LeaveType
}

export interface EmployeeLeaveCreateRequest {
  employeeId: string
  leaveType: LeaveType
  startDate: string
  endDate: string
  notes: string | null
}

export interface EmployeeLeaveUpdateRequest extends EmployeeLeaveCreateRequest {
  id: string
}

interface ApiEmployeeLeaveListResponse {
  totalCount: number
  currentPage: number
  pageSize: number
  pageCount: number
  data: EmployeeLeave[]
}

export const employeeLeaveApi = {
  getAll: async (params: EmployeeLeaveListParams = {}) => {
    const response = await api.get<ApiEmployeeLeaveListResponse>("/employee-leave", {
      params: {
        "Pagination.Page": params.pageNumber || 1,
        "Pagination.PageSize": params.pageSize || 10,
        "Searching.Search": params.searchTerm || undefined,
        "Sorting.SortBy": params.sortBy || undefined,
        "Sorting.SortDir": params.sortDir || undefined,
        "Filters.EmployeeId": params.employeeId || undefined,
        "Filters.LeaveType": params.leaveType,
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
    } as PaginatedResponse<EmployeeLeave>
  },

  getForEdit: async (id: string) => {
    const response = await api.get<EmployeeLeaveForEdit>(`/employee-leave/get-for-edit/${id}`)
    return response.data
  },

  create: async (data: EmployeeLeaveCreateRequest) => {
    const response = await api.post("/employee-leave", {
      EmployeeId: data.employeeId,
      LeaveType: data.leaveType,
      StartDate: data.startDate,
      EndDate: data.endDate,
      Notes: data.notes,
    })
    return response.data
  },

  update: async (id: string, data: EmployeeLeaveUpdateRequest) => {
    const response = await api.put(`/employee-leave/${id}`, {
      EmployeeId: data.employeeId,
      LeaveType: data.leaveType,
      StartDate: data.startDate,
      EndDate: data.endDate,
      Notes: data.notes,
    })
    return response.data
  },

  delete: async (id: string) => {
    await api.delete(`/employee-leave/${id}`)
  },
}
