import api from "@/lib/axios"

export interface SubNavItem {
  name: string
  to: string
  icon: string
}

export interface NavigationItem {
  name: string
  icon: string
  to: string
  subActivePaths: string
  sub: SubNavItem[] | null
}

export const navigationApi = {
  getNavigation: async (): Promise<NavigationItem[]> => {
    const response = await api.get<NavigationItem[]>("/navigation")
    return response.data
  },
}
