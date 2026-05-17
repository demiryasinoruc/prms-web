import api from "@/lib/axios"
import type { Vehicle, PaginatedResponse } from "@/types/api"

export interface VehicleListParams {
  pageNumber?: number
  pageSize?: number
  searchTerm?: string
  vehicleType?: number
  status?: number
  warehouseId?: string
  sortBy?: string
  sortDir?: "asc" | "desc"
}

export interface VehicleCreateRequest {
  vehicleType: number
  brandName: string
  warehouseId: string
  year: number
  model: string
  plate: string
  color?: string
  capacity?: number
  capacityUnit?: string
  notes?: string
  inspectionDate?: string | null
  insuranceDate?: string | null
}

export interface VehicleUpdateRequest extends VehicleCreateRequest {
  id: string
  status: number
}

// API response types (matching backend PascalCase)
interface ApiVehicleListResponse {
  totalCount: number
  currentPage: number
  pageSize: number
  pageCount: number
  data: ApiVehicle[]
}

interface ApiVehicle {
  id: string
  type: number
  status: number
  brandName: string
  year: number
  model: string
  plate: string
  color: string
  capacity: number
  capacityUnit: string
  warehouseId?: string
  warehouseName: string
  notes?: string
  inspectionDate?: string | null
  insuranceDate?: string | null
}

interface ApiVehicleForEdit {
  type: number
  status: number
  brandName: string
  warehouseId: string
  year: number
  model: string
  plate: string
  color: string
  capacity: number
  capacityUnit: string
  notes?: string
  inspectionDate?: string | null
  insuranceDate?: string | null
}

// Transform API response to frontend format
function transformVehicle(apiVehicle: ApiVehicle): Vehicle {
  return {
    id: apiVehicle.id,
    vehicleType: apiVehicle.type,
    status: apiVehicle.status,
    brandName: apiVehicle.brandName,
    year: apiVehicle.year,
    model: apiVehicle.model,
    plate: apiVehicle.plate,
    color: apiVehicle.color,
    capacity: apiVehicle.capacity,
    capacityUnit: apiVehicle.capacityUnit,
    warehouseId: apiVehicle.warehouseId || "",
    warehouseName: apiVehicle.warehouseName,
    notes: apiVehicle.notes,
    inspectionDate: apiVehicle.inspectionDate ?? null,
    insuranceDate: apiVehicle.insuranceDate ?? null,
  }
}

export const vehicleApi = {
  getAll: async (params: VehicleListParams = {}) => {
    const response = await api.get<ApiVehicleListResponse>("/vehicle", {
      params: {
        "Pagination.Page": params.pageNumber || 1,
        "Pagination.PageSize": params.pageSize || 10,
        "Searching.Search": params.searchTerm || undefined,
        "Filters.Type": params.vehicleType || undefined,
        "Filters.Status": params.status || undefined,
        "Filters.WarehouseId": params.warehouseId || undefined,
        "Sorting.SortBy": params.sortBy || undefined,
        "Sorting.SortDir": params.sortDir || undefined,
      },
    })

    const apiData = response.data
    return {
      items: apiData.data.map(transformVehicle),
      totalCount: apiData.totalCount,
      pageNumber: apiData.currentPage,
      pageSize: apiData.pageSize,
      totalPages: apiData.pageCount,
      hasPreviousPage: apiData.currentPage > 1,
      hasNextPage: apiData.currentPage < apiData.pageCount,
    } as PaginatedResponse<Vehicle>
  },

  getById: async (id: string) => {
    const response = await api.get<ApiVehicle>(`/vehicle/detail/${id}`)
    return transformVehicle(response.data)
  },

  getForEdit: async (id: string) => {
    const response = await api.get<ApiVehicleForEdit>(`/vehicle/get-for-edit/${id}`)
    return transformVehicle({ ...response.data, id, warehouseName: "" })
  },

  getSelect: async () => {
    const response = await api.get<{ value: string; text: string }[]>("/vehicle/select")
    // Transform to { id, plate } format - backend returns "BrandName - Model - Year" as text
    return response.data.map((item) => ({
      id: item.value,
      plate: item.text,
    }))
  },

  create: async (data: VehicleCreateRequest) => {
    const requestBody = {
      Type: data.vehicleType,
      BrandName: data.brandName,
      WarehouseId: data.warehouseId,
      Year: data.year,
      Model: data.model,
      Plate: data.plate,
      Color: data.color || "",
      Capacity: data.capacity || 0,
      CapacityUnit: data.capacityUnit || "",
      Notes: data.notes || "",
      InspectionDate: data.inspectionDate || null,
      InsuranceDate: data.insuranceDate || null,
    }
    const response = await api.post<Vehicle>("/vehicle", requestBody)
    return response.data
  },

  update: async (id: string, data: VehicleUpdateRequest) => {
    const requestBody = {
      Type: data.vehicleType,
      Status: data.status,
      BrandName: data.brandName,
      WarehouseId: data.warehouseId,
      Year: data.year,
      Model: data.model,
      Plate: data.plate,
      Color: data.color || "",
      Capacity: data.capacity || 0,
      CapacityUnit: data.capacityUnit || "",
      Notes: data.notes || "",
      InspectionDate: data.inspectionDate || null,
      InsuranceDate: data.insuranceDate || null,
    }
    const response = await api.put<Vehicle>(`/vehicle/${id}`, requestBody)
    return response.data
  },

  delete: async (id: string) => {
    await api.delete(`/vehicle/${id}`)
  },
}
