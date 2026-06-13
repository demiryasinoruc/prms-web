import api from "@/lib/axios"
import type { PaginatedResponse } from "@/types/api"
import type { PlanFeature } from "@/lib/entitlements"

export interface SubscriptionPlan {
  id: number
  name: string
  description: string
  price: number
  yearlyPrice: number
  maxUserCount: number
  maxProductCount: number
  maxWarehouseCount: number
  maxInventoryCount: number
  maxVehicleCount: number
  maxMonthlyRentalCount: number
  maxAttachmentCount: number
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
  maxProductCount: number
  maxWarehouseCount: number
  maxInventoryCount: number
  maxVehicleCount: number
  maxMonthlyRentalCount: number
  maxAttachmentCount: number
  cycleType: number
  cycleValue: number
  isDemo: boolean
  features: PlanFeature[]
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
  maxProductCount: number
  maxWarehouseCount: number
  maxInventoryCount: number
  maxVehicleCount: number
  maxMonthlyRentalCount: number
  maxAttachmentCount: number
  cycleType: number
  cycleValue: number
  isDemo: boolean
  features: PlanFeature[]
}

export type SubscriptionPlanUpdateRequest = SubscriptionPlanCreateRequest

interface ApiPlanListResponse {
  totalCount: number
  currentPage: number
  pageSize: number
  pageCount: number
  data: SubscriptionPlan[]
}

function toBackendPayload(data: SubscriptionPlanCreateRequest) {
  return {
    Name: data.name,
    Description: data.description,
    Price: data.price,
    YearlyPrice: data.yearlyPrice,
    MaxUserCount: data.maxUserCount,
    MaxProductCount: data.maxProductCount,
    MaxWarehouseCount: data.maxWarehouseCount,
    MaxInventoryCount: data.maxInventoryCount,
    MaxVehicleCount: data.maxVehicleCount,
    MaxMonthlyRentalCount: data.maxMonthlyRentalCount,
    MaxAttachmentCount: data.maxAttachmentCount,
    CycleType: data.cycleType,
    CycleValue: data.cycleValue,
    IsDemo: data.isDemo,
    Features: (data.features ?? []).map((f) => ({ Key: f.key, Enabled: f.enabled })),
  }
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
    const response = await api.post("/subscription-plan", toBackendPayload(data))
    return response.data
  },

  update: async (id: number, data: SubscriptionPlanUpdateRequest) => {
    const response = await api.put(`/subscription-plan/${id}`, toBackendPayload(data))
    return response.data
  },

  delete: async (id: number) => {
    await api.delete(`/subscription-plan/${id}`)
  },
}
