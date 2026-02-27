import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  categoryAttributeApi,
  type CategoryAttributeListParams,
  type CategoryAttributeCreateRequest,
  type CategoryAttributeUpdateRequest,
} from "./api"

export const categoryAttributeKeys = {
  all: ["categoryAttributes"] as const,
  lists: () => [...categoryAttributeKeys.all, "list"] as const,
  list: (params: CategoryAttributeListParams) =>
    [...categoryAttributeKeys.lists(), params] as const,
  details: () => [...categoryAttributeKeys.all, "detail"] as const,
  detail: (id: string) => [...categoryAttributeKeys.details(), id] as const,
  forEdit: (id: string) => [...categoryAttributeKeys.all, "forEdit", id] as const,
  byCategory: (categoryId: string) =>
    [...categoryAttributeKeys.all, "byCategory", categoryId] as const,
}

export function useCategoryAttributes(
  params: CategoryAttributeListParams = {}
) {
  return useQuery({
    queryKey: categoryAttributeKeys.list(params),
    queryFn: () => categoryAttributeApi.getAll(params),
    staleTime: 0,
    gcTime: 0,
  })
}

export function useCategoryAttributeForEdit(id: string | null) {
  return useQuery({
    queryKey: categoryAttributeKeys.forEdit(id || ""),
    queryFn: () => categoryAttributeApi.getForEdit(id!),
    enabled: !!id,
  })
}

export function useCategoryAttributesByCategory(categoryId: string | null) {
  return useQuery({
    queryKey: categoryAttributeKeys.byCategory(categoryId || ""),
    queryFn: () => categoryAttributeApi.getByCategory(categoryId!),
    enabled: !!categoryId,
  })
}

export function useCreateCategoryAttribute() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CategoryAttributeCreateRequest) =>
      categoryAttributeApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryAttributeKeys.all })
    },
  })
}

export function useUpdateCategoryAttribute() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: CategoryAttributeUpdateRequest
    }) => categoryAttributeApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryAttributeKeys.all })
    },
  })
}

export function useDeleteCategoryAttribute() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => categoryAttributeApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryAttributeKeys.all })
    },
  })
}
