import api from "@/lib/axios"

export enum ServiceType {
  Other = 0,
  Transport = 1,
  Personnel = 2,
  VehicleService = 3,
  Installation = 4,
  Consulting = 5,
}

export const ServiceTypeLabels: Record<ServiceType, string> = {
  [ServiceType.Other]: "Diğer",
  [ServiceType.Transport]: "Nakliye",
  [ServiceType.Personnel]: "Personel",
  [ServiceType.VehicleService]: "Araçlı Hizmet",
  [ServiceType.Installation]: "Kurulum/Montaj",
  [ServiceType.Consulting]: "Danışmanlık",
}

export interface ExtraService {
  id: string
  name: string
  description: string
  price: number
  pricePeriodName: string
  currencyCode: string
  requiredCertificateName: string | null
  requiresEmployee: boolean
  serviceType: ServiceType
  requiresVehicle: boolean
  isActive: boolean
}

export interface ExtraServiceFilters {
  minPrice?: number
  maxPrice?: number
  pricePeriodId?: string
  requiredCertificateId?: string
  isActive?: boolean
}

export interface ExtraServiceParams {
  page?: number
  pageSize?: number
  search?: string
  sortBy?: string
  sortDir?: "asc" | "desc"
  filters?: ExtraServiceFilters
}

export interface PagingResponse<T> {
  totalCount: number
  currentPage: number
  pageSize: number
  pageCount: number
  data: T[]
}

export interface ExtraServiceDetail {
  id: string
  name: string
  description: string
  price: number
  pricePeriodId: number  // Backend int döndürür
  pricePeriodName: string
  currencyId: number  // Backend int döndürür
  currencyCode: string
  requiredCertificateId: string | null
  requiredCertificateName: string | null
  requiresEmployee: boolean
  serviceType: ServiceType
  requiresVehicle: boolean
  isActive: boolean
  notes: string | null
  createdDate: string
}

export interface ExtraServiceCreateRequest {
  name: string
  description: string
  price: number
  pricePeriodId: number
  currencyId: number
  requiredCertificateId?: string | null
  requiresEmployee: boolean
  serviceType?: ServiceType
  requiresVehicle?: boolean
  notes?: string | null
}

export interface ExtraServiceUpdateRequest {
  name: string
  description: string
  price: number
  pricePeriodId: number
  currencyId: number
  requiredCertificateId?: string | null
  requiresEmployee: boolean
  serviceType?: ServiceType
  requiresVehicle?: boolean
  isActive: boolean
  notes?: string | null
}

export interface SelectItem {
  value: number  // Backend int döndürür (PricePeriod, Currency)
  text: string
}

export interface SelectItemGuid {
  value: string  // Backend Guid döndürür (ExtraService)
  text: string
}

export interface ExtraServiceSelectForRental {
  id: string
  name: string
  price: number
  pricePeriodId: number
  currencyCode: string
  requiresEmployee: boolean
  serviceType: ServiceType
  requiresVehicle: boolean
}

export const extraServiceApi = {
  getAll: async (params?: ExtraServiceParams) => {
    const queryParams = new URLSearchParams()

    if (params?.page) queryParams.append("Pagination.Page", params.page.toString())
    if (params?.pageSize) queryParams.append("Pagination.PageSize", params.pageSize.toString())
    if (params?.search) queryParams.append("Searching.Search", params.search)
    if (params?.sortBy) queryParams.append("Sorting.SortBy", params.sortBy)
    if (params?.sortDir) queryParams.append("Sorting.SortDir", params.sortDir)

    if (params?.filters) {
      if (params.filters.minPrice !== undefined)
        queryParams.append("Filters.MinPrice", params.filters.minPrice.toString())
      if (params.filters.maxPrice !== undefined)
        queryParams.append("Filters.MaxPrice", params.filters.maxPrice.toString())
      if (params.filters.pricePeriodId)
        queryParams.append("Filters.PricePeriodId", params.filters.pricePeriodId)
      if (params.filters.requiredCertificateId)
        queryParams.append("Filters.RequiredCertificateId", params.filters.requiredCertificateId)
      if (params.filters.isActive !== undefined)
        queryParams.append("Filters.IsActive", params.filters.isActive.toString())
    }

    const queryString = queryParams.toString()
    const url = queryString ? `/extraservice?${queryString}` : "/extraservice"
    const response = await api.get<PagingResponse<ExtraService>>(url)
    return response.data
  },

  getById: async (id: string) => {
    const response = await api.get<ExtraServiceDetail>(`/extraservice/detail/${id}`)
    return response.data
  },

  getSelect: async () => {
    const response = await api.get<SelectItemGuid[]>("/extraservice/select")
    return response.data.map((item) => ({
      id: item.value,
      name: item.text,
    }))
  },

  getSelectForRental: async () => {
    const response = await api.get<ExtraServiceSelectForRental[]>("/extraservice/select-for-rental")
    return response.data
  },

  create: async (data: ExtraServiceCreateRequest) => {
    const response = await api.post("/extraservice", {
      Name: data.name,
      Description: data.description,
      Price: data.price,
      PricePeriodId: Number(data.pricePeriodId),
      CurrencyId: Number(data.currencyId),
      RequiredCertificateId: data.requiredCertificateId || null,
      RequiresEmployee: data.requiresEmployee,
      ServiceType: data.serviceType ?? ServiceType.Other,
      RequiresVehicle: data.requiresVehicle ?? false,
      Notes: data.notes || null,
    })
    return response.data
  },

  update: async (id: string, data: ExtraServiceUpdateRequest) => {
    const response = await api.put(`/extraservice/${id}`, {
      Name: data.name,
      Description: data.description,
      Price: data.price,
      PricePeriodId: Number(data.pricePeriodId),
      CurrencyId: Number(data.currencyId),
      RequiredCertificateId: data.requiredCertificateId || null,
      RequiresEmployee: data.requiresEmployee,
      ServiceType: data.serviceType ?? ServiceType.Other,
      RequiresVehicle: data.requiresVehicle ?? false,
      IsActive: data.isActive,
      Notes: data.notes || null,
    })
    return response.data
  },

  delete: async (id: string) => {
    await api.delete(`/extraservice/${id}`)
  },
}

// Lookup API'ler
export const lookupApi = {
  getPricePeriods: async () => {
    const response = await api.get<SelectItem[]>("/priceperiod/select")
    return response.data
  },

  getCurrencies: async () => {
    const response = await api.get<SelectItem[]>("/currency/select")
    return response.data
  },

  getCertificates: async () => {
    const response = await api.get<SelectItem[]>("/certificate/select")
    return response.data
  },
}
