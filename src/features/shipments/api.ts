import api from "@/lib/axios"
// ShipmentFulfillmentType Faz 5'te rentals modülüne eklenmişti — duplike etme, oradan re-export et.
import { ShipmentFulfillmentType } from "@/features/rentals/api"

export { ShipmentFulfillmentType }

// Sevkiyat durumu (backend ShipmentStatus ile birebir)
export enum ShipmentStatus {
  Planned = 1, // Planlı
  Dispatched = 2, // Yola Çıktı
  Delivered = 3, // Teslim Edildi
  Cancelled = 4, // İptal
}

export const ShipmentStatusLabels: Record<ShipmentStatus, string> = {
  [ShipmentStatus.Planned]: "Planlı",
  [ShipmentStatus.Dispatched]: "Yola Çıktı",
  [ShipmentStatus.Delivered]: "Teslim Edildi",
  [ShipmentStatus.Cancelled]: "İptal",
}

// Durum badge renkleri: Planlı=amber, Yola Çıktı=sky, Teslim Edildi=emerald, İptal=zinc
export const ShipmentStatusClass: Record<ShipmentStatus, string> = {
  [ShipmentStatus.Planned]:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  [ShipmentStatus.Dispatched]:
    "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
  [ShipmentStatus.Delivered]:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  [ShipmentStatus.Cancelled]:
    "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
}

export const ShipmentFulfillmentTypeLabels: Record<ShipmentFulfillmentType, string> = {
  [ShipmentFulfillmentType.WarehouseDispatch]: "Depodan Gönderim",
  [ShipmentFulfillmentType.PickupEnRoute]: "Nakliyatta Alınacak",
}

// Types - List Response
export interface RentalShipment {
  id: string
  shipmentNumber: string
  rentalNumber: string
  sourceWarehouseName: string
  fulfillmentType: ShipmentFulfillmentType
  status: ShipmentStatus
  plannedDate: string
  vehicleName: string | null
  employeeName: string | null
  itemCount: number
}

// Types - Detail Response
export interface RentalShipmentItem {
  id: string
  productName: string
  // Backend RentalShipmentItemDetailDTO.ProductVariantSku döndürür (varyant etiketi = SKU).
  productVariantSku: string | null
  serialNumber: string | null
  quantity: number
}

export interface RentalShipmentDetail {
  id: string
  shipmentNumber: string
  rentalNumber: string
  sourceWarehouseId: string
  sourceWarehouseName: string
  fulfillmentType: ShipmentFulfillmentType
  status: ShipmentStatus
  plannedDate: string
  vehicleId: string | null
  vehicleName: string | null
  employeeId: string | null
  employeeName: string | null
  dispatchedDate: string | null
  deliveredDate: string | null
  cancelledDate: string | null
  notes: string
  items: RentalShipmentItem[]
}

// ForEdit Types (yalnızca Planlı)
export interface RentalShipmentForEdit {
  id: string
  vehicleId: string | null
  employeeId: string | null
  plannedDate: string
  notes: string
}

// Request Types
export interface RentalShipmentListParams {
  pageNumber?: number
  pageSize?: number
  searchTerm?: string
  status?: ShipmentStatus
  sourceWarehouseId?: string
  fulfillmentType?: ShipmentFulfillmentType
  sortBy?: string
  sortDir?: "asc" | "desc"
}

export interface PaginatedRentalShipmentResponse {
  items: RentalShipment[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface RentalShipmentUpdateRequest {
  vehicleId?: string | null
  employeeId?: string | null
  plannedDate: string
  notes: string
}

// Backend list response zarfı (rental/inventory/warehouse-transfer ile aynı)
interface ApiRentalShipmentListResponse {
  totalCount: number
  currentPage: number
  pageSize: number
  pageCount: number
  data: RentalShipment[]
}

// API Functions
export const rentalShipmentApi = {
  getAll: async (
    params: RentalShipmentListParams = {},
  ): Promise<PaginatedRentalShipmentResponse> => {
    const response = await api.get<ApiRentalShipmentListResponse>("/rental-shipment", {
      params: {
        "Pagination.Page": params.pageNumber || 1,
        "Pagination.PageSize": params.pageSize || 10,
        "Searching.Search": params.searchTerm || undefined,
        "Filters.Status": params.status || undefined,
        "Filters.SourceWarehouseId": params.sourceWarehouseId || undefined,
        "Filters.FulfillmentType": params.fulfillmentType || undefined,
        "Sorting.SortBy": params.sortBy || undefined,
        "Sorting.SortDir": params.sortDir || undefined,
      },
    })

    const apiData = response.data
    return {
      items: apiData.data,
      totalCount: apiData.totalCount,
      pageNumber: apiData.currentPage,
      pageSize: apiData.pageSize,
      totalPages: apiData.pageCount,
      hasPreviousPage: apiData.currentPage > 1,
      hasNextPage: apiData.currentPage < apiData.pageCount,
    }
  },

  getDetail: async (id: string) => {
    const response = await api.get<RentalShipmentDetail>(`/rental-shipment/${id}`)
    return response.data
  },

  getForEdit: async (id: string) => {
    const response = await api.get<RentalShipmentForEdit>(
      `/rental-shipment/get-for-edit/${id}`,
    )
    return response.data
  },

  update: async (id: string, data: RentalShipmentUpdateRequest) => {
    await api.put(`/rental-shipment/${id}`, {
      VehicleId: data.vehicleId || null,
      EmployeeId: data.employeeId || null,
      PlannedDate: data.plannedDate,
      Notes: data.notes || "",
    })
  },

  dispatch: async (id: string) => {
    await api.post(`/rental-shipment/${id}/dispatch`)
  },

  deliver: async (id: string) => {
    await api.post(`/rental-shipment/${id}/deliver`)
  },

  cancel: async (id: string) => {
    await api.post(`/rental-shipment/${id}/cancel`)
  },

  delete: async (id: string) => {
    await api.delete(`/rental-shipment/${id}`)
  },
}
