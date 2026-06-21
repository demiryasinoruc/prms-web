import api from "@/lib/axios"
import { DeliveryType } from "@/features/company/api"

export interface CompanySettings {
  requireDeliveryAddressForRental: boolean
  defaultDeliveryType: DeliveryType
  defaultCurrencyId: number | null
  defaultPricePeriodId: number | null
  availabilityCheckMode: number
  productRuleCheckMode: number
  autoMaintenanceOnDamagedReturn: boolean
  allowHourlyRental: boolean
  defaultVatRate: number
  pricesIncludeVat: boolean
  requireShipmentForMultiWarehouseRental: boolean
}

export const settingsApi = {
  getCompanySettings: async () => {
    const response = await api.get<CompanySettings>("/company/settings")
    return response.data
  },
}
