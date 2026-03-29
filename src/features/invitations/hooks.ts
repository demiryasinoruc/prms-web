import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { invitationApi, type InvitationListParams } from "./api"

export const invitationKeys = {
  all: ["invitations"] as const,
  lists: () => [...invitationKeys.all, "list"] as const,
  list: (params: InvitationListParams) => [...invitationKeys.lists(), params] as const,
}

export function useInvitations(params: InvitationListParams = {}) {
  return useQuery({
    queryKey: invitationKeys.list(params),
    queryFn: () => invitationApi.getAll(params),
    staleTime: 0,
    gcTime: 0,
  })
}

export function useCreateInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: invitationApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.lists() })
    },
  })
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => invitationApi.revoke(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.lists() })
    },
  })
}
