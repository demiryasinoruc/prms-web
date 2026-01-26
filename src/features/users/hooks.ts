import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { userApi, type UserListParams, type UserUpdateRequest } from "./api"

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (params: UserListParams) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  forEdit: (id: string) => [...userKeys.all, "forEdit", id] as const,
}

export function useUsers(params: UserListParams = {}) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => userApi.getAll(params),
    staleTime: 0,
    gcTime: 0,
  })
}

export function useUserDetail(id: string | null) {
  return useQuery({
    queryKey: userKeys.detail(id!),
    queryFn: () => userApi.getDetail(id!),
    enabled: !!id,
  })
}

export function useUserForEdit(id: string | null) {
  return useQuery({
    queryKey: userKeys.forEdit(id!),
    queryFn: () => userApi.getForEdit(id!),
    enabled: !!id,
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserUpdateRequest }) =>
      userApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: userKeys.forEdit(variables.id) })
    },
  })
}
