import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User, Company } from "@/types/api"

export const SYSTEM_ADMIN_USER_TYPE = 1

interface AuthState {
  user: User | null
  userType: number | null
  token: string | null
  refreshToken: string | null
  company: Company | null
  /**
   * Sysadmin impersonation: bir şirketi "olarak gör" moduna girdiğinde,
   * o şirketin temel bilgisi burada tutulur. UI banner'ı bu alana bakar.
   * Normal kullanıcılarda asla doldurulmaz.
   */
  impersonatedCompany: { id: string; name: string } | null
  permissions: string[]
  isAuthenticated: boolean
  setAuth: (user: User, token: string, refreshToken: string, userType: number) => void
  setCompany: (company: Company) => void
  setPermissions: (permissions: string[]) => void
  hasPermission: (permissionKey: string) => boolean
  hasAnyPermission: (permissionKeys: string[]) => boolean
  isSystemAdmin: () => boolean
  /** Sysadmin için: belirli bir şirketi "olarak gör" moduna geç. */
  impersonate: (company: { id: string; name: string }) => void
  /** Impersonation modundan çık — companyId localStorage'tan temizlenir. */
  exitImpersonation: () => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      userType: null,
      token: null,
      refreshToken: null,
      company: null,
      impersonatedCompany: null,
      permissions: [],
      isAuthenticated: false,
      setAuth: (user, token, refreshToken, userType) => {
        localStorage.setItem("token", token)
        localStorage.setItem("refreshToken", refreshToken)
        set({ user, token, refreshToken, userType, isAuthenticated: true })
      },
      setCompany: (company) => {
        localStorage.setItem("companyId", company.id)
        set({ company })
      },
      setPermissions: (permissions) => {
        set({ permissions })
      },
      hasPermission: (permissionId) => {
        // Sysadmin impersonation modunda her şey serbest — denetim/destek için.
        if (get().userType === SYSTEM_ADMIN_USER_TYPE && get().impersonatedCompany) {
          return true
        }
        return get().permissions.includes(permissionId)
      },
      hasAnyPermission: (permissionIds) => {
        if (get().userType === SYSTEM_ADMIN_USER_TYPE && get().impersonatedCompany) {
          return true
        }
        const perms = get().permissions
        return permissionIds.some(id => perms.includes(id))
      },
      isSystemAdmin: () => get().userType === SYSTEM_ADMIN_USER_TYPE,
      impersonate: (company) => {
        // sysadmin değilse çağrılmamalı — guard
        if (get().userType !== SYSTEM_ADMIN_USER_TYPE) return
        localStorage.setItem("companyId", company.id)
        set({ impersonatedCompany: company })
      },
      exitImpersonation: () => {
        localStorage.removeItem("companyId")
        set({ impersonatedCompany: null })
      },
      logout: () => {
        localStorage.removeItem("token")
        localStorage.removeItem("refreshToken")
        localStorage.removeItem("companyId")
        set({ user: null, userType: null, token: null, refreshToken: null, company: null, impersonatedCompany: null, permissions: [], isAuthenticated: false })
      },
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        userType: state.userType,
        token: state.token,
        refreshToken: state.refreshToken,
        company: state.company,
        impersonatedCompany: state.impersonatedCompany,
        permissions: state.permissions,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
