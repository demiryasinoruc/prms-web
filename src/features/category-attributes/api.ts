import api from "@/lib/axios"
import type { PaginatedResponse } from "@/types/api"

// Enums
export enum AttributeDataType {
  String = 1,
  Integer = 2,
  Decimal = 3,
  Boolean = 4,
  Date = 5,
  Select = 6,
  MultiSelect = 7,
}

export const AttributeDataTypeLabels: Record<AttributeDataType, string> = {
  [AttributeDataType.String]: "Metin",
  [AttributeDataType.Integer]: "Tam Sayı",
  [AttributeDataType.Decimal]: "Ondalık Sayı",
  [AttributeDataType.Boolean]: "Evet/Hayır",
  [AttributeDataType.Date]: "Tarih",
  [AttributeDataType.Select]: "Tekli Seçim",
  [AttributeDataType.MultiSelect]: "Çoklu Seçim",
}

// Types
export interface CategoryAttribute {
  id: string
  categoryId: string
  categoryName: string
  name: string
  displayName: string
  dataType: AttributeDataType
  dataTypeName: string
  isRequired: boolean
  displayOrder: number
  showInList: boolean
  showInFilter: boolean
  isSearchable: boolean
  inheritToChildren: boolean
  isActive: boolean
}

export interface CategoryAttributeForEdit {
  id: string
  categoryId: string
  name: string
  displayName: string
  dataType: AttributeDataType
  isRequired: boolean
  displayOrder: number
  defaultValue?: string | null
  placeholder?: string | null
  helpText?: string | null
  selectOptions?: string | null
  validationRules?: string | null
  showInList: boolean
  showInFilter: boolean
  isSearchable: boolean
  inheritToChildren: boolean
  isActive: boolean
}

export interface CategoryAttributeListParams {
  pageNumber?: number
  pageSize?: number
  searchTerm?: string
  sortBy?: string
  sortDir?: "asc" | "desc"
  categoryId?: string
  isActive?: boolean
}

export interface CategoryAttributeCreateRequest {
  categoryId: string
  name: string
  displayName: string
  dataType: AttributeDataType
  isRequired: boolean
  displayOrder: number
  defaultValue?: string | null
  placeholder?: string | null
  helpText?: string | null
  selectOptions?: string | null
  validationRules?: string | null
  showInList: boolean
  showInFilter: boolean
  isSearchable: boolean
  inheritToChildren: boolean
}

export interface CategoryAttributeUpdateRequest {
  name: string
  displayName: string
  dataType: AttributeDataType
  isRequired: boolean
  displayOrder: number
  defaultValue?: string | null
  placeholder?: string | null
  helpText?: string | null
  selectOptions?: string | null
  validationRules?: string | null
  showInList: boolean
  showInFilter: boolean
  isSearchable: boolean
  inheritToChildren: boolean
  isActive: boolean
}

interface ApiListResponse {
  totalCount: number
  currentPage: number
  pageSize: number
  pageCount: number
  data: CategoryAttribute[]
}

export const categoryAttributeApi = {
  getAll: async (params: CategoryAttributeListParams = {}) => {
    const response = await api.get<ApiListResponse>("/categoryattribute", {
      params: {
        "Pagination.Page": params.pageNumber || 1,
        "Pagination.PageSize": params.pageSize || 10,
        "Searching.Search": params.searchTerm || undefined,
        "Sorting.SortBy": params.sortBy || undefined,
        "Sorting.SortDir": params.sortDir || undefined,
        "Filters.CategoryId": params.categoryId || undefined,
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
    } as PaginatedResponse<CategoryAttribute>
  },

  getForEdit: async (id: string) => {
    const response = await api.get<CategoryAttributeForEdit>(
      `/categoryattribute/get-for-edit/${id}`
    )
    return response.data
  },

  getByCategory: async (categoryId: string) => {
    const response = await api.get<CategoryAttributeForEdit[]>(
      `/categoryattribute/by-category/${categoryId}`
    )
    return response.data
  },

  create: async (data: CategoryAttributeCreateRequest) => {
    const response = await api.post("/categoryattribute", {
      CategoryId: data.categoryId,
      Name: data.name,
      DisplayName: data.displayName,
      DataType: data.dataType,
      IsRequired: data.isRequired,
      DisplayOrder: data.displayOrder,
      DefaultValue: data.defaultValue || null,
      Placeholder: data.placeholder || null,
      HelpText: data.helpText || null,
      SelectOptions: data.selectOptions || null,
      ValidationRules: data.validationRules || null,
      ShowInList: data.showInList,
      ShowInFilter: data.showInFilter,
      IsSearchable: data.isSearchable,
      InheritToChildren: data.inheritToChildren,
    })
    return response.data
  },

  update: async (id: string, data: CategoryAttributeUpdateRequest) => {
    const response = await api.put(`/categoryattribute/${id}`, {
      Name: data.name,
      DisplayName: data.displayName,
      DataType: data.dataType,
      IsRequired: data.isRequired,
      DisplayOrder: data.displayOrder,
      DefaultValue: data.defaultValue || null,
      Placeholder: data.placeholder || null,
      HelpText: data.helpText || null,
      SelectOptions: data.selectOptions || null,
      ValidationRules: data.validationRules || null,
      ShowInList: data.showInList,
      ShowInFilter: data.showInFilter,
      IsSearchable: data.isSearchable,
      InheritToChildren: data.inheritToChildren,
      IsActive: data.isActive,
    })
    return response.data
  },

  delete: async (id: string) => {
    await api.delete(`/categoryattribute/${id}`)
  },
}
