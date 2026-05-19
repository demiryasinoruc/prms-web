import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from "axios"
import { toast } from "sonner"
import { confirmDelete } from "./confirm"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// URL pattern to Turkish entity name mapping.
// SIRA ÖNEMLİ: en spesifik path'ler (uzun, çoklu kelime) önce gelmeli — `includes`
// match'i ilk eşleşeni döner; "categoryattribute" "category"den önce yakalanmalı.
const entityNames: Record<string, string> = {
  // Çoklu-kelime / spesifik path'ler (önce)
  "category-attribute": "Kategori Özelliği",
  categoryattribute: "Kategori Özelliği",
  "extra-service": "Ek Hizmet",
  extraservice: "Ek Hizmet",
  "product-rule": "Ürün Kuralı",
  productrule: "Ürün Kuralı",
  "product-variant": "Ürün Varyantı",
  productvariant: "Ürün Varyantı",
  "maintenance-schedule": "Bakım Planı",
  maintenanceschedule: "Bakım Planı",
  "maintenance-record": "Bakım Kaydı",
  maintenancerecord: "Bakım Kaydı",
  "calendar-event": "Takvim Etkinliği",
  calendarevent: "Takvim Etkinliği",
  "subscription-plan": "Abonelik Planı",
  subscriptionplan: "Abonelik Planı",
  "payment-method": "Kart",
  paymentmethod: "Kart",
  certificate: "Sertifika",
  notification: "Bildirim",
  invoice: "Fatura",
  subscription: "Abonelik",

  // Genel single-word path'ler (sonra)
  customer: "Müşteri",
  brand: "Marka",
  category: "Kategori",
  employee: "Çalışan",
  vehicle: "Araç",
  warehouse: "Depo",
  role: "Rol",
  product: "Ürün",
  user: "Kullanıcı",
  rental: "Kiralama",
  inventory: "Envanter",
}

// Extract entity name from URL
function getEntityName(url: string): string | null {
  const cleanUrl = url.split("?")[0].toLowerCase()
  for (const [key, name] of Object.entries(entityNames)) {
    if (cleanUrl.includes(`/${key}`)) {
      return name
    }
  }
  return null
}

// Get success message based on HTTP method
function getSuccessMessage(method: string, entityName: string | null): string | null {
  const name = entityName || "Kayıt"
  switch (method.toUpperCase()) {
    case "POST":
      return `${name} başarıyla oluşturuldu`
    case "PUT":
    case "PATCH":
      return `${name} başarıyla güncellendi`
    case "DELETE":
      return `${name} başarıyla silindi`
    default:
      return null
  }
}

function isSystemAdminEndpoint(url: string): boolean {
  const cleanUrl = url.split("?")[0].toLowerCase()
  return cleanUrl.startsWith("/admin/") ||
    cleanUrl.startsWith("admin/") ||
    cleanUrl.includes("/admin/") ||
    cleanUrl.startsWith("/subscription-plan") ||
    cleanUrl.startsWith("subscription-plan") ||
    cleanUrl.includes("/subscription-plan")
}

