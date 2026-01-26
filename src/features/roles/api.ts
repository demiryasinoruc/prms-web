import api from "@/lib/axios"
import type { PaginatedResponse } from "@/types/api"

export interface Role {
  id: string
  name: string
  createdDate: string
  permissionCount: number
  userCount: number
  isMain: boolean
}

export interface RolePermission {
  id: number
  name: string
  description: string
  isGranted: boolean
  relatedPermissions: number[]
}

export interface RoleModule {
  id: number
  name: string
  description: string
  permissions: RolePermission[]
}

export interface RoleForEdit {
  name: string
  modules: RoleModule[]
}

export interface RoleListParams {
  pageNumber?: number
  pageSize?: number
  searchTerm?: string
  sortBy?: string
  sortDir?: "asc" | "desc"
}

export interface RoleCreateRequest {
  role: {
    name: string
  }
  permissions: Array<{
    id: number
    isGranted: boolean
  }>
}

export interface RoleUpdateRequest {
  role: {
    name: string
  }
  permissions: Array<{
    id: number
    isGranted: boolean
  }>
}

interface ApiRoleListResponse {
  totalCount: number
  currentPage: number
  pageSize: number
  pageCount: number
  data: Role[]
}

export const roleApi = {
  getAll: async (params: RoleListParams = {}) => {
    const response = await api.get<ApiRoleListResponse>("/role", {
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
    } as PaginatedResponse<Role>
  },

  getForEdit: async (id: string) => {
    const response = await api.get<RoleForEdit>(`/role/get-for-edit/${id}`)
    return response.data
  },

  getForCreate: async () => {
    const response = await api.get<RoleModule[]>("/role/get-for-create")
    return response.data
  },

  getSelect: async () => {
    const response = await api.get<{ value: string; text: string }[]>("/role/select")
    return response.data.map((item) => ({
      id: item.value,
      name: item.text,
    }))
  },

  create: async (data: RoleCreateRequest) => {
    const response = await api.post<string>("/role", {
      Role: data.role,
      Permissions: data.permissions,
    })
    return response.data
  },

  update: async (id: string, data: RoleUpdateRequest) => {
    await api.put(`/role/${id}`, {
      Role: data.role,
      Permissions: data.permissions,
    })
  },

  delete: async (id: string) => {
    await api.delete(`/role/${id}`)
  },
}
