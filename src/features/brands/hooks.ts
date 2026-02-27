import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { brandApi, type BrandListParams, type BrandCreateRequest, type BrandUpdateRequest } from "./api"

export const brandKeys = {
  all: ["brands"] as const,
  lists: () => [...brandKeys.all, "list"] as const,
  list: (params: BrandListParams) => [...brandKeys.lists(), params] as const,
  details: () => [...brandKeys.all, "detail"] as const,
  detail: (id: string) => [...brandKeys.details(), id] as const,
  select: () => [...brandKeys.all, "select"] as const,
  forEdit: (id: string) => [...brandKeys.all, "forEdit", id] as const,
}

export function useBrands(params: BrandListParams = {}) {
  return useQuery({
    queryKey: brandKeys.list(params),
    queryFn: () => brandApi.getAll(params),
    staleTime: 0,
    gcTime: 0,
  })
}

export function useBrand(id: string) {
  return useQuery({
    queryKey: brandKeys.detail(id),
    queryFn: () => brandApi.getById(id),
    enabled: !!id,
  })
}

export function useBrandForEdit(id: string) {
  return useQuery({
    queryKey: brandKeys.forEdit(id),
    queryFn: () => brandApi.getForEdit(id),
    enabled: !!id,
  })
}

export function useBrandSelect() {
  return useQuery({
    queryKey: brandKeys.select(),
    queryFn: () => brandApi.getSelect(),
  })
}

export function useCreateBrand() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BrandCreateRequest) => brandApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandKeys.lists() })
      queryClient.invalidateQueries({ queryKey: brandKeys.select() })
    },
  })
}

export function useUpdateBrand() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BrandUpdateRequest }) =>
      brandApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: brandKeys.lists() })
      queryClient.invalidateQueries({ queryKey: brandKeys.details() })
      queryClient.invalidateQueries({ queryKey: brandKeys.forEdit(variables.id) })
      queryClient.invalidateQueries({ queryKey: brandKeys.select() })
    },
  })
}

export function useDeleteBrand() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => brandApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandKeys.lists() })
      queryClient.invalidateQueries({ queryKey: brandKeys.select() })
    },
  })
}
