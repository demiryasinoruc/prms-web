import api from "@/lib/axios"

export enum LimitType {
  User = 1,
  Product = 2,
  Warehouse = 3,
  Inventory = 4,
  Vehicle = 5,
  MonthlyRental = 6,
}

export const LimitTypeLabels: Record<LimitType, string> = {
  [LimitType.User]: "Kullanıcı",
  [LimitType.Product]: "Ürün",
  [LimitType.Warehouse]: "Depo",
  [LimitType.Inventory]: "Envanter",
  [LimitType.Vehicle]: "Araç",
  [LimitType.MonthlyRental]: "Aylık Kiralama",
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
