import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { attachmentApi, type AttachmentEntityType } from "./api"

export const attachmentKeys = {
  all: ["attachments"] as const,
  forEntity: (entityType: AttachmentEntityType, entityId: string) =>
    [...attachmentKeys.all, entityType, entityId] as const,
}

export function useAttachments(
  entityType: AttachmentEntityType,
  entityId: string | undefined,
) {
  return useQuery({
    queryKey: attachmentKeys.forEntity(entityType, entityId ?? ""),
    queryFn: () => attachmentApi.list(entityType, entityId as string),
    enabled: !!entityId,
  })
}

export function useUploadAttachment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: attachmentApi.upload,
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: attachmentKeys.forEntity(vars.entityType, vars.entityId),
      })
    },
  })
}

export function useDeleteAttachment(
  entityType: AttachmentEntityType,
  entityId: string,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => attachmentApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: attachmentKeys.forEntity(entityType, entityId),
      })
    },
  })
}
