import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { useDebounce } from "@/hooks/use-debounce"
import { availabilityApi, type BatchAvailabilityRequest } from "./api"

// Query Keys
export const availabilityKeys = {
  all: ["availability"] as const,
  batch: (request: BatchAvailabilityRequest | null) =>
    [...availabilityKeys.all, "batch", request] as const,
}

/**
 * Tarih/miktar/kaynak değişiminde 500ms debounce sonrası backend'e
 * batch availability isteği atar. En az bir kategori (items, vehicles,
 * employees) dolu olmalı, aksi halde istek atılmaz.
 *
 * Loading sırasında eski sonuçlar `placeholderData` ile gösterilir.
 */
export function useAvailabilityBatch(
  request: BatchAvailabilityRequest | null,
  enabled = true
) {
  const debounced = useDebounce(request, 500)

  return useQuery({
    queryKey: availabilityKeys.batch(debounced),
    queryFn: () => availabilityApi.checkBatch(debounced!),
    enabled:
      enabled &&
      !!debounced &&
      (debounced.items.length > 0 ||
        debounced.vehicles.length > 0 ||
        debounced.employees.length > 0),
    staleTime: 0,
    gcTime: 0,
    placeholderData: keepPreviousData,
  })
}