api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    const companyId = localStorage.getItem("companyId")
    if (companyId && !isSystemAdminEndpoint(config.url || "")) {
      config.headers["X-Company-ID"] = companyId
    }

    // DELETE isteklerinde kullanıcı onayı al
    if (config.method?.toUpperCase() === "DELETE") {
      const entityName = getEntityName(config.url || "")
      const confirmed = await confirmDelete(entityName)
      if (!confirmed) {
        throw new axios.Cancel("User cancelled delete")
      }
    }

    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response: AxiosResponse) => {
    const config = response.config as InternalAxiosRequestConfig
    const method = config.method?.toUpperCase()
    const url = config.url || ""

    // Show success toast for mutating operations
    if (method && ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      // Skip toast for certain endpoints (auth, refresh, etc.)
      const skipToastPatterns = ["/auth/", "/refresh", "/login", "/register", "/profile", "/select", "/get-for", "/availability"]
      const shouldSkip = skipToastPatterns.some(pattern => url.toLowerCase().includes(pattern))

      if (!shouldSkip) {
        const entityName = getEntityName(url)
        const message = getSuccessMessage(method, entityName)
        if (message) {
          toast.success(message)
        }
      }
    }

    return response
  },
  async (error) => {
    // Kullanıcı iptal ettiğinde sessizce geç
    if (axios.isCancel(error)) {
      return Promise.reject(error)
    }

    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshToken = localStorage.getItem("refreshToken")
      if (refreshToken) {
        try {
          const response = await axios.post(
            `${import.meta.env.VITE_API_URL}/auth/refresh-token`,
            { refreshToken }
          )

          const { token, refreshToken: newRefreshToken } = response.data
          localStorage.setItem("token", token)
          localStorage.setItem("refreshToken", newRefreshToken)

          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        } catch {
          localStorage.removeItem("token")
          localStorage.removeItem("refreshToken")
          window.location.href = "/login"
        }
      } else {
        window.location.href = "/login"
      }
    }

    // Handle 400 Bad Request errors
    if (error.response?.status === 400) {
      const errorData = error.response.data
      let message: string

      if (Array.isArray(errorData)) {
        // FluentValidation hata formatı: [{ code: "Field", messages: ["..."] }]
        // Tüm mesajları birleştirip toast'a tek mesaj olarak veriyoruz; field bazlı inline
        // gösterimi form tarafında yapılır.
        const messages = errorData
          .flatMap((e: { messages?: string[]; Messages?: string[] }) => e?.messages ?? e?.Messages ?? [])
          .filter(Boolean)
        message = messages.length > 0 ? messages.join("\n") : "Doğrulama hatası."
      } else {
        message = errorData?.message || errorData?.Message || "İşlem gerçekleştirilemedi."
      }

      toast.error(message)
    }

    // Handle 403 Forbidden — code'a göre özel durumlar
    if (error.response?.status === 403) {
      const errorData = error.response.data
      const code = errorData?.code || errorData?.Code
      if (code === "SubscriptionLimitExceeded") {
        toast.error(errorData.message, {
          description: `${errorData.limitType}: ${errorData.current}/${errorData.max} (Plan: ${errorData.planName})`,
          duration: 6000,
        })
      } else if (code === "NoActiveSubscription") {
        toast.error(errorData.message || "Aktif aboneliğiniz bulunmuyor.", {
          description: "Aboneliğinizi yenilemek için yöneticinizle iletişime geçin.",
          duration: 8000,
        })
      } else if (code === "CompanyDeactivated") {
        toast.error(errorData.message || "Şirketiniz pasif durumda.", {
          description: "Aboneliğinizi yenilemek için yöneticinizle iletişime geçin.",
          duration: 8000,
        })
      } else {
        const message = errorData?.message || errorData?.Message || "Bu işlem için yetkiniz yok."
        toast.error(message)
      }
    }

    // Handle 404 Not Found errors
    // GET isteklerinde 404 = "kayıt yok"; sayfanın empty state'i bunu zaten gösterir.
    // Toast SADECE yazma işlemlerinde (POST/PUT/PATCH/DELETE) anlamlı: kullanıcı
    // mevcut olmayan bir kaynağa işlem yapmaya çalışmıştır.
    if (error.response?.status === 404) {
      const method = (error.config?.method || "get").toLowerCase()
      const isWriteRequest = method !== "get"
      const errorData = error.response.data
      const code = errorData?.code || errorData?.Code
      const silentCodes = ["NoActiveSubscription"]
      if (isWriteRequest && !silentCodes.includes(code)) {
        const message = errorData?.message || errorData?.Message || "Kayıt bulunamadı."
        toast.error(message)
      }
    }

    // Handle 500 Server errors
    if (error.response?.status >= 500) {
      toast.error("Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.")
    }

    return Promise.reject(error)
  }
)

export default api
