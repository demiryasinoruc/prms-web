import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { categoryApi, type CategoryListParams, type CategoryCreateRequest, type CategoryUpdateRequest } from "./api"

export function useCategories(params: CategoryListParams = {}) {
  return useQuery({
    queryKey: ["categories", params],
    queryFn: () => categoryApi.getAll(params),
    staleTime: 0,
    gcTime: 0,
  })
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: ["category", id],
    queryFn: () => categoryApi.getById(id),
    enabled: !!id,
  })
}

export function useCategoryForEdit(id: string) {
  return useQuery({
    queryKey: ["category", "edit", id],
    queryFn: () => categoryApi.getForEdit(id),
    enabled: !!id,
  })
}

export function useCategorySelectParent() {
  return useQuery({
    queryKey: ["categories", "select-parent"],
    queryFn: () => categoryApi.getSelectParent(),
  })
}

export function useCategorySelect() {
  return useQuery({
    queryKey: ["categories", "select"],
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
    queryKey: ["categories", "select-by-parent", parentId ?? "root"],
    queryFn: () => categoryApi.getSelectByParent(parentId),
    enabled: parentId !== "", // Boş string değilse sorgu yap (null veya undefined da dahil)
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CategoryCreateRequest) => categoryApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryUpdateRequest }) =>
      categoryApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      queryClient.invalidateQueries({ queryKey: ["category"] })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => categoryApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
    },
  })
}
