import api from "@/lib/axios"

// Types
export interface ProductVariantValue {
  categoryAttributeId: string
  optionValue: string
}

export interface ProductVariantValueList {
  categoryAttributeId: string
  attributeDisplayName: string
  optionValue: string
}

export interface ProductVariant {
  id: string
  sku: string
  priceOverride: number | null
  productBasePrice: number
  displayOrder: number
  notes: string | null
  isActive: boolean
  variantValues: ProductVariantValueList[]
}

export interface ProductVariantForEdit {
  id: string
  productId: string
  sku: string
  priceOverride: number | null
  displayOrder: number
  notes: string | null
  isActive: boolean
  variantValues: ProductVariantValue[]
}

export interface ProductVariantCreateRequest {
  productId: string
  sku: string
  priceOverride: number | null
  displayOrder: number
  notes: string | null
  variantValues: ProductVariantValue[]
}

export interface ProductVariantUpdateRequest {
  sku: string
  priceOverride: number | null
  displayOrder: number
  notes: string | null
  isActive: boolean
  variantValues: ProductVariantValue[]
}

export interface ProductVariantBulkGenerateRequest {
  productId: string
  skuPrefix: string
  attributeIds: string[] | null
}

export interface ProductVariantSelectItem {
  value: string
  text: string
}

export const productVariantApi = {
  getByProduct: async (productId: string) => {
    const response = await api.get<ProductVariant[]>(`/product-variant/by-product/${productId}`)
    return response.data
  },

  getForEdit: async (id: string) => {
    const response = await api.get<ProductVariantForEdit>(`/product-variant/get-for-edit/${id}`)
    return response.data
  },

  getSelect: async (productId: string) => {
    const response = await api.get<ProductVariantSelectItem[]>("/product-variant/get-select", {
      params: { productId },
    })
    return response.data
  },

  create: async (data: ProductVariantCreateRequest) => {
    const response = await api.post("/product-variant", {
      ProductId: data.productId,
      Sku: data.sku,
      PriceOverride: data.priceOverride,
      DisplayOrder: data.displayOrder,
      Notes: data.notes,
      VariantValues: data.variantValues.map((v) => ({
        CategoryAttributeId: v.categoryAttributeId,
        OptionValue: v.optionValue,
      })),
    })
    return response.data
  },

  bulkGenerate: async (data: ProductVariantBulkGenerateRequest) => {
    const response = await api.post<{ count: number }>("/product-variant/bulk-generate", {
      ProductId: data.productId,
      SkuPrefix: data.skuPrefix,
      AttributeIds: data.attributeIds,
    })
    return response.data
  },

  update: async (id: string, data: ProductVariantUpdateRequest) => {
    const response = await api.put(`/product-variant/${id}`, {
      Sku: data.sku,
      PriceOverride: data.priceOverride,
      DisplayOrder: data.displayOrder,
      Notes: data.notes,
      IsActive: data.isActive,
      VariantValues: data.variantValues.map((v) => ({
        CategoryAttributeId: v.categoryAttributeId,
        OptionValue: v.optionValue,
      })),
    })
    return response.data
  },

  delete: async (id: string) => {
    await api.delete(`/product-variant/${id}`)
  },
}
