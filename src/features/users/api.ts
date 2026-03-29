import api from "@/lib/axios"
import type { PaginatedResponse } from "@/types/api"

export interface User {
  id: string
  name: string
  surname: string
  email: string
  roleName: string
  createdDate: string
}

export interface UserDetail {
  id: string
  name: string
  surname: string
  email: string
  roleName: string
  createdDate: string
}

export interface UserForEdit {
  id: string
  name: string
  surname: string
  email: string
  roleId: string | null
}

export interface UserUpdateRequest {
  name: string
  surname: string
  email: string
  roleId: string
}

export interface UserListParams {
  pageNumber?: number
  pageSize?: number
  searchTerm?: string
  roleId?: string
  sortBy?: string
  sortDir?: "asc" | "desc"
}

interface ApiUserListResponse {
  totalCount: number
  currentPage: number
  pageSize: number
  pageCount: number
  data: Array<{
    id: string
    name: string
    surname: string
    email: string
    roleName: string
    createdDate: string
  }>
}

export const userApi = {
  getAll: async (params: UserListParams = {}) => {
    const response = await api.get<ApiUserListResponse>("/user", {
      params: {
        "Pagination.Page": params.pageNumber || 1,
        "Pagination.PageSize": params.pageSize || 10,
        "Searching.Search": params.searchTerm || undefined,
        "Filters.RoleId": params.roleId || undefined,
        "Sorting.SortBy": params.sortBy || undefined,
        "Sorting.SortDir": params.sortDir || undefined,
      },
    })

    const apiData = response.data
    return {
      items: apiData.data.map((item) => ({
        id: item.id,
        name: item.name,
        surname: item.surname,
        email: item.email,
        roleName: item.roleName,
        createdDate: item.createdDate,
      })),
      totalCount: apiData.totalCount,
      pageNumber: apiData.currentPage,
      pageSize: apiData.pageSize,
      totalPages: apiData.pageCount,
      hasPreviousPage: apiData.currentPage > 1,
      hasNextPage: apiData.currentPage < apiData.pageCount,
    } as PaginatedResponse<User>
  },

  getDetail: async (id: string) => {
    const response = await api.get<{
      id: string
      name: string
      surname: string
      email: string
      roleName: string
      createdDate: string
    }>(`/user/detail/${id}`)
    return {
      id: response.data.id,
      name: response.data.name,
      surname: response.data.surname,
      email: response.data.email,
      roleName: response.data.roleName,
      createdDate: response.data.createdDate,
    } as UserDetail
  },

  getForEdit: async (id: string) => {
    const response = await api.get<{
      id: string
      name: string
      surname: string
      email: string
      roleId: string | null
    }>(`/user/get-for-edit/${id}`)
    return {
      id: response.data.id,
      name: response.data.name,
      surname: response.data.surname,
      email: response.data.email,
      roleId: response.data.roleId,
    } as UserForEdit
  },

  update: async (id: string, data: UserUpdateRequest) => {
    await api.put(`/user/${id}`, {
      Name: data.name,
      Surname: data.surname,
      Email: data.email,
      RoleId: data.roleId,
    })
  },
}
