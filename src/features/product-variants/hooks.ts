import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { productVariantApi } from "./api"
import type {
  ProductVariantCreateRequest,
  ProductVariantUpdateRequest,
  ProductVariantBulkGenerateRequest,
} from "./api"
export const productVariantKeys = {
  all: ["product-variants"] as const,
  byProduct: (productId: string) => [...productVariantKeys.all, "by-product", productId] as const,
  forEdit: (id: string) => [...productVariantKeys.all, "for-edit", id] as const,
  select: (productId: string) => [...productVariantKeys.all, "select", productId] as const,
}

export function useProductVariants(productId: string) {
  return useQuery({
    queryKey: productVariantKeys.byProduct(productId),
    queryFn: () => productVariantApi.getByProduct(productId),
    enabled: !!productId,
    staleTime: 0,
    gcTime: 0,
  })
}

export function useProductVariantForEdit(id: string) {
  return useQuery({
    queryKey: productVariantKeys.forEdit(id),
    queryFn: () => productVariantApi.getForEdit(id),
    enabled: !!id,
  })
}

export function useProductVariantSelect(productId: string) {
  return useQuery({
    queryKey: productVariantKeys.select(productId),
    queryFn: () => productVariantApi.getSelect(productId),
    enabled: !!productId,
  })
}

export function useCreateProductVariant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ProductVariantCreateRequest) => productVariantApi.create(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: productVariantKeys.byProduct(variables.productId) })
      queryClient.invalidateQueries({ queryKey: productVariantKeys.select(variables.productId) })
    },
  })
}

export function useUpdateProductVariant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductVariantUpdateRequest }) =>
      productVariantApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productVariantKeys.all })
    },
  })
}

export function useBulkGenerateProductVariants() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ProductVariantBulkGenerateRequest) => productVariantApi.bulkGenerate(data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: productVariantKeys.byProduct(variables.productId) })
      queryClient.invalidateQueries({ queryKey: productVariantKeys.select(variables.productId) })
    },
  })
}

export function useDeleteProductVariant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => productVariantApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productVariantKeys.all })
    },
  })
}
