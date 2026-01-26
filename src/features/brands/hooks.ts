import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { brandApi, type BrandListParams, type BrandCreateRequest, type BrandUpdateRequest } from "./api"

export function useBrands(params: BrandListParams = {}) {
  return useQuery({
    queryKey: ["brands", params],
    queryFn: () => brandApi.getAll(params),
    staleTime: 0,
    gcTime: 0,
  })
}

export function useBrand(id: string) {
  return useQuery({
    queryKey: ["brand", id],
    queryFn: () => brandApi.getById(id),
    enabled: !!id,
  })
}

export function useBrandForEdit(id: string) {
  return useQuery({
    queryKey: ["brand", "edit", id],
    queryFn: () => brandApi.getForEdit(id),
    enabled: !!id,
  })
}

export function useBrandSelect() {
  return useQuery({
    queryKey: ["brands", "select"],
    queryFn: () => brandApi.getSelect(),
  })
}

export function useCreateBrand() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BrandCreateRequest) => brandApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] })
    },
  })
}

export function useUpdateBrand() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BrandUpdateRequest }) =>
      brandApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] })
      queryClient.invalidateQueries({ queryKey: ["brand"] })
    },
  })
}

export function useDeleteBrand() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => brandApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] })
    },
  })
}
