import api from "@/lib/axios"

// Enums
export enum DeliveryType {
  CustomerPickup = 1,
  CompanyDelivery = 2,
  PerRental = 3,
}

export const DeliveryTypeLabels: Record<DeliveryType, string> = {
  [DeliveryType.CustomerPickup]: "Teslimat Yok (Müşteri Teslim Alır)",
  [DeliveryType.CompanyDelivery]: "Teslimat Var (Biz Teslim Ederiz)",
  [DeliveryType.PerRental]: "Kiralamaya Göre Değişir",
}

export interface CompanyProfile {
  id: string
  name: string
  email: string
  phone: string
}

export interface CompanyForEdit {
  name: string
  email: string
  phone: string
  requireDeliveryAddressForRental: boolean
  defaultDeliveryType: DeliveryType
  defaultCurrencyId: number | null
  defaultPricePeriodId: number | null
  availabilityCheckMode: number
  productRuleCheckMode: number
}

export interface CompanyUpdateRequest {
  name: string
  email: string
  phone: string
  requireDeliveryAddressForRental: boolean
  defaultDeliveryType: DeliveryType
  defaultCurrencyId: number | null
  defaultPricePeriodId: number | null
  availabilityCheckMode: number
  productRuleCheckMode: number
}

export const companyApi = {
  getByUser: async () => {
    const response = await api.get<{
      id: string
      name: string
      email: string
      phone: string
    }>("/company/get-company-by-user")
    return {
      id: response.data.id,
      name: response.data.name,
      email: response.data.email,
      phone: response.data.phone,
    } as CompanyProfile
  },

  getForEdit: async (id: string) => {
    const response = await api.get<{
      name: string
      email: string
      phone: string
      requireDeliveryAddressForRental: boolean
      defaultDeliveryType: DeliveryType
      defaultCurrencyId: number | null
      defaultPricePeriodId: number | null
      availabilityCheckMode: string
      productRuleCheckMode: string
    }>(`/company/edit/${id}`)
    return {
      name: response.data.name,
      email: response.data.email,
      phone: response.data.phone,
      requireDeliveryAddressForRental: response.data.requireDeliveryAddressForRental,
      defaultDeliveryType: response.data.defaultDeliveryType,
      defaultCurrencyId: response.data.defaultCurrencyId,
      defaultPricePeriodId: response.data.defaultPricePeriodId,
      availabilityCheckMode: response.data.availabilityCheckMode,
      productRuleCheckMode: response.data.productRuleCheckMode,
    } as CompanyForEdit
  },

  update: async (id: string, data: CompanyUpdateRequest) => {
    await api.put(`/company/${id}`, {
      name: data.name,
      email: data.email,
      phone: data.phone,
      requireDeliveryAddressForRental: data.requireDeliveryAddressForRental,
      defaultDeliveryType: data.defaultDeliveryType,
      defaultCurrencyId: data.defaultCurrencyId,
      defaultPricePeriodId: data.defaultPricePeriodId,
      availabilityCheckMode: data.availabilityCheckMode,
      productRuleCheckMode: data.productRuleCheckMode,
    })
  },
}
