import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  rentalApi,
  type RentalListParams,
  type RentalCreateRequest,
  type RentalUpdateRequest,
  type RentalUpdateStatusRequest,
  type RentalPaymentRequest,
  type RentalItemReturnRequest,
} from "./api"

// Query Keys
export const rentalKeys = {
  all: ["rentals"] as const,
  lists: () => [...rentalKeys.all, "list"] as const,
  list: (params: RentalListParams) => [...rentalKeys.lists(), params] as const,
  details: () => [...rentalKeys.all, "detail"] as const,
  detail: (id: string) => [...rentalKeys.details(), id] as const,
  forEdit: (id: string) => [...rentalKeys.all, "forEdit", id] as const,
  warehouseStock: (
    productId: string,
    productVariantId: string | null | undefined,
    start: string,
    end: string,
  ) =>
    [...rentalKeys.all, "warehouseStock", productId, productVariantId ?? null, start, end] as const,
}

// Bir ürünün depolardaki müsait stoğu (kalem başına depo seçimi için).
// productId + tarihler varsa etkin; tarihler değişince queryKey değiştiğinden yeniden çekilir.
export function useProductWarehouseStock(
  productId: string | null | undefined,
  productVariantId: string | null | undefined,
  start: string | null | undefined,
  end: string | null | undefined,
) {
  return useQuery({
    queryKey: rentalKeys.warehouseStock(productId || "", productVariantId, start || "", end || ""),
    queryFn: () =>
      rentalApi.getWarehouseStock(productId!, productVariantId, start!, end!),
    enabled: !!productId && !!start && !!end,
  })
}

// Query Hooks
export function useRentals(params: RentalListParams = {}) {
  return useQuery({
    queryKey: rentalKeys.list(params),
    queryFn: () => rentalApi.getAll(params),
    staleTime: 0,
    gcTime: 0,
  })
}

export function useRentalDetail(id: string | null) {
  return useQuery({
    queryKey: rentalKeys.detail(id!),
    queryFn: () => rentalApi.getDetail(id!),
    enabled: !!id,
  })
}

export function useRentalForEdit(id: string | null) {
  return useQuery({
    queryKey: rentalKeys.forEdit(id!),
    queryFn: () => rentalApi.getForEdit(id!),
    enabled: !!id,
  })
}

// Çakışma satırı format'lar — 3 senaryo:
// - serialNumber varsa: tracked envanter (ürün + seri no)
// - quantity'ler varsa: countable/consumable ürün (X talep, Y müsait)
// - ikisi de null: araç/personel çakışması (productName zaten "Teslimat: ..." formatında)
function formatWarning(w: import("./api").AvailabilityWarning): string {
  if (w.serialNumber) {
    return `• ${w.productName} (${w.serialNumber}) — ${w.rentalNumber} ile çakışıyor (${formatRange(w.startDate, w.endDate)})`
  }
  if (w.requestedQuantity != null && w.availableQuantity != null) {
    return `• ${w.productName} — ${w.requestedQuantity} talep, ${w.availableQuantity} müsait`
  }
  return `• ${w.productName} — ${w.rentalNumber} ile çakışıyor (${formatRange(w.startDate, w.endDate)})`
}

function formatRange(start: string, end: string): string {
  const opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit", year: "numeric" }
  const s = new Date(start)
  const e = new Date(end)
  const sStr = s.toLocaleDateString("tr-TR", opts)
  const eStr = e.toLocaleDateString("tr-TR", opts)
  return sStr === eStr ? sStr : `${sStr} – ${eStr}`
}

// Mutation Hooks
export function useCreateRental() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: RentalCreateRequest) => rentalApi.create(data),
    onSuccess: (data) => {
      if (data.warnings?.length) {
        // Çakışma uyarılarını tek persistent toast'a topluyoruz; warn modunda
        // kullanıcının gözden kaçırmaması kritik. Auto-dismiss yok, kullanıcı
        // kapatana kadar kalır.
        const lines = data.warnings.map(formatWarning)
        toast.warning(
          `Kiralama oluşturuldu ancak ${data.warnings.length} çakışma tespit edildi`,
          {
            description: lines.join("\n"),
            duration: Infinity,
            closeButton: true,
          },
        )
      }
      queryClient.invalidateQueries({ queryKey: rentalKeys.lists() })
    },
  })
}

export function useUpdateRental() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RentalUpdateRequest }) =>
      rentalApi.update(id, data),
    onSuccess: (data, variables) => {
      if (data?.warnings?.length) {
        const lines = data.warnings.map(formatWarning)
        toast.warning(
          `Kiralama güncellendi ancak ${data.warnings.length} çakışma tespit edildi`,
          {
            description: lines.join("\n"),
            duration: Infinity,
            closeButton: true,
          },
        )
      }
      queryClient.invalidateQueries({ queryKey: rentalKeys.lists() })
      queryClient.invalidateQueries({ queryKey: rentalKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: rentalKeys.forEdit(variables.id) })
    },
  })
}

export function useUpdateRentalStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RentalUpdateStatusRequest }) =>
      rentalApi.updateStatus(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: rentalKeys.lists() })
      queryClient.invalidateQueries({ queryKey: rentalKeys.detail(variables.id) })
    },
  })
}

export function useCancelRental() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => rentalApi.cancel(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: rentalKeys.lists() })
      queryClient.invalidateQueries({ queryKey: rentalKeys.detail(id) })
    },
  })
}

export function useAddRentalPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RentalPaymentRequest }) =>
      rentalApi.addPayment(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: rentalKeys.detail(variables.id) })
    },
  })
}

export function useReturnRentalItems() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, items }: { id: string; items: RentalItemReturnRequest[] }) =>
      rentalApi.returnItems(id, items),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: rentalKeys.lists() })
      queryClient.invalidateQueries({ queryKey: rentalKeys.detail(variables.id) })
    },
  })
}

export function useDeleteRental() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => rentalApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rentalKeys.lists() })
    },
  })
}
