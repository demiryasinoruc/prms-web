import api from "@/lib/axios"
import type { PaginatedResponse } from "@/types/api"

export interface Category {
  id: string
  name: string
  parentCategoryId: string | null
  parentCategoryName: string
}

export interface CategoryForEdit {
  id: string
  name: string
  parentCategoryId: string | null
}

export interface CategoryListParams {
  pageNumber?: number
  pageSize?: number
  searchTerm?: string
  sortBy?: string
  sortDir?: "asc" | "desc"
  parentId?: string
}

export interface CategoryCreateRequest {
  name: string
  parentId?: string | null
}

export interface CategoryUpdateRequest {
  name: string
  parentId?: string | null
}

interface ApiCategoryListResponse {
  totalCount: number
  currentPage: number
  pageSize: number
  pageCount: number
  data: Category[]
}

export const categoryApi = {
  getAll: async (params: CategoryListParams = {}) => {
    const response = await api.get<ApiCategoryListResponse>("/category", {
      params: {
        "Pagination.Page": params.pageNumber || 1,
        "Pagination.PageSize": params.pageSize || 10,
        "Searching.Search": params.searchTerm || undefined,
        "Sorting.SortBy": params.sortBy || undefined,
        "Sorting.SortDir": params.sortDir || undefined,
        "Filters.ParentId": params.parentId || undefined,
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
    } as PaginatedResponse<Category>
  },

  getById: async (id: string) => {
    const response = await api.get<Category>(`/category/detail/${id}`)
    return response.data
  },

  getForEdit: async (id: string) => {
    const response = await api.get<CategoryForEdit>(`/category/get-for-edit/${id}`)
    return response.data
  },

  getSelectParent: async () => {
    const response = await api.get<{ value: string; text: string }[]>("/category/select-parent")
    return response.data.map((item) => ({
      id: item.value,
      name: item.text,
    }))
  },

  getSelect: async () => {
    const response = await api.get<{ value: string; text: string }[]>("/category/select")
    return response.data.map((item) => ({
      id: item.value,
      name: item.text,
    }))
  },

  /**
   * Belirtilen parent altındaki kategorileri getirir.
   * parentId undefined/null ise root kategorileri (1. seviye) getirir.
   */
  getSelectByParent: async (parentId?: string | null) => {
    const response = await api.get<{ value: string; text: string }[]>("/category/select-by-parent", {
      params: {
        parentId: parentId || undefined,
      },
    })
    return response.data.map((item) => ({
      id: item.value,
      name: item.text,
    }))
  },

  create: async (data: CategoryCreateRequest) => {
    const response = await api.post<Category>("/category", {
      Name: data.name,
      ParentCategoryId: data.parentId || null,
    })
    return response.data
  },

  update: async (id: string, data: CategoryUpdateRequest) => {
    const response = await api.put<Category>(`/category/${id}`, {
      Name: data.name,
      ParentCategoryId: data.parentId || null,
    })
    return response.data
  },

  delete: async (id: string) => {
    await api.delete(`/category/${id}`)
  },
}
