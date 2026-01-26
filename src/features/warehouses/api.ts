import api from "@/lib/axios"
import type { Warehouse, PaginatedResponse } from "@/types/api"

export interface WarehouseListParams {
  pageNumber?: number
  pageSize?: number
  searchTerm?: string
  sortBy?: string
  sortDir?: "asc" | "desc"
  isActive?: boolean
}

export interface WarehouseCreateRequest {
  name: string
  address: string
  contactInfo: string
  isActive: boolean
}

export interface WarehouseUpdateRequest {
  name: string
  address: string
  contactInfo: string
  isActive: boolean
}

// API response types (matching backend PascalCase)
interface ApiWarehouseListResponse {
  totalCount: number
  currentPage: number
  pageSize: number
  pageCount: number
  data: ApiWarehouse[]
}

interface ApiWarehouse {
  id: string
  name: string
  address: string
  contactInfo: string
  isActive: boolean
  createdDate: string
}

// Transform API response to frontend format
function transformWarehouse(apiWarehouse: ApiWarehouse): Warehouse {
  return {
    id: apiWarehouse.id,
    name: apiWarehouse.name,
    address: apiWarehouse.address,
    contactInfo: apiWarehouse.contactInfo,
    isActive: apiWarehouse.isActive,
  }
}

export const warehouseApi = {
  getAll: async (params: WarehouseListParams = {}) => {
    const response = await api.get<ApiWarehouseListResponse>("/warehouse", {
      params: {
        "Pagination.Page": params.pageNumber || 1,
        "Pagination.PageSize": params.pageSize || 10,
        "Searching.Search": params.searchTerm || undefined,
        "Sorting.SortBy": params.sortBy || undefined,
        "Sorting.SortDir": params.sortDir || undefined,
        "Filters.IsActive": params.isActive,
      },
    })

    const apiData = response.data
    return {
      items: apiData.data.map(transformWarehouse),
      totalCount: apiData.totalCount,
      pageNumber: apiData.currentPage,
      pageSize: apiData.pageSize,
      totalPages: apiData.pageCount,
      hasPreviousPage: apiData.currentPage > 1,
      hasNextPage: apiData.currentPage < apiData.pageCount,
    } as PaginatedResponse<Warehouse>
  },

  getById: async (id: string) => {
    const response = await api.get<ApiWarehouse>(`/warehouse/detail/${id}`)
    return transformWarehouse(response.data)
  },

  getForEdit: async (id: string) => {
    const response = await api.get<Omit<ApiWarehouse, "id" | "createdDate">>(`/warehouse/get-for-edit/${id}`)
    return {
      id,
      name: response.data.name,
      address: response.data.address,
      contactInfo: response.data.contactInfo,
      isActive: response.data.isActive,
    } as Warehouse
  },

  getSelect: async () => {
    const response = await api.get<{ value: string; text: string }[]>("/warehouse/select")
    return response.data.map(item => ({ id: item.value, name: item.text }))
  },

  create: async (data: WarehouseCreateRequest) => {
    const requestBody = {
      Name: data.name,
      Address: data.address,
      ContactInfo: data.contactInfo,
      IsActive: data.isActive,
    }
    const response = await api.post<Warehouse>("/warehouse", requestBody)
    return response.data
  },

  update: async (id: string, data: WarehouseUpdateRequest) => {
    const requestBody = {
      Name: data.name,
      Address: data.address,
      ContactInfo: data.contactInfo,
      IsActive: data.isActive,
    }
    const response = await api.put<Warehouse>(`/warehouse/${id}`, requestBody)
    return response.data
  },

  delete: async (id: string) => {
    await api.delete(`/warehouse/${id}`)
  },
}
