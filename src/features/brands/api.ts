import api from "@/lib/axios"
import type { PaginatedResponse } from "@/types/api"

export interface Brand {
  id: string
  name: string
}

export interface BrandListParams {
  pageNumber?: number
  pageSize?: number
  searchTerm?: string
  sortBy?: string
  sortDir?: "asc" | "desc"
}

export interface BrandCreateRequest {
  name: string
}

export interface BrandUpdateRequest {
  id: string
  name: string
}

interface ApiBrandListResponse {
  totalCount: number
  currentPage: number
  pageSize: number
  pageCount: number
  data: Brand[]
}

export const brandApi = {
  getAll: async (params: BrandListParams = {}) => {
    const response = await api.get<ApiBrandListResponse>("/brand", {
      params: {
        "Pagination.Page": params.pageNumber || 1,
        "Pagination.PageSize": params.pageSize || 10,
        "Searching.Search": params.searchTerm || undefined,
        "Sorting.SortBy": params.sortBy || undefined,
        "Sorting.SortDir": params.sortDir || undefined,
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
    } as PaginatedResponse<Brand>
  },

  getById: async (id: string) => {
    const response = await api.get<Brand>(`/brand/detail/${id}`)
    return response.data
  },

  getForEdit: async (id: string) => {
    const response = await api.get<{ name: string }>(`/brand/get-for-edit/${id}`)
    return response.data
  },

  getSelect: async () => {
    const response = await api.get<{ value: string; text: string }[]>("/brand/select")
    return response.data.map((item) => ({
      id: item.value,
      name: item.text,
    }))
  },

  create: async (data: BrandCreateRequest) => {
    const response = await api.post<Brand>("/brand", {
      Name: data.name,
    })
    return response.data
  },

  update: async (id: string, data: BrandUpdateRequest) => {
    const response = await api.put<Brand>(`/brand/${id}`, {
      Name: data.name,
    })
    return response.data
  },

  delete: async (id: string) => {
    await api.delete(`/brand/${id}`)
  },
}
