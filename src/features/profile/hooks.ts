import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { profileApi } from "./api"
import type { ProfileUpdateRequest, ChangePasswordRequest } from "./api"
import { refreshUserProfile } from "@/hooks/use-refresh-profile"

export const profileKeys = {
  all: ["profile"] as const,
  detail: () => [...profileKeys.all, "detail"] as const,
}

export function useProfile() {
  return useQuery({
    queryKey: profileKeys.detail(),
    queryFn: () => profileApi.getProfile(),
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data, roleId }: { id: string; data: ProfileUpdateRequest; roleId: string }) =>
      profileApi.updateProfile(id, data, roleId),
    onSuccess: async () => {
      await refreshUserProfile()
      queryClient.invalidateQueries({ queryKey: profileKeys.all })
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => profileApi.changePassword(data),
  })
}
