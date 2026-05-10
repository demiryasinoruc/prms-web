import api from "@/lib/axios"

// Backend JsonStringEnumConverter ile string olarak serialize ediyor
export type LimitType = "User" | "Product" | "Warehouse" | "Inventory" | "Vehicle" | "MonthlyRental"

export const LimitTypeLabels: Record<LimitType, string> = {
  User: "Kullanıcı",
  Product: "Ürün",
  Warehouse: "Depo",
  Inventory: "Envanter",
  Vehicle: "Araç",
  MonthlyRental: "Aylık Kiralama",
}

export interface UsageItem {
  limitType: LimitType
  current: number
  max: number
}

export interface SubscriptionUsage {
  planId: number
  planName: string
  isDemo: boolean
  startDate: string
  endDate: string
  isActive: boolean
  items: UsageItem[]
}

export const usageApi = {
  get: async (): Promise<SubscriptionUsage> => {
    const response = await api.get<SubscriptionUsage>("/subscription-usage")
    return response.data
  },
}

// Sınırsız limit eşiği — backend int.MaxValue (~2.1 milyar) gönderiyor
export const UNLIMITED_THRESHOLD = 2_000_000_000

export function isUnlimited(max: number): boolean {
  return max >= UNLIMITED_THRESHOLD
}
