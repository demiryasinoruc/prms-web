import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { productRuleApi } from "./api"
import type { ProductRuleListParams, ProductRuleCreateRequest, ProductRuleUpdateRequest } from "./api"

export const productRuleKeys = {
  all: ["product-rules"] as const,
  lists: () => [...productRuleKeys.all, "list"] as const,
  list: (params: ProductRuleListParams) => [...productRuleKeys.lists(), params] as const,
  details: () => [...productRuleKeys.all, "detail"] as const,
  detail: (id: string) => [...productRuleKeys.details(), id] as const,
}

export function useProductRules(params: ProductRuleListParams = {}) {
  return useQuery({
    queryKey: productRuleKeys.list(params),
    queryFn: () => productRuleApi.getAll(params),
  })
}

// Tüm aktif kuralları getir (kiralama için)
export function useAllProductRules() {
  return useQuery({
    queryKey: productRuleKeys.lists(),
    queryFn: () => productRuleApi.getAll(),
    staleTime: 5 * 60 * 1000, // 5 dakika cache
  })
}

export function useProductRuleDetail(id: string | null) {
  return useQuery({
    queryKey: productRuleKeys.detail(id!),
    queryFn: () => productRuleApi.getDetail(id!),
    enabled: !!id,
  })
}

export function useCreateProductRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ProductRuleCreateRequest) => productRuleApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productRuleKeys.lists() })
      toast.success("Ürün kuralı başarıyla oluşturuldu")
    },
    onError: () => {
      toast.error("Ürün kuralı oluşturulurken bir hata oluştu")
    },
  })
}

export function useUpdateProductRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductRuleUpdateRequest }) =>
      productRuleApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productRuleKeys.lists() })
      queryClient.invalidateQueries({ queryKey: productRuleKeys.details() })
      toast.success("Ürün kuralı başarıyla güncellendi")
    },
    onError: () => {
      toast.error("Ürün kuralı güncellenirken bir hata oluştu")
    },
  })
}

export function useDeleteProductRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => productRuleApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productRuleKeys.lists() })
      toast.success("Ürün kuralı başarıyla silindi")
    },
    onError: () => {
      toast.error("Ürün kuralı silinirken bir hata oluştu")
    },
  })
}
