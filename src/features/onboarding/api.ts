import api from "@/lib/axios"

export interface SectorTemplateSummary {
  key: string
  displayName: string
  description: string
  icon: string
  categoryCount: number
  productSuggestionCount: number
  extraServiceCount: number
}

export interface AttributeDetail {
  name: string
  displayName: string
  dataType: string
  isRequired: boolean
  selectOptions: string[] | null
}

export interface CategoryDetail {
  name: string
  attributes: AttributeDetail[]
}

export interface ExtraServiceDetail {
  name: string
  description: string
  serviceType: string
  requiresEmployee: boolean
  requiresVehicle: boolean
}

export interface ProductSuggestionDetail {
  category: string
  brand: string
  model: string
  name: string
  productType: string
  attributes: Record<string, unknown> | null
}

export interface SectorTemplateDetail {
  key: string
  displayName: string
  description: string
  icon: string
  categories: CategoryDetail[]
  extraServices: ExtraServiceDetail[]
  productSuggestions: ProductSuggestionDetail[]
}

export interface ProductSuggestionSelection {
  category: string
  brand: string
  model: string
}

export interface ApplyTemplateRequest {
  sectorKey: string
  categoryNames: string[]
  extraServiceNames: string[]
  productSuggestions: ProductSuggestionSelection[]
}

export interface ApplyResult {
  categoriesAdded: number
  categoriesSkipped: number
  attributesAdded: number
  attributesSkipped: number
  extraServicesAdded: number
  extraServicesSkipped: number
  productsAdded: number
  productsSkipped: number
}

export interface OnboardingStatus {
  completed: boolean
  completedAt: string | null
}

export const onboardingApi = {
  list: async () => {
    const response = await api.get<SectorTemplateSummary[]>("/sector-template")
    return response.data
  },
  detail: async (key: string) => {
    const response = await api.get<SectorTemplateDetail>(`/sector-template/${key}`)
    return response.data
  },
  status: async () => {
    const response = await api.get<OnboardingStatus>("/sector-template/onboarding-status")
    return response.data
  },
  apply: async (request: ApplyTemplateRequest) => {
    const response = await api.post<ApplyResult>("/sector-template/apply", {
      SectorKey: request.sectorKey,
      CategoryNames: request.categoryNames,
      ExtraServiceNames: request.extraServiceNames,
      ProductSuggestions: request.productSuggestions.map((p) => ({
        Category: p.category,
        Brand: p.brand,
        Model: p.model,
      })),
    })
    return response.data
  },
  skip: async () => {
    await api.post("/sector-template/complete")
  },
}
