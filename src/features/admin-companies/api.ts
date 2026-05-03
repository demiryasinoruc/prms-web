import api from "@/lib/axios"
import type { PaginatedResponse } from "@/types/api"

export interface AdminActiveSubscription {
  id: string
  planId: number
  planName: string
  isDemo: boolean
  startDate: string
  endDate: string
  daysRemaining: number
}

export interface AdminCompanyListItem {
  id: string
  name: string
  email: string
  phone: string
  createdDate: string
  isDeleted: boolean
  activeSubscription: AdminActiveSubscription | null
}

export interface AdminSubscriptionHistoryItem {
  id: string
  planId: number
  planName: string
  isDemo: boolean
  startDate: string
  endDate: string
  isActive: boolean
}

export interface AdminCompanyListParams {
  pageNumber?: number
  pageSize?: number
  searchTerm?: string
  sortBy?: string
  sortDir?: "asc" | "desc"
  planId?: number
  hasActiveSubscription?: boolean
}

export interface ExtendSubscriptionRequest {
  newEndDate: string
}

export interface ChangePlanRequest {
  newPlanId: number
  newStartDate: string
  newEndDate: string
}

export interface CreateSubscriptionRequest {
  planId: number
  startDate: string
  endDate: string
}

interface ApiCompanyListResponse {
  totalCount: number
  currentPage: number
  pageSize: number
  pageCount: number
  data: AdminCompanyListItem[]
}

export const adminCompanyApi = {
  getAll: async (params: AdminCompanyListParams = {}) => {
    const response = await api.get<ApiCompanyListResponse>("/admin/company", {
      params: {
        "Pagination.Page": params.pageNumber || 1,
        "Pagination.PageSize": params.pageSize || 10,
        "Searching.Search": params.searchTerm || undefined,
        "Sorting.SortBy": params.sortBy || undefined,
        "Sorting.SortDir": params.sortDir || undefined,
        "Filters.PlanId": params.planId,
        "Filters.HasActiveSubscription": params.hasActiveSubscription,
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
    } as PaginatedResponse<AdminCompanyListItem>
  },

  getSubscriptionHistory: async (companyId: string) => {
    const response = await api.get<AdminSubscriptionHistoryItem[]>(`/admin/company/${companyId}/subscription-history`)
    return response.data
  },

  extendSubscription: async (companyId: string, data: ExtendSubscriptionRequest) => {
    await api.post(`/admin/company/${companyId}/subscription/extend`, {
      NewEndDate: data.newEndDate,
    })
  },

  changePlan: async (companyId: string, data: ChangePlanRequest) => {
    const response = await api.post(`/admin/company/${companyId}/subscription/change-plan`, {
      NewPlanId: data.newPlanId,
      NewStartDate: data.newStartDate,
      NewEndDate: data.newEndDate,
    })
    return response.data
  },

  createSubscription: async (companyId: string, data: CreateSubscriptionRequest) => {
    const response = await api.post(`/admin/company/${companyId}/subscription`, {
      PlanId: data.planId,
      StartDate: data.startDate,
      EndDate: data.endDate,
    })
    return response.data
  },
}
