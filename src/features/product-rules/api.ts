import api from "@/lib/axios"

export enum ProductRuleType {
  Direct = 1,
  FromGroup = 2,
  Ratio = 3,
  RequiresService = 4,
}

export const ProductRuleTypeLabels: Record<ProductRuleType, string> = {
  [ProductRuleType.Direct]: "Birebir",
  [ProductRuleType.FromGroup]: "Kategoriden",
  [ProductRuleType.Ratio]: "Oransal",
  [ProductRuleType.RequiresService]: "Ek Hizmet",
}

export enum ProductRuleBehavior {
  Required = 1,
  Suggested = 2,
  Automatic = 3,
}

export const ProductRuleBehaviorLabels: Record<ProductRuleBehavior, string> = {
  [ProductRuleBehavior.Required]: "Zorunlu",
  [ProductRuleBehavior.Suggested]: "Önerilen",
  [ProductRuleBehavior.Automatic]: "Otomatik",
}

export interface ProductRule {
  id: string
  sourceProductId: string
  sourceProductName: string
  type: ProductRuleType
  behavior: ProductRuleBehavior
  targetProductId: string | null
  targetProductName: string | null
  targetCategoryId: string | null
  targetCategoryName: string | null
  targetServiceId: string | null
  targetServiceName: string | null
  quantity: number
  isActive: boolean
  ruleGroupId: string | null
}

export interface ProductRuleDetail {
  id: string
  sourceProductId: string
  sourceProductName: string
  type: ProductRuleType
  behavior: ProductRuleBehavior
  targetProductId: string | null
  targetProductName: string | null
  targetCategoryId: string | null
  targetCategoryName: string | null
  targetServiceId: string | null
  targetServiceName: string | null
  quantity: number
  description: string | null
  isActive: boolean
  ruleGroupId: string | null
  createdDate: string
}

export interface ProductRuleListParams {
  sourceProductId?: string
}

export interface ProductRuleCreateRequest {
  sourceProductId: string
  type: ProductRuleType
  behavior: ProductRuleBehavior
  targetProductId?: string | null
  targetCategoryId?: string | null
  targetServiceId?: string | null
  quantity: number
  description?: string | null
  ruleGroupId?: string | null
}

export interface ProductRuleUpdateRequest {
  sourceProductId: string
  type: ProductRuleType
  behavior: ProductRuleBehavior
  targetProductId?: string | null
  targetCategoryId?: string | null
  targetServiceId?: string | null
  quantity: number
  description?: string | null
  isActive: boolean
  ruleGroupId?: string | null
}

export const productRuleApi = {
  getAll: async (params: ProductRuleListParams = {}) => {
    const response = await api.get<ProductRule[]>("/productrule", {
      params: {
        sourceProductId: params.sourceProductId || undefined,
      },
    })
    return response.data
  },

  getDetail: async (id: string) => {
    const response = await api.get<ProductRuleDetail>("/productrule/" + id)
    return response.data
  },

  create: async (data: ProductRuleCreateRequest) => {
    const response = await api.post("/productrule", {
      SourceProductId: data.sourceProductId,
      Type: data.type,
      Behavior: data.behavior,
      TargetProductId: data.targetProductId || null,
      TargetCategoryId: data.targetCategoryId || null,
      TargetServiceId: data.targetServiceId || null,
      Quantity: data.quantity,
      Description: data.description || null,
      RuleGroupId: data.ruleGroupId || null,
    })
    return response.data
  },

  update: async (id: string, data: ProductRuleUpdateRequest) => {
    const response = await api.put("/productrule/" + id, {
      SourceProductId: data.sourceProductId,
      Type: data.type,
      Behavior: data.behavior,
      TargetProductId: data.targetProductId || null,
      TargetCategoryId: data.targetCategoryId || null,
      TargetServiceId: data.targetServiceId || null,
      Quantity: data.quantity,
      Description: data.description || null,
      IsActive: data.isActive,
      RuleGroupId: data.ruleGroupId || null,
    })
    return response.data
  },

  delete: async (id: string) => {
    await api.delete("/productrule/" + id)
  },
}
