import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  productApi,
  lookupApi,
  type ProductListParams,
  type ProductCreateRequest,
  type ProductUpdateRequest,
} from "./api"

// Query Keys
export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (params: ProductListParams) => [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  forEdit: (id: string) => [...productKeys.all, "forEdit", id] as const,
  select: () => [...productKeys.all, "select"] as const,
}

// Product Hooks
export function useProducts(params: ProductListParams = {}) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => productApi.getAll(params),
    staleTime: 0,
    gcTime: 0, // Cache'i devre dışı bırak - her seferinde yeni istek at
  })
}

export function useProductDetail(id: string | null) {
  return useQuery({
    queryKey: productKeys.detail(id!),
    queryFn: () => productApi.getDetail(id!),
    enabled: !!id,
  })
}

export function useProductForEdit(id: string) {
  return useQuery({
    queryKey: productKeys.forEdit(id),
    queryFn: () => productApi.getForEdit(id),
    enabled: !!id,
  })
}

export function useProductSelect() {
  return useQuery({
    queryKey: productKeys.select(),
    queryFn: () => productApi.getSelect(),
  })
}

export function useProductSelectForRental() {
  return useQuery({
    queryKey: [...productKeys.select(), "forRental"],
    queryFn: () => productApi.getSelectForRental(),
  })
}

export function useProductSelectWithType() {
  return useQuery({
    queryKey: [...productKeys.select(), "withType"],
    queryFn: () => productApi.getSelectWithType(),
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ProductCreateRequest) => productApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      queryClient.invalidateQueries({ queryKey: productKeys.select() })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductUpdateRequest }) =>
      productApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: productKeys.forEdit(variables.id) })
      queryClient.invalidateQueries({ queryKey: productKeys.select() })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => productApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      queryClient.invalidateQueries({ queryKey: productKeys.select() })
    },
  })
}

// Lookup Hooks
export function useCategorySelect() {
  return useQuery({
    queryKey: ["categories", "select"],
    queryFn: () => lookupApi.getCategories(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useUnitTypeSelect() {
  return useQuery({
    queryKey: ["unitTypes", "select"],
    queryFn: () => lookupApi.getUnitTypes(),
    staleTime: Infinity, // Static data
  })
}

export function usePricePeriodSelect() {
  return useQuery({
    queryKey: ["pricePeriods", "select"],
    queryFn: () => lookupApi.getPricePeriods(),
    staleTime: Infinity,
  })
}

export function useCurrencySelect() {
  return useQuery({
    queryKey: ["currencies", "select"],
    queryFn: () => lookupApi.getCurrencies(),
    staleTime: Infinity,
  })
}

export function useLifespanUnitTypeSelect() {
  return useQuery({
    queryKey: ["lifespanUnitTypes", "select"],
    queryFn: () => lookupApi.getLifespanUnitTypes(),
    staleTime: Infinity,
  })
}
