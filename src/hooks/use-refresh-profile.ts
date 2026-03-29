import { useEffect, useState, useRef } from "react"
import { useAuthStore } from "@/stores/auth"
import api from "@/lib/axios"

interface ProfileResponse {
  id: string
  name: string
  surname: string
  email: string
  roleId: string | null
  roleName: string | null
  permissions: string[]
}

interface CompanyResponse {
  id: string
  name: string
}

/**
 * Imperative function to refresh user profile and permissions.
 * Can be called from anywhere (e.g., after role updates).
 */
export async function refreshUserProfile(): Promise<void> {
  const { token, refreshToken, setAuth, setCompany, setPermissions } = useAuthStore.getState()

  if (!token) return

  try {
    const [profileResponse, companyResponse] = await Promise.all([
      api.get<ProfileResponse>("/user/profile"),
      api.get<CompanyResponse>("/company/get-company-by-user"),
    ])

    const profile = profileResponse.data
    const company = companyResponse.data

    setAuth(
      {
        id: profile.id,
        name: profile.name,
        surname: profile.surname,
        email: profile.email,
        companyId: company.id,
        companyName: company.name,
        roleId: profile.roleId || "",
        roleName: profile.roleName || "",
      },
      token,
      refreshToken || ""
    )
    setCompany({
      id: company.id,
      name: company.name,
      email: "",
      isActive: true,
    })
    setPermissions(profile.permissions)
  } catch {
    // Silently fail - don't logout on refresh failure
    console.error("Failed to refresh user profile")
  }
}

export function useRefreshProfile() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { token, setAuth, setCompany, setPermissions, logout, refreshToken } = useAuthStore()

  // Prevent double fetch in StrictMode
  const hasFetched = useRef(false)

  useEffect(() => {
    // Skip if already fetched (StrictMode protection)
    if (hasFetched.current) {
      return
    }
    hasFetched.current = true

    const refreshProfile = async () => {
      // No token means not authenticated
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        // Fetch profile and company in parallel
        const [profileResponse, companyResponse] = await Promise.all([
          api.get<ProfileResponse>("/user/profile"),
          api.get<CompanyResponse>("/company/get-company-by-user"),
        ])

        const profile = profileResponse.data
        const company = companyResponse.data

        // Update auth state with fresh data
        setAuth(
          {
            id: profile.id,
            name: profile.name,
            surname: profile.surname,
            email: profile.email,
            companyId: company.id,
            companyName: company.name,
            roleId: profile.roleId || "",
            roleName: profile.roleName || "",
          },
          token,
          refreshToken || ""
        )
        setCompany({
          id: company.id,
          name: company.name,
          email: "",
          isActive: true,
        })
        setPermissions(profile.permissions)

        setError(null)
      } catch {
        // Token might be expired or invalid
        logout()
        setError("Oturum süresi doldu. Lütfen tekrar giriş yapın.")
      } finally {
        setIsLoading(false)
      }
    }

    refreshProfile()
  }, []) // Only run once on mount

  return { isLoading, error }
}
