import api from "@/lib/axios"

export type BillingCycle = "Monthly" | "Yearly"

export type InvoiceStatus = "Pending" | "Paid" | "Failed" | "Refunded"

export const InvoiceStatusLabels: Record<InvoiceStatus, string> = {
  Pending: "Bekliyor",
  Paid: "Ödendi",
  Failed: "Başarısız",
  Refunded: "İade Edildi",
}

export interface SubscriptionDetail {
  id: string
  planId: number
  planName: string
  isDemo: boolean
  billingCycle: BillingCycle
  startDate: string
  endDate: string
  nextBillingDate: string | null
  autoRenew: boolean
  cancelledDate: string | null
  gracePeriodEnd: string | null
  paymentMethodId: string | null
  amount: number
  currency: string
}

export interface PlanOption {
  id: number
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  currency: string
  isDemo: boolean
  isPopular: boolean
  features: PlanFeature[]
}

export interface PlanFeature {
  label: string
  value: string
  emphasize?: boolean
}

export interface PaymentMethodSummary {
  id: string
  cardBrand: string
  lastFourDigits: string
  cardHolderName: string
  expiryMonth: number
  expiryYear: number
  isDefault: boolean
  isActive: boolean
  createdDate: string
}

export interface InvoiceListItem {
  id: string
  amount: number
  currency: string
  status: InvoiceStatus
  issueDate: string
  paidDate: string | null
  failureReason: string | null
}

// Backend payload — Max*Count alanlarını feature listesine çeviriyoruz.
interface PlanPublicPayload {
  id: number
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  isDemo: boolean
  maxUserCount: number
  maxProductCount: number
  maxWarehouseCount: number
  maxInventoryCount: number
  maxVehicleCount: number
  maxMonthlyRentalCount: number
  maxAttachmentCount: number
}

// int.MaxValue civarı sınırsızdır (subscription-usage'da da bu sınır var).
const UNLIMITED_THRESHOLD = 2_000_000_000

function formatLimit(value: number): string {
  return value >= UNLIMITED_THRESHOLD ? "Sınırsız" : value.toString()
}

function mapPlan(payload: PlanPublicPayload): PlanOption {
  const features: PlanFeature[] = [
    { label: "Ürün limiti", value: formatLimit(payload.maxProductCount), emphasize: payload.maxProductCount >= UNLIMITED_THRESHOLD },
    { label: "Depo", value: formatLimit(payload.maxWarehouseCount) },
    { label: "Araç", value: formatLimit(payload.maxVehicleCount) },
    { label: "Aylık kiralama", value: formatLimit(payload.maxMonthlyRentalCount) },
    { label: "Dosya eki", value: formatLimit(payload.maxAttachmentCount) },
    { label: "Kullanıcı", value: formatLimit(payload.maxUserCount) },
  ]

  if (payload.isDemo) {
    features.push({ label: "Süre", value: "14 gün", emphasize: true })
  }

  // "Pro" gibi sınırsız ürünlü en yüksek planı popüler işaretle; Demo asla popüler değil.
  const isPopular = !payload.isDemo && payload.maxProductCount >= UNLIMITED_THRESHOLD

  return {
    id: payload.id,
    name: payload.name,
    description: payload.description,
    monthlyPrice: payload.monthlyPrice,
    yearlyPrice: payload.yearlyPrice,
    currency: "TRY",
    isDemo: payload.isDemo,
    isPopular,
    features,
  }
}

export const subscriptionApi = {
  getMe: async (): Promise<SubscriptionDetail | null> => {
    try {
      const response = await api.get<SubscriptionDetail>("/subscription/me")
      return response.data
    } catch (err) {
      // 404 = aktif abonelik yok; null dönerek UI boş durumu gösterir.
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 404) return null
      throw err
    }
  },

  getPlans: async (): Promise<PlanOption[]> => {
    const response = await api.get<PlanPublicPayload[]>("/subscription/plans")
    return response.data.map(mapPlan)
  },

  getPaymentMethods: async (): Promise<PaymentMethodSummary[]> => {
    const response = await api.get<PaymentMethodSummary[]>("/payment-method")
    return response.data
  },

  setDefaultPaymentMethod: async (id: string): Promise<void> => {
    await api.put(`/payment-method/${id}/default`)
  },

  deletePaymentMethod: async (id: string): Promise<void> => {
    await api.delete(`/payment-method/${id}`)
  },

  getInvoices: async (): Promise<InvoiceListItem[]> => {
    const response = await api.get<InvoiceListItem[]>("/invoice")
    return response.data
  },

  cancelSubscription: async (): Promise<void> => {
    await api.post("/subscription/cancel")
  },

  upgradePlan: async (_planId: number, _cycle: BillingCycle): Promise<{ checkoutUrl: string }> => {
    // TODO(faz-2c): POST /subscription/upgrade — iyzico checkout URL'i döner.
    // Sandbox key + SDK doldurulunca gerçekleştirilecek.
    return Promise.resolve({ checkoutUrl: "/settings/subscription?upgrade=pending" })
  },
}
