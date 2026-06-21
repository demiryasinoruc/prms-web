import api from "@/lib/axios"

// Enums
export enum TransferStatus {
  Planned = 1,
  Dispatched = 2,
  Received = 3,
  Cancelled = 4,
}

export const TransferStatusLabels: Record<TransferStatus, string> = {
  [TransferStatus.Planned]: "Planlandı",
  [TransferStatus.Dispatched]: "Gönderildi",
  [TransferStatus.Received]: "Teslim Alındı",
  [TransferStatus.Cancelled]: "İptal",
}

// Badge variant'ları (index ve detay'da ortak kullanılır)
// Planned = gri/mavi, Dispatched = sarı/amber, Received = yeşil, Cancelled = kırmızı
export const TransferStatusVariant: Record<
  TransferStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  [TransferStatus.Planned]: "secondary",
  [TransferStatus.Dispatched]: "outline",
  [TransferStatus.Received]: "default",
  [TransferStatus.Cancelled]: "destructive",
}

// Durum badge'inin renkli görünmesi için ek class (amber/yeşil Tailwind)
export const TransferStatusClass: Record<TransferStatus, string> = {
  [TransferStatus.Planned]:
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  [TransferStatus.Dispatched]:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  [TransferStatus.Received]:
    "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  [TransferStatus.Cancelled]:
    "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
}

// Types - List Response
export interface WarehouseTransfer {
  id: string
  transferNumber: string
  sourceWarehouseName: string
  destinationWarehouseName: string
  status: TransferStatus
  plannedDate: string
  itemCount: number
  dispatchedDate: string | null
  receivedDate: string | null
}

// Types - Detail Response
export interface WarehouseTransferItem {
  id: string
  inventoryId: string
  productName: string
  serialNumber: string
  productVariantName: string
  quantity: number
  sourceWarehouseName: string
}

export interface WarehouseTransferDetail {
  id: string
  transferNumber: string
  sourceWarehouseId: string
  sourceWarehouseName: string
  destinationWarehouseId: string
  destinationWarehouseName: string
  status: TransferStatus
  plannedDate: string
  dispatchedDate: string | null
  receivedDate: string | null
  cancelledDate: string | null
  notes: string
  createdByUserName: string
  createdDate: string
  items: WarehouseTransferItem[]
}

// ForEdit Types
export interface WarehouseTransferItemForEdit {
  inventoryId: string
  quantity: number
  notes: string
}

export interface WarehouseTransferForEdit {
  id: string
  sourceWarehouseId: string
  destinationWarehouseId: string
  plannedDate: string
  notes: string
  items: WarehouseTransferItemForEdit[]
}

// Request Types
export interface WarehouseTransferListParams {
  pageNumber?: number
  pageSize?: number
  searchTerm?: string
  status?: TransferStatus
  sourceWarehouseId?: string
  destinationWarehouseId?: string
  sortBy?: string
  sortDir?: "asc" | "desc"
}

export interface PaginatedWarehouseTransferResponse {
  items: WarehouseTransfer[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface WarehouseTransferItemRequest {
  inventoryId: string
  quantity: number
  notes: string
}

export interface WarehouseTransferCreateRequest {
  sourceWarehouseId: string
  destinationWarehouseId: string
  plannedDate: string
  notes: string
  items: WarehouseTransferItemRequest[]
}

export type WarehouseTransferUpdateRequest = WarehouseTransferCreateRequest

// Backend list response (rental/inventory ile aynı zarf)
interface ApiWarehouseTransferListResponse {
  totalCount: number
  currentPage: number
  pageSize: number
  pageCount: number
  data: WarehouseTransfer[]
}

// API Functions
export const warehouseTransferApi = {
  getAll: async (
    params: WarehouseTransferListParams = {},
  ): Promise<PaginatedWarehouseTransferResponse> => {
    const response = await api.get<ApiWarehouseTransferListResponse>("/warehouse-transfer", {
      params: {
        "Pagination.Page": params.pageNumber || 1,
        "Pagination.PageSize": params.pageSize || 10,
        "Searching.Search": params.searchTerm || undefined,
        "Filters.Status": params.status || undefined,
        "Filters.SourceWarehouseId": params.sourceWarehouseId || undefined,
        "Filters.DestinationWarehouseId": params.destinationWarehouseId || undefined,
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
    const response = await api.get<WarehouseTransferDetail>(`/warehouse-transfer/${id}`)
    return response.data
  },

  getForEdit: async (id: string) => {
    const response = await api.get<WarehouseTransferForEdit>(
      `/warehouse-transfer/get-for-edit/${id}`,
    )
    return response.data
  },

  create: async (data: WarehouseTransferCreateRequest) => {
    const response = await api.post<{ id: string }>("/warehouse-transfer", {
      SourceWarehouseId: data.sourceWarehouseId,
      DestinationWarehouseId: data.destinationWarehouseId,
      PlannedDate: data.plannedDate,
      Notes: data.notes || "",
      Items: data.items.map((item) => ({
        InventoryId: item.inventoryId,
        Quantity: item.quantity,
        Notes: item.notes || "",
      })),
    })
    return response.data
  },

  update: async (id: string, data: WarehouseTransferUpdateRequest) => {
    await api.put(`/warehouse-transfer/${id}`, {
      SourceWarehouseId: data.sourceWarehouseId,
      DestinationWarehouseId: data.destinationWarehouseId,
      PlannedDate: data.plannedDate,
      Notes: data.notes || "",
      Items: data.items.map((item) => ({
        InventoryId: item.inventoryId,
        Quantity: item.quantity,
        Notes: item.notes || "",
      })),
    })
  },

  dispatch: async (id: string) => {
    await api.post(`/warehouse-transfer/${id}/dispatch`)
  },

  receive: async (id: string) => {
    await api.post(`/warehouse-transfer/${id}/receive`)
  },

  cancel: async (id: string) => {
    await api.post(`/warehouse-transfer/${id}/cancel`)
  },

  delete: async (id: string) => {
    await api.delete(`/warehouse-transfer/${id}`)
  },
}
