import api from "@/lib/axios"
import type { PaginatedResponse } from "@/types/api"

export interface Invitation {
  id: string
  email: string
  roleName: string
  createdDate: string
  expiredDate: string
}

export interface InvitationListParams {
  pageNumber?: number
  pageSize?: number
  searchTerm?: string
  sortBy?: string
  sortDir?: "asc" | "desc"
}

export interface InvitationCreateRequest {
  email: string
  roleId: string
}

interface ApiInvitationListResponse {
  totalCount: number
  currentPage: number
  pageSize: number
  pageCount: number
  data: Invitation[]
}

export const invitationApi = {
  getAll: async (params: InvitationListParams = {}) => {
    const response = await api.get<ApiInvitationListResponse>("/invitation", {
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
    } as PaginatedResponse<Invitation>
  },

  create: async (data: InvitationCreateRequest) => {
    const response = await api.post<string>("/invitation", {
      Email: data.email,
      RoleId: data.roleId,
    })
    return response.data
  },

  revoke: async (id: string) => {
    await api.put(`/invitation/revoke/${id}`)
  },
}
