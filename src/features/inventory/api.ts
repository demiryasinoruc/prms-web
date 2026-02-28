import api from "@/lib/axios"
import { ProductType } from "@/features/products/api"

// Enums
export enum InventoryStatus {
  Available = 1,
  Rented = 2,
  Maintenance = 3,
  Broken = 4,
  Lost = 5,
  Disposed = 6,
  Reserved = 7,
}

export const InventoryStatusLabels: Record<InventoryStatus, string> = {
  [InventoryStatus.Available]: "Müsait",
  [InventoryStatus.Rented]: "Kiralamada",
  [InventoryStatus.Maintenance]: "Bakımda",
  [InventoryStatus.Broken]: "Arızalı",
  [InventoryStatus.Lost]: "Kayıp",
  [InventoryStatus.Disposed]: "Satıldı/Hurda",
  [InventoryStatus.Reserved]: "Rezerve",
}

// Types - List Response
export interface Inventory {
  id: string
  productId: string
  productName: string
  productCode: string
  productVariantId: string | null
  productVariantSku: string | null
  warehouseId: string
  warehouseName: string
  status: InventoryStatus
  serialNumber: string
  quantity: number
  currentUnitValue: number
  currentLifespan: number | null
  lifespanUnitTypeName: string | null
  lastMaintenanceDate: string | null
  expiryDate: string | null
  isActive: boolean
}

// Types - Detail Response
export interface InventoryDetail {
  id: string
  productId: string
  productName: string
  productCode: string
  productType: ProductType
  productVariantId: string | null
  productVariantSku: string | null
  warehouseId: string
  warehouseName: string
  status: InventoryStatus
  serialNumber: string
  quantity: number
  currentUnitValue: number
  currentLifespan: number | null
  totalLifespan: number | null
  lifespanUnitTypeName: string | null
  lastMaintenanceDate: string | null
  expiryDate: string | null
  notes: string
  isActive: boolean
  createdDate: string
}

// Request Types
export interface InventoryListParams {
  pageNumber?: number
  pageSize?: number
  productId?: string
  warehouseId?: string
  status?: InventoryStatus
  searchTerm?: string
  isActive?: boolean
  sortBy?: string
  sortDir?: "asc" | "desc"
}

export interface InventoryCreateRequest {
  productId: string
  productVariantId?: string | null
  warehouseId: string
  status: InventoryStatus
  serialNumber: string
  quantity: number
  currentUnitValue: number
  currentLifespan?: number | null
  lastMaintenanceDate?: string | null
  expiryDate?: string | null
  notes: string
}

export interface InventoryUpdateRequest {
  id: string
  productId: string
  productVariantId?: string | null
  warehouseId: string
  status: InventoryStatus
  serialNumber: string
  quantity: number
  currentUnitValue: number
  currentLifespan?: number | null
  lastMaintenanceDate?: string | null
  expiryDate?: string | null
  notes: string
  isActive: boolean
}

export interface InventoryUpdateStatusRequest {
  id: string
  status: InventoryStatus
}

// Paginated Response
export interface PaginatedResponse<T> {
  data: T[]
  totalCount: number
  currentPage: number
  pageSize: number
}

// API Functions
export const inventoryApi = {
  getAll: async (params: InventoryListParams = {}) => {
    const response = await api.get<PaginatedResponse<Inventory>>("/inventory", {
      params: {
        "Filters.ProductId": params.productId || undefined,
        "Filters.WarehouseId": params.warehouseId || undefined,
        "Filters.Status": params.status || undefined,
        "Filters.IsActive": params.isActive,
        "Searching.Search": params.searchTerm || undefined,
        "Pagination.Page": params.pageNumber || 1,
        "Pagination.PageSize": params.pageSize || 10,
        "Sorting.SortBy": params.sortBy || undefined,
        "Sorting.SortDir": params.sortDir || undefined,
      },
    })
    return response.data
  },

  getSelect: async () => {
    const response = await api.get<{ value: string; text: string }[]>("/inventory/select")
    return response.data.map((item) => ({
      id: item.value,
      name: item.text,
    }))
  },

  getSelectByProduct: async (productId: string, productVariantId?: string, warehouseId?: string) => {
    const response = await api.get<{ value: string; text: string }[]>("/inventory/select-by-product", {
      params: {
        productId,
        productVariantId: productVariantId || undefined,
        warehouseId: warehouseId || undefined,
      },
    })
    return response.data.map((item) => ({
      id: item.value,
      name: item.text,
    }))
  },

  getDetail: async (id: string) => {
    const response = await api.get<InventoryDetail>(`/inventory/detail/${id}`)
    return response.data
  },

  create: async (data: InventoryCreateRequest) => {
    const response = await api.post<{ id: string }>("/inventory", {
      ProductId: data.productId,
      ProductVariantId: data.productVariantId || null,
      WarehouseId: data.warehouseId,
      Status: data.status,
      SerialNumber: data.serialNumber,
      Quantity: data.quantity,
      CurrentUnitValue: data.currentUnitValue,
      CurrentLifespan: data.currentLifespan || null,
      LastMaintenanceDate: data.lastMaintenanceDate || null,
      ExpiryDate: data.expiryDate || null,
      Notes: data.notes || "",
    })
    return response.data
  },

  update: async (id: string, data: InventoryUpdateRequest) => {
    await api.put(`/inventory/${id}`, {
      Id: id,
      ProductId: data.productId,
      ProductVariantId: data.productVariantId || null,
      WarehouseId: data.warehouseId,
      Status: data.status,
      SerialNumber: data.serialNumber,
      Quantity: data.quantity,
      CurrentUnitValue: data.currentUnitValue,
      CurrentLifespan: data.currentLifespan || null,
      LastMaintenanceDate: data.lastMaintenanceDate || null,
      ExpiryDate: data.expiryDate || null,
      Notes: data.notes || "",
      IsActive: data.isActive,
    })
  },

  updateStatus: async (id: string, status: InventoryStatus) => {
    await api.put(`/inventory/${id}/status`, {
      Id: id,
      Status: status,
    })
  },

  delete: async (id: string) => {
    await api.delete(`/inventory/${id}`)
  },
}
