import api from "@/lib/axios"
import type { PaginatedResponse } from "@/types/api"

export interface SubscriptionPlan {
  id: number
  name: string
  description: string
  price: number
  yearlyPrice: number
  maxUserCount: number
  maxProjectCount: number
  maxProductCount: number
  cycleType: number
  cycleValue: number
  isDemo: boolean
  activeSubscriptionCount: number
  createdDate: string
}

export interface SubscriptionPlanForEdit {
  id: number
  name: string
  description: string
  price: number
  yearlyPrice: number
  maxUserCount: number
  maxProjectCount: number
  maxProductCount: number
  cycleType: number
  cycleValue: number
  isDemo: boolean
}

export interface SubscriptionPlanListParams {
  pageNumber?: number
  pageSize?: number
  searchTerm?: string
  sortBy?: string
  sortDir?: "asc" | "desc"
  isDemo?: boolean
}

export interface SubscriptionPlanCreateRequest {
  name: string
  description: string
  price: number
  yearlyPrice: number
  maxUserCount: number
  maxProjectCount: number
  maxProductCount: number
  cycleType: number
  cycleValue: number
  isDemo: boolean
}

export type SubscriptionPlanUpdateRequest = SubscriptionPlanCreateRequest

interface ApiPlanListResponse {
  totalCount: number
  currentPage: number
  pageSize: number
  pageCount: number
  data: SubscriptionPlan[]
}

export const subscriptionPlanApi = {
  getAll: async (params: SubscriptionPlanListParams = {}) => {
    const response = await api.get<ApiPlanListResponse>("/subscription-plan", {
      params: {
        "Pagination.Page": params.pageNumber || 1,
        "Pagination.PageSize": params.pageSize || 10,
        "Searching.Search": params.searchTerm || undefined,
        "Sorting.SortBy": params.sortBy || undefined,
        "Sorting.SortDir": params.sortDir || undefined,
        "Filters.IsDemo": params.isDemo,
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
    } as PaginatedResponse<SubscriptionPlan>
  },

  getForEdit: async (id: number) => {
    const response = await api.get<SubscriptionPlanForEdit>(`/subscription-plan/${id}/get-for-edit`)
    return response.data
  },

  getSelect: async () => {
    const response = await api.get<{ value: number; text: string }[]>("/subscription-plan/select")
    return response.data
  },

  create: async (data: SubscriptionPlanCreateRequest) => {
    const response = await api.post("/subscription-plan", {
      Name: data.name,
      Description: data.description,
      Price: data.price,
      YearlyPrice: data.yearlyPrice,
      MaxUserCount: data.maxUserCount,
      MaxProjectCount: data.maxProjectCount,
      MaxProductCount: data.maxProductCount,
      CycleType: data.cycleType,
      CycleValue: data.cycleValue,
      IsDemo: data.isDemo,
    })
    return response.data
  },

  update: async (id: number, data: SubscriptionPlanUpdateRequest) => {
    const response = await api.put(`/subscription-plan/${id}`, {
      Name: data.name,
      Description: data.description,
      Price: data.price,
      YearlyPrice: data.yearlyPrice,
      MaxUserCount: data.maxUserCount,
      MaxProjectCount: data.maxProjectCount,
      MaxProductCount: data.maxProductCount,
      CycleType: data.cycleType,
      CycleValue: data.cycleValue,
      IsDemo: data.isDemo,
    })
    return response.data
  },

  delete: async (id: number) => {
    await api.delete(`/subscription-plan/${id}`)
  },
}
