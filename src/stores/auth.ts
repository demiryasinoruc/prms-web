import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User, Company } from "@/types/api"

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  company: Company | null
  permissions: string[]
  isAuthenticated: boolean
  setAuth: (user: User, token: string, refreshToken: string) => void
  setCompany: (company: Company) => void
  setPermissions: (permissions: string[]) => void
  hasPermission: (permissionKey: string) => boolean
  hasAnyPermission: (permissionKeys: string[]) => boolean
  logout: () => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      company: null,
      permissions: [],
      isAuthenticated: false,
      setAuth: (user, token, refreshToken) => {
        localStorage.setItem("token", token)
        localStorage.setItem("refreshToken", refreshToken)
        set({ user, token, refreshToken, isAuthenticated: true })
      },
      setCompany: (company) => {
        localStorage.setItem("companyId", company.id)
        set({ company })
      },
      setPermissions: (permissions) => {
        set({ permissions })
      },
      hasPermission: (permissionId) => {
        return get().permissions.includes(permissionId)
      },
      hasAnyPermission: (permissionIds) => {
        const perms = get().permissions
        return permissionIds.some(id => perms.includes(id))
      },
      logout: () => {
        localStorage.removeItem("token")
        localStorage.removeItem("refreshToken")
        localStorage.removeItem("companyId")
        set({ user: null, token: null, refreshToken: null, company: null, permissions: [], isAuthenticated: false })
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
        token: state.token,
        refreshToken: state.refreshToken,
        company: state.company,
        permissions: state.permissions,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
