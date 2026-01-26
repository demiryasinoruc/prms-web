import api from "@/lib/axios"
import type { PaginatedResponse } from "@/types/api"

export interface Certificate {
  id: string
  name: string
  description: string
  isActive: boolean
  createdDate: string
}

export interface CertificateListParams {
  pageNumber?: number
  pageSize?: number
  searchTerm?: string
  sortBy?: string
  sortDir?: "asc" | "desc"
  isActive?: boolean
}

export interface CertificateCreateRequest {
  name: string
  description: string
}

export interface CertificateUpdateRequest {
  name: string
  description: string
  isActive: boolean
}

interface ApiCertificateListResponse {
  totalCount: number
  currentPage: number
  pageSize: number
  pageCount: number
  data: Certificate[]
}

export const certificateApi = {
  getAll: async (params: CertificateListParams = {}) => {
    const response = await api.get<ApiCertificateListResponse>("/certificate", {
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
      items: apiData.data,
      totalCount: apiData.totalCount,
      pageNumber: apiData.currentPage,
      pageSize: apiData.pageSize,
      totalPages: apiData.pageCount,
      hasPreviousPage: apiData.currentPage > 1,
      hasNextPage: apiData.currentPage < apiData.pageCount,
    } as PaginatedResponse<Certificate>
  },

  getSelect: async () => {
    const response = await api.get<{ value: string; text: string }[]>("/certificate/select")
    return response.data.map((item) => ({
      id: item.value,
      name: item.text,
    }))
  },

  create: async (data: CertificateCreateRequest) => {
    const response = await api.post("/certificate", {
      Name: data.name,
      Description: data.description,
    })
    return response.data
  },

  update: async (id: string, data: CertificateUpdateRequest) => {
    const response = await api.put(`/certificate/${id}`, {
      Name: data.name,
      Description: data.description,
      IsActive: data.isActive,
    })
    return response.data
  },

  delete: async (id: string) => {
    await api.delete(`/certificate/${id}`)
  },
}
