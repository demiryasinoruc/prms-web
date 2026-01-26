import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from "axios"
import { toast } from "sonner"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// URL pattern to Turkish entity name mapping
const entityNames: Record<string, string> = {
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

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    const companyId = localStorage.getItem("companyId")
    if (companyId) {
      config.headers["X-Company-ID"] = companyId
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
      const skipToastPatterns = ["/auth/", "/refresh", "/login", "/register", "/profile", "/select", "/get-for"]
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
      const message = errorData?.message || errorData?.Message || "İşlem gerçekleştirilemedi."
      toast.error(message)
    }

    // Handle 404 Not Found errors
    if (error.response?.status === 404) {
      const errorData = error.response.data
      const message = errorData?.message || errorData?.Message || "Kayıt bulunamadı."
      toast.error(message)
    }

    // Handle 500 Server errors
    if (error.response?.status >= 500) {
      toast.error("Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.")
    }

    return Promise.reject(error)
  }
)

export default api
