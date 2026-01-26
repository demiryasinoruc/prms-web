import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { roleApi, type RoleListParams, type RoleCreateRequest, type RoleUpdateRequest } from "./api"
import { refreshUserProfile } from "@/hooks/use-refresh-profile"

export const roleKeys = {
  all: ["roles"] as const,
  lists: () => [...roleKeys.all, "list"] as const,
  list: (params: RoleListParams) => [...roleKeys.lists(), params] as const,
  details: () => [...roleKeys.all, "detail"] as const,
  detail: (id: string) => [...roleKeys.details(), id] as const,
  forEdit: (id: string) => [...roleKeys.all, "forEdit", id] as const,
  forCreate: () => [...roleKeys.all, "forCreate"] as const,
  select: () => [...roleKeys.all, "select"] as const,
}

export function useRoles(params: RoleListParams = {}) {
  return useQuery({
    queryKey: roleKeys.list(params),
    queryFn: () => roleApi.getAll(params),
    staleTime: 0,
    gcTime: 0,
  })
}

export function useRoleForEdit(id: string) {
  return useQuery({
    queryKey: roleKeys.forEdit(id),
    queryFn: () => roleApi.getForEdit(id),
    enabled: !!id,
  })
}

export function useRoleForCreate() {
  return useQuery({
    queryKey: roleKeys.forCreate(),
    queryFn: () => roleApi.getForCreate(),
  })
}

export function useRoleSelect() {
  return useQuery({
    queryKey: roleKeys.select(),
    queryFn: () => roleApi.getSelect(),
  })
}

export function useCreateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: RoleCreateRequest) => roleApi.create(data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() })
      queryClient.invalidateQueries({ queryKey: roleKeys.select() })
      // Kullanıcının kendi rolü değişmiş olabilir, profili yenile
      await refreshUserProfile()
    },
  })
}

export function useUpdateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RoleUpdateRequest }) =>
      roleApi.update(id, data),
    onSuccess: async (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() })
      queryClient.invalidateQueries({ queryKey: roleKeys.select() })
      queryClient.invalidateQueries({ queryKey: roleKeys.forEdit(variables.id) })
      // Kullanıcının kendi rolü değişmiş olabilir, profili yenile
      await refreshUserProfile()
    },
  })
}

export function useDeleteRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => roleApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() })
      queryClient.invalidateQueries({ queryKey: roleKeys.select() })
    },
  })
}
