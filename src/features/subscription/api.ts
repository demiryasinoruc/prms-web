import api from "@/lib/axios"

// NOTE: Backend endpoint'leri henüz yazılmadı (Faz 2A.5/2B-backend). Şu an mock data
// dönüyoruz; sözleşme (type'lar, çağrı imzaları) gerçek API ile birebir uyumlu.
// Sandbox key + DB hazır olunca queryFn'ları gerçek endpoint çağrılarıyla değiştir.

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

// ---------- Mock data (yer tutucu) ----------

const mockSubscription: SubscriptionDetail = {
  id: "00000000-0000-0000-0000-000000000001",
  planId: 2,
  planName: "Basic",
  isDemo: false,
  billingCycle: "Monthly",
  startDate: "2026-04-17T00:00:00Z",
  endDate: "2026-06-17T00:00:00Z",
  nextBillingDate: "2026-06-17T00:00:00Z",
  autoRenew: true,
  cancelledDate: null,
  gracePeriodEnd: null,
  paymentMethodId: "00000000-0000-0000-0000-000000000010",
  amount: 999,
  currency: "TRY",
}

const mockPlans: PlanOption[] = [
  {
    id: 1,
    name: "Demo",
    description: "Sistemi keşfetmek için kısa süreli demo erişimi",
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: "TRY",
    isDemo: true,
    isPopular: false,
    features: [
      { label: "Ürün limiti", value: "50" },
      { label: "Depo", value: "1" },
      { label: "Araç", value: "2" },
      { label: "Aylık kiralama", value: "10" },
      { label: "Süre", value: "14 gün", emphasize: true },
    ],
  },
  {
    id: 2,
    name: "Basic",
    description: "Büyüyen işletmeler için günlük operasyon",
    monthlyPrice: 999,
    yearlyPrice: 9_588,
    currency: "TRY",
    isDemo: false,
    isPopular: false,
    features: [
      { label: "Ürün limiti", value: "200" },
      { label: "Depo", value: "3" },
      { label: "Araç", value: "10" },
      { label: "Aylık kiralama", value: "200" },
      { label: "Destek", value: "E-posta" },
    ],
  },
  {
    id: 3,
    name: "Pro",
    description: "Çok lokasyonlu işletmeler için sınırsız ölçek",
    monthlyPrice: 2_499,
    yearlyPrice: 23_990,
    currency: "TRY",
    isDemo: false,
    isPopular: true,
    features: [
      { label: "Ürün limiti", value: "Sınırsız", emphasize: true },
      { label: "Depo", value: "Sınırsız" },
      { label: "Araç", value: "Sınırsız" },
      { label: "Aylık kiralama", value: "Sınırsız" },
      { label: "Destek", value: "Öncelikli + Telefon", emphasize: true },
    ],
  },
]

const mockPaymentMethods: PaymentMethodSummary[] = [
  {
    id: "00000000-0000-0000-0000-000000000010",
    cardBrand: "Visa",
    lastFourDigits: "4242",
    cardHolderName: "Demir Yasin Oruç",
    expiryMonth: 12,
    expiryYear: 2028,
    isDefault: true,
    isActive: true,
    createdDate: "2026-04-17T10:00:00Z",
  },
]

const mockInvoices: InvoiceListItem[] = [
  {
    id: "inv-001",
    amount: 999,
    currency: "TRY",
    status: "Paid",
    issueDate: "2026-05-17T00:00:00Z",
    paidDate: "2026-05-17T00:05:12Z",
    failureReason: null,
  },
  {
    id: "inv-002",
    amount: 999,
    currency: "TRY",
    status: "Paid",
    issueDate: "2026-04-17T00:00:00Z",
    paidDate: "2026-04-17T00:03:42Z",
    failureReason: null,
  },
  {
    id: "inv-003",
    amount: 999,
    currency: "TRY",
    status: "Paid",
    issueDate: "2026-03-17T00:00:00Z",
    paidDate: "2026-03-17T00:02:55Z",
    failureReason: null,
  },
]

function simulate<T>(value: T, delay = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), delay))
}

export const subscriptionApi = {
  getMe: async (): Promise<SubscriptionDetail | null> => {
    // TODO(faz-2b-backend): GET /subscription/me — ICompanyAware, mevcut Subscription detayını döner.
    if (import.meta.env.VITE_USE_REAL_SUBSCRIPTION_API === "true") {
      const response = await api.get<SubscriptionDetail>("/subscription/me")
      return response.data
    }
    return simulate(mockSubscription)
  },

  getPlans: async (): Promise<PlanOption[]> => {
    // TODO(faz-2b-backend): GET /subscription-plan/public — müşteri tarafı plan seçimi için.
    if (import.meta.env.VITE_USE_REAL_SUBSCRIPTION_API === "true") {
      const response = await api.get<PlanOption[]>("/subscription-plan/public")
      return response.data
    }
    return simulate(mockPlans)
  },

  getPaymentMethods: async (): Promise<PaymentMethodSummary[]> => {
    // TODO(faz-2b-backend): GET /payment-method
    if (import.meta.env.VITE_USE_REAL_SUBSCRIPTION_API === "true") {
      const response = await api.get<PaymentMethodSummary[]>("/payment-method")
      return response.data
    }
    return simulate(mockPaymentMethods)
  },

  setDefaultPaymentMethod: async (_id: string): Promise<void> => {
    // TODO(faz-2b-backend): PUT /payment-method/{id}/default
    return simulate(undefined)
  },

  deletePaymentMethod: async (_id: string): Promise<void> => {
    // TODO(faz-2b-backend): DELETE /payment-method/{id}
    return simulate(undefined)
  },

  getInvoices: async (): Promise<InvoiceListItem[]> => {
    // TODO(faz-2b-backend): GET /invoice — yeni → eski sıralı.
    if (import.meta.env.VITE_USE_REAL_SUBSCRIPTION_API === "true") {
      const response = await api.get<InvoiceListItem[]>("/invoice")
      return response.data
    }
    return simulate(mockInvoices)
  },

  cancelSubscription: async (): Promise<void> => {
    // TODO(faz-2b-backend): POST /subscription/cancel — Subscription.CancelledDate setlenir,
    // AutoRenew=false, EndDate'e kadar kullanım devam eder.
    return simulate(undefined)
  },

  upgradePlan: async (_planId: number, _cycle: BillingCycle): Promise<{ checkoutUrl: string }> => {
    // TODO(faz-2b-backend): POST /subscription/upgrade — iyzico checkout URL'i döner.
    return simulate({ checkoutUrl: "/settings/subscription?upgrade=success" })
  },
}
