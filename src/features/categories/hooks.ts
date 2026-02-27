import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { categoryApi, type CategoryListParams, type CategoryCreateRequest, type CategoryUpdateRequest } from "./api"

export const categoryKeys = {
  all: ["categories"] as const,
  lists: () => [...categoryKeys.all, "list"] as const,
  list: (params: CategoryListParams) => [...categoryKeys.lists(), params] as const,
  details: () => [...categoryKeys.all, "detail"] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
  select: () => [...categoryKeys.all, "select"] as const,
  selectParent: () => [...categoryKeys.all, "select-parent"] as const,
  selectByParent: (parentId: string | null | undefined) => [...categoryKeys.all, "select-by-parent", parentId ?? "root"] as const,
  forEdit: (id: string) => [...categoryKeys.all, "forEdit", id] as const,
}

export function useCategories(params: CategoryListParams = {}) {
  return useQuery({
    queryKey: categoryKeys.list(params),
    queryFn: () => categoryApi.getAll(params),
    staleTime: 0,
    gcTime: 0,
  })
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: () => categoryApi.getById(id),
    enabled: !!id,
  })
}

export function useCategoryForEdit(id: string) {
  return useQuery({
    queryKey: categoryKeys.forEdit(id),
    queryFn: () => categoryApi.getForEdit(id),
    enabled: !!id,
  })
}

export function useCategorySelectParent() {
  return useQuery({
    queryKey: categoryKeys.selectParent(),
    queryFn: () => categoryApi.getSelectParent(),
  })
}

export function useCategorySelect() {
  return useQuery({
    queryKey: categoryKeys.select(),
    queryFn: () => categoryApi.getSelect(),
  })
}

/**
 * Belirtilen parent altındaki kategorileri getirir.
 * parentId undefined/null ise root kategorileri (1. seviye) getirir.
 * parentId boş string ("") ise sorgu yapılmaz.
 */
export function useCategorySelectByParent(parentId: string | null | undefined) {
  return useQuery({
    queryKey: categoryKeys.selectByParent(parentId),
    queryFn: () => categoryApi.getSelectByParent(parentId),
    enabled: parentId !== "",
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CategoryCreateRequest) => categoryApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: categoryKeys.select() })
      queryClient.invalidateQueries({ queryKey: categoryKeys.selectParent() })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryUpdateRequest }) =>
      categoryApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: categoryKeys.details() })
      queryClient.invalidateQueries({ queryKey: categoryKeys.forEdit(variables.id) })
      queryClient.invalidateQueries({ queryKey: categoryKeys.select() })
      queryClient.invalidateQueries({ queryKey: categoryKeys.selectParent() })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => categoryApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: categoryKeys.select() })
      queryClient.invalidateQueries({ queryKey: categoryKeys.selectParent() })
    },
  })
}
