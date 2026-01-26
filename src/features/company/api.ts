import api from "@/lib/axios"

// Enums
export enum DeliveryType {
  CustomerPickup = 1,
  CompanyDelivery = 2,
}

export const DeliveryTypeLabels: Record<DeliveryType, string> = {
  [DeliveryType.CustomerPickup]: "Müşteri Teslim Alır",
  [DeliveryType.CompanyDelivery]: "Teslimatı Biz Yapıyoruz",
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
}

export interface CompanyUpdateRequest {
  name: string
  email: string
  phone: string
  requireDeliveryAddressForRental: boolean
  defaultDeliveryType: DeliveryType
  defaultCurrencyId: number | null
  defaultPricePeriodId: number | null
}

export const companyApi = {
  getByUser: async () => {
    const response = await api.get<{
      id: string
      name: string
      eMail: string
      phone: string
    }>("/company/get-company-by-user")
    return {
      id: response.data.id,
      name: response.data.name,
      email: response.data.eMail,
      phone: response.data.phone,
    } as CompanyProfile
  },

  getForEdit: async (id: string) => {
    const response = await api.get<{
      name: string
      eMail: string
      phone: string
      requireDeliveryAddressForRental: boolean
      defaultDeliveryType: DeliveryType
      defaultCurrencyId: number | null
      defaultPricePeriodId: number | null
    }>(`/company/edit/${id}`)
    return {
      name: response.data.name,
      email: response.data.eMail,
      phone: response.data.phone,
      requireDeliveryAddressForRental: response.data.requireDeliveryAddressForRental,
      defaultDeliveryType: response.data.defaultDeliveryType,
      defaultCurrencyId: response.data.defaultCurrencyId,
      defaultPricePeriodId: response.data.defaultPricePeriodId,
    } as CompanyForEdit
  },

  update: async (id: string, data: CompanyUpdateRequest) => {
    await api.put(`/company/${id}`, {
      name: data.name,
      eMail: data.email,
      phone: data.phone,
      requireDeliveryAddressForRental: data.requireDeliveryAddressForRental,
      defaultDeliveryType: data.defaultDeliveryType,
      defaultCurrencyId: data.defaultCurrencyId,
      defaultPricePeriodId: data.defaultPricePeriodId,
    })
  },
}
