import api from "@/lib/axios"
import type { PaginatedResponse } from "@/types/api"

// Enums
export enum ProductType {
  Tracked = 1,    // Takipli - Seri numaralı
  Countable = 2,  // Sayılabilir - Miktar bazlı
  Consumable = 3, // Sarf malzeme - Tüketilebilir
}

export const ProductTypeLabels: Record<ProductType, string> = {
  [ProductType.Tracked]: "Takipli",
  [ProductType.Countable]: "Sayılabilir",
  [ProductType.Consumable]: "Sarf Malzeme",
}

// Types
export interface Product {
  id: string
  type: ProductType
  name: string
  productCode: string
  cost: number
  basePrice: number
  pricePeriodName: string
  currencyCode: string
  categoryName: string
  isActive: boolean
  variantCount: number
}

export interface ProductDetail {
  id: string
  type: ProductType
  name: string
  description: string
  productCode: string
  basePrice: number
  pricePeriodName: string
  currencyCode: string
  minimumStockLevel: number
  totalLifespan: number | null
  lifespanUnitTypeName: string | null
  categoryName: string
  unitTypeName: string
  isActive: boolean
  notes: string | null
  createdDate: string
  variantCount: number
}

export interface ProductAttributeValue {
  categoryAttributeId: string
  stringValue: string | null
  numericValue: number | null
  dateValue: string | null
  boolValue: boolean | null
}

export interface ProductForEdit {
  type: ProductType
  name: string
  description: string
  productCode: string
  minimumStockLevel: number
  cost: number
  basePrice: number
  pricePeriodId: number
  currencyId: number
  totalLifespan: number | null
  lifespanUnitTypeId: number | null
  categoryId: string
  categoryParentId: string | null      // Kategorinin parent'ı
  categoryGrandParentId: string | null // Kategorinin grandparent'ı
  unitTypeId: number
  trackExpiryDate: boolean
  isActive: boolean
  notes: string | null
  attributeValues: ProductAttributeValue[]
}

export interface ProductListParams {
  pageNumber?: number
  pageSize?: number
  searchTerm?: string
  sortBy?: string
  sortDir?: "asc" | "desc"
  // Filtreler
  categoryId?: string
  isActive?: boolean
}

export interface ProductCreateRequest {
  type: ProductType
  name: string
  description: string
  productCode: string
  minimumStockLevel: number
  cost: number
  basePrice: number
  pricePeriodId: number
  currencyId: number
  totalLifespan?: number | null
  lifespanUnitTypeId?: number | null
  categoryId: string
  unitTypeId: number
  trackExpiryDate: boolean
  notes?: string | null
  attributeValues?: ProductAttributeValue[]
}

export interface ProductUpdateRequest {
  type: ProductType
  name: string
  description: string
  productCode: string
  minimumStockLevel: number
  cost: number
  basePrice: number
  pricePeriodId: number
  currencyId: number
  totalLifespan?: number | null
  lifespanUnitTypeId?: number | null
  categoryId: string
  unitTypeId: number
  trackExpiryDate: boolean
  isActive: boolean
  notes?: string | null
  attributeValues?: ProductAttributeValue[]
}

interface ApiProductListResponse {
  totalCount: number
  currentPage: number
  pageSize: number
  pageCount: number
  data: Product[]
}

export interface ProductSelectItemForRental {
  id: string
  name: string
  basePrice: number
  pricePeriodId: number
}

// Tip bilgisi içeren ürün seçimi (Inventory formu için)
export interface ProductSelectWithType {
  id: string
  name: string
  type: ProductType
  totalLifespan: number | null
  lifespanUnitTypeId: number | null
  lifespanUnitTypeName: string | null
  trackExpiryDate: boolean
}

export const productApi = {
  getAll: async (params: ProductListParams = {}) => {
    const response = await api.get<ApiProductListResponse>("/product", {
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
    } as PaginatedResponse<Product>
  },

  getDetail: async (id: string) => {
    const response = await api.get<ProductDetail>(`/product/detail/${id}`)
    return response.data
  },

  getForEdit: async (id: string) => {
    const response = await api.get<ProductForEdit>(`/product/get-for-edit/${id}`)
    return response.data
  },

  getSelect: async () => {
    const response = await api.get<{ value: string; text: string }[]>("/product/select")
    return response.data.map((item) => ({
      id: item.value,
      name: item.text,
    }))
  },

  getSelectForRental: async () => {
    const response = await api.get<ProductSelectItemForRental[]>("/product/select-for-rental")
    return response.data
  },

  getSelectWithType: async () => {
    const response = await api.get<ProductSelectWithType[]>("/product/select-with-type")
    return response.data
  },

  create: async (data: ProductCreateRequest) => {
    const response = await api.post("/product", {
      Type: data.type,
      Name: data.name,
      Description: data.description,
      ProductCode: data.productCode,
      MinimumStockLevel: data.minimumStockLevel,
      Cost: data.cost,
      BasePrice: data.basePrice,
      PricePeriodId: data.pricePeriodId,
      CurrencyId: data.currencyId,
      TotalLifespan: data.totalLifespan || null,
      LifespanUnitTypeId: data.lifespanUnitTypeId || null,
      CategoryId: data.categoryId,
      UnitTypeId: data.unitTypeId,
      TrackExpiryDate: data.trackExpiryDate,
      Notes: data.notes || null,
      AttributeValues: data.attributeValues?.map((v) => ({
        CategoryAttributeId: v.categoryAttributeId,
        StringValue: v.stringValue,
        NumericValue: v.numericValue,
        DateValue: v.dateValue,
        BoolValue: v.boolValue,
      })) || null,
    })
    return response.data
  },

  update: async (id: string, data: ProductUpdateRequest) => {
    const response = await api.put(`/product/${id}`, {
      Type: data.type,
      Name: data.name,
      Description: data.description,
      ProductCode: data.productCode,
      MinimumStockLevel: data.minimumStockLevel,
      Cost: data.cost,
      BasePrice: data.basePrice,
      PricePeriodId: data.pricePeriodId,
      CurrencyId: data.currencyId,
      TotalLifespan: data.totalLifespan || null,
      LifespanUnitTypeId: data.lifespanUnitTypeId || null,
      CategoryId: data.categoryId,
      UnitTypeId: data.unitTypeId,
      TrackExpiryDate: data.trackExpiryDate,
      IsActive: data.isActive,
      Notes: data.notes || null,
      AttributeValues: data.attributeValues?.map((v) => ({
        CategoryAttributeId: v.categoryAttributeId,
        StringValue: v.stringValue,
        NumericValue: v.numericValue,
        DateValue: v.dateValue,
        BoolValue: v.boolValue,
      })) || null,
    })
    return response.data
  },

  delete: async (id: string) => {
    await api.delete(`/product/${id}`)
  },
}

// Lookup APIs
export interface SelectItem {
  value: string
  text: string
}

export interface SelectItemInt {
  value: number
  text: string
}

export const lookupApi = {
  getCategories: async () => {
    const response = await api.get<SelectItem[]>("/category/select")
    return response.data
  },

  getUnitTypes: async () => {
    const response = await api.get<SelectItemInt[]>("/unittype/select")
    return response.data
  },

  getPricePeriods: async () => {
    const response = await api.get<SelectItemInt[]>("/priceperiod/select")
    return response.data
  },

  getCurrencies: async () => {
    const response = await api.get<SelectItemInt[]>("/currency/select")
    return response.data
  },

  getLifespanUnitTypes: async () => {
    const response = await api.get<SelectItemInt[]>("/lifespanunittype/select")
    return response.data
  },
}
