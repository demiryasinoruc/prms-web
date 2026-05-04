import api from "@/lib/axios"

// Request tipleri
export interface BatchItemCheck {
  itemKey: string
  productId: string
  productVariantId?: string | null
  inventoryId?: string | null
  quantity: number
  startDateTime?: string | null
  endDateTime?: string | null
}

export interface BatchVehicleCheck {
  itemKey: string
  vehicleId: string
  startDate: string
  endDate: string
}

export interface BatchEmployeeCheck {
  itemKey: string
  employeeId: string
  startDate: string
  endDate: string
}

export interface BatchAvailabilityRequest {
  excludeRentalId?: string | null
  defaultStartDate: string
  defaultEndDate: string
  warehouseId?: string | null
  items: BatchItemCheck[]
  vehicles: BatchVehicleCheck[]
  employees: BatchEmployeeCheck[]
}

// Response tipleri
export interface ConflictDetail {
  rentalNumber: string
  productName: string
  serialNumber?: string | null
  startDate: string
  endDate: string
  requestedQuantity?: number | null
  availableQuantity?: number | null
}

export interface BatchAvailabilityItemResult {
  itemKey: string
  isAvailable: boolean
  requested?: number | null
  available?: number | null
  conflicts: ConflictDetail[]
}

export interface BatchAvailabilityResult {
  results: BatchAvailabilityItemResult[]
}

// API
export const availabilityApi = {
  checkBatch: async (request: BatchAvailabilityRequest): Promise<BatchAvailabilityResult> => {
    const { data } = await api.post<BatchAvailabilityResult>("/availability/check-batch", request)
    return data
  },
}
