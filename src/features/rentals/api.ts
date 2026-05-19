import api from "@/lib/axios"
import { DeliveryType } from "@/features/company/api"

// Enums
export enum RentalStatus {
  Draft = 1,
  Reservation = 2,
  Active = 3,
  PartialReturn = 4,
  Waiting = 5,
  Completed = 6,
  Cancelled = 7,
}

export const RentalStatusLabels: Record<RentalStatus, string> = {
  [RentalStatus.Draft]: "Taslak",
  [RentalStatus.Reservation]: "Rezervasyon",
  [RentalStatus.Active]: "Aktif",
  [RentalStatus.PartialReturn]: "Kısmi İade",
  [RentalStatus.Waiting]: "Beklemede",
  [RentalStatus.Completed]: "Tamamlandı",
  [RentalStatus.Cancelled]: "İptal Edildi",
}

export enum RentalFlag {
  None = 0,
  StartDelayed = 1,
  ReturnDelayed = 2,
}

export const RentalFlagLabels: Record<RentalFlag, string> = {
  [RentalFlag.None]: "",
  [RentalFlag.StartDelayed]: "Başlangıç Gecikmiş",
  [RentalFlag.ReturnDelayed]: "İade Gecikmiş",
}

export enum PaymentType {
  Advance = 1,
  Deposit = 2,
  RentalFee = 3,
  ExtraFee = 4,
  LatePenalty = 5,
  DamageFee = 6,
  LossFee = 7,
  Refund = 8,
}

export const PaymentTypeLabels: Record<PaymentType, string> = {
  [PaymentType.Advance]: "Kapora",
  [PaymentType.Deposit]: "Depozito",
  [PaymentType.RentalFee]: "Kiralama Ücreti",
  [PaymentType.ExtraFee]: "Ek Ücret",
  [PaymentType.LatePenalty]: "Gecikme Cezası",
  [PaymentType.DamageFee]: "Hasar Bedeli",
  [PaymentType.LossFee]: "Kayıp Bedeli",
  [PaymentType.Refund]: "İade",
}

export enum ReturnCondition {
  Good = 1,
  Damaged = 2,
  Lost = 3,
}

export const ReturnConditionLabels: Record<ReturnCondition, string> = {
  [ReturnCondition.Good]: "Sağlam",
  [ReturnCondition.Damaged]: "Hasarlı",
  [ReturnCondition.Lost]: "Kayıp",
}

export enum DiscountType {
  Percent = 1,
  Amount = 2,
}

export const DiscountTypeLabels: Record<DiscountType, string> = {
  [DiscountType.Percent]: "Yüzde",
  [DiscountType.Amount]: "Tutar",
}

// Types - List Response
export interface Rental {
  id: string
  rentalNumber: string
  customerName: string
  status: RentalStatus
  deliveryType: DeliveryType
  flags: RentalFlag
  plannedStartDate: string
  plannedEndDate: string
  actualStartDate: string | null
  actualEndDate: string | null
  totalAmount: number
  depositAmount: number
  depositPaidAmount: number
  depositRefundedAmount: number
  paidAmount: number
  itemCount: number
  createdDate: string
}

// Types - Detail Response
export interface RentalDetail {
  id: string
  rentalNumber: string
  customerId: string
  customerName: string
  deliveryAddressId: string | null
  deliveryAddressLine: string
  status: RentalStatus
  deliveryType: DeliveryType
  flags: RentalFlag
  plannedStartDate: string
  plannedEndDate: string
  actualStartDate: string | null
  actualEndDate: string | null
  sourceWarehouseId: string | null
  sourceWarehouseName: string
  deliveryVehicleId: string | null
  deliveryVehiclePlate: string
  deliveryEmployeeId: string | null
  deliveryEmployeeName: string
  currencyId: number | null
  currencyCode: string
  exchangeRate: number
  subTotal: number
  discountAmount: number
  discountPercent: number
  taxAmount: number
  totalAmount: number
  depositAmount: number
  depositPaidAmount: number
  depositRefundedAmount: number
  paidAmount: number
  notes: string
  createdByUserName: string
  createdDate: string
  items: RentalItem[]
  services: RentalService[]
  payments: RentalPayment[]
}

export enum ProductType {
  Countable = 1,
  Tracked = 2,
  Consumable = 3,
}

export interface RentalItem {
  id: string
  productId: string
  productName: string
  productType: ProductType
  productVariantId: string | null
  productVariantSku: string | null
  inventoryId: string | null
  inventorySerialNumber: string
  currentLifespan: number | null
  totalLifespan: number | null
  lifespanUnitTypeName: string | null
  quantity: number
  unitPrice: number
  pricePeriodId: number | null
  pricePeriodName: string
  startDateTime: string | null
  endDateTime: string | null
  discountType: DiscountType
  discountValue: number

  discountAmount: number
  discountPercent: number
  lineTotal: number
  isDelivered: boolean
  deliveredDate: string | null
  isReturned: boolean
  returnedDate: string | null
  returnCondition: ReturnCondition | null
  returnNotes: string
  damageFee: number
}

export interface RentalService {
  id: string
  extraServiceId: string
  extraServiceName: string
  assignedEmployeeId: string | null
  assignedEmployeeName: string
  assignedVehicleId?: string | null
  assignedVehiclePlate?: string
  quantity: number
  unitPrice: number
  pricePeriodId: number | null
  pricePeriodName: string
  startDateTime: string | null
  endDateTime: string | null
  discountType: DiscountType
  discountValue: number

  discountAmount: number
  discountPercent: number
  lineTotal: number
  notes: string
}

export interface RentalPayment {
  id: string
  type: PaymentType
  amount: number
  currencyId: number | null
  currencyCode: string
  paymentDate: string
  paymentMethod: string
  referenceNumber: string
  notes: string
  recordedByUserName: string
  createdDate: string
}

// Request Types
export interface RentalListParams {
  pageNumber?: number
  pageSize?: number
  searchTerm?: string
  status?: RentalStatus
  customerId?: string
  startDateFrom?: string
  startDateTo?: string
  endDateFrom?: string
  endDateTo?: string
  sortBy?: string
  sortDir?: "asc" | "desc"
}

export interface PaginatedRentalResponse {
  items: Rental[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface RentalItemRequest {
  productId: string
  productVariantId?: string | null
  inventoryId?: string | null
  quantity: number
  unitPrice: number
  pricePeriodId?: number | null
  startDateTime?: string | null
  endDateTime?: string | null
  discountType: DiscountType
  discountValue: number

}

export interface RentalServiceRequest {
  extraServiceId: string
  assignedEmployeeId?: string | null
  assignedVehicleId?: string | null
  quantity: number
  unitPrice: number
  pricePeriodId?: number | null
  startDateTime?: string | null
  endDateTime?: string | null
  discountType: DiscountType
  discountValue: number

  notes: string
}

export interface RentalCreateRequest {
  customerId: string
  deliveryAddressId?: string | null
  deliveryType: DeliveryType
  plannedStartDate: string
  plannedEndDate: string
  sourceWarehouseId?: string | null
  deliveryVehicleId?: string | null
  deliveryEmployeeId?: string | null
  currencyId?: number | null
  exchangeRate: number
  discountType: DiscountType
  discountValue: number
  depositAmount: number
  notes: string
  items: RentalItemRequest[]
  services: RentalServiceRequest[]
}

export interface RentalUpdateStatusRequest {
  status: RentalStatus
  actualStartDate?: string | null
  actualEndDate?: string | null
}

// ForEdit Types
export interface RentalForEdit {
  id: string
  customerId: string
  deliveryAddressId: string | null
  status: RentalStatus
  deliveryType: DeliveryType
  plannedStartDate: string
  plannedEndDate: string
  sourceWarehouseId: string | null
  deliveryVehicleId: string | null
  deliveryEmployeeId: string | null
  currencyId: number | null
  exchangeRate: number
  discountType: DiscountType
  discountValue: number
  depositAmount: number
  notes: string
  items: RentalItemForEdit[]
  services: RentalServiceForEdit[]
}

export interface RentalItemForEdit {
  id: string
  productId: string
  productVariantId: string | null
  inventoryId: string | null
  quantity: number
  unitPrice: number
  pricePeriodId: number | null
  startDateTime: string | null
  endDateTime: string | null
  discountType: DiscountType
  discountValue: number

}

export interface RentalServiceForEdit {
  id: string
  extraServiceId: string
  assignedEmployeeId: string | null
  assignedVehicleId?: string | null
  quantity: number
  unitPrice: number
  pricePeriodId: number | null
  startDateTime: string | null
  endDateTime: string | null
  discountType: DiscountType
  discountValue: number

  notes: string
}

export interface RentalUpdateRequest {
  customerId: string
  deliveryAddressId?: string | null
  deliveryType: DeliveryType
  status: RentalStatus
  plannedStartDate: string
  plannedEndDate: string
  sourceWarehouseId?: string | null
  deliveryVehicleId?: string | null
  deliveryEmployeeId?: string | null
  currencyId?: number | null
  exchangeRate: number
  discountType: DiscountType
  discountValue: number
  depositAmount: number
  notes: string
  items: RentalItemRequest[]
  services: RentalServiceRequest[]
}

export interface RentalPaymentRequest {
  type: PaymentType
  amount: number
  currencyId?: number | null
  paymentDate: string
  paymentMethod: string
  referenceNumber: string
  notes: string
}

export interface RentalItemReturnRequest {
  rentalItemId: string
  returnCondition: ReturnCondition
  returnNotes: string
  damageFee: number
  lifespanAtReturn?: number | null
}

// Availability Warning
export interface AvailabilityWarning {
  rentalNumber: string
  productName: string
  serialNumber?: string
  startDate: string
  endDate: string
  requestedQuantity?: number
  availableQuantity?: number
}

export interface RentalCreateResponse {
  id: string
  warnings?: AvailabilityWarning[]
}

export interface RentalUpdateResponse {
  warnings?: AvailabilityWarning[]
}

// API Response type from backend
interface ApiRentalListResponse {
  totalCount: number
  currentPage: number
  pageSize: number
  pageCount: number
  data: Rental[]
}

// API Functions
export const rentalApi = {
  getAll: async (params: RentalListParams = {}): Promise<PaginatedRentalResponse> => {
    const response = await api.get<ApiRentalListResponse>("/rental", {
      params: {
        "Pagination.Page": params.pageNumber || 1,
        "Pagination.PageSize": params.pageSize || 10,
        "Searching.Search": params.searchTerm || undefined,
        "Filters.Status": params.status || undefined,
        "Filters.CustomerId": params.customerId || undefined,
        "Filters.StartDateFrom": params.startDateFrom || undefined,
        "Filters.StartDateTo": params.startDateTo || undefined,
        "Filters.EndDateFrom": params.endDateFrom || undefined,
        "Filters.EndDateTo": params.endDateTo || undefined,
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
    const response = await api.get<RentalDetail>(`/rental/${id}`)
    return response.data
  },

  getForEdit: async (id: string) => {
    const response = await api.get<RentalForEdit>(`/rental/get-for-edit/${id}`)
    return response.data
  },

  create: async (data: RentalCreateRequest): Promise<RentalCreateResponse> => {
    const response = await api.post<RentalCreateResponse>("/rental", {
      CustomerId: data.customerId,
      DeliveryAddressId: data.deliveryAddressId || null,
      DeliveryType: data.deliveryType,
      PlannedStartDate: data.plannedStartDate,
      PlannedEndDate: data.plannedEndDate,
      SourceWarehouseId: data.sourceWarehouseId || null,
      DeliveryVehicleId: data.deliveryVehicleId || null,
      DeliveryEmployeeId: data.deliveryEmployeeId || null,
      CurrencyId: data.currencyId || null,
      ExchangeRate: data.exchangeRate,
      DiscountType: data.discountType,
      DiscountValue: data.discountValue,
      DepositAmount: data.depositAmount,
      Notes: data.notes || "",
      Items: data.items.map((item) => ({
        ProductId: item.productId,
        ProductVariantId: item.productVariantId || null,
        InventoryId: item.inventoryId || null,
        Quantity: item.quantity,
        UnitPrice: item.unitPrice,
        PricePeriodId: item.pricePeriodId || null,
        StartDateTime: item.startDateTime || null,
        EndDateTime: item.endDateTime || null,
        DiscountType: item.discountType,
        DiscountValue: item.discountValue,
        ApplyRentalDiscount: true,
      })),
      Services: data.services.map((service) => ({
        ExtraServiceId: service.extraServiceId,
        AssignedEmployeeId: service.assignedEmployeeId || null,
        AssignedVehicleId: service.assignedVehicleId || null,
        Quantity: service.quantity,
        UnitPrice: service.unitPrice,
        PricePeriodId: service.pricePeriodId || null,
        StartDateTime: service.startDateTime || null,
        EndDateTime: service.endDateTime || null,
        DiscountType: service.discountType,
        DiscountValue: service.discountValue,
        ApplyRentalDiscount: true,
        Notes: service.notes || "",
      })),
    })
    return response.data
  },

  update: async (id: string, data: RentalUpdateRequest): Promise<RentalUpdateResponse> => {
    const response = await api.put<RentalUpdateResponse>(`/rental/${id}`, {
      CustomerId: data.customerId,
      DeliveryAddressId: data.deliveryAddressId || null,
      DeliveryType: data.deliveryType,
      Status: data.status,
      PlannedStartDate: data.plannedStartDate,
      PlannedEndDate: data.plannedEndDate,
      SourceWarehouseId: data.sourceWarehouseId || null,
      DeliveryVehicleId: data.deliveryVehicleId || null,
      DeliveryEmployeeId: data.deliveryEmployeeId || null,
      CurrencyId: data.currencyId || null,
      ExchangeRate: data.exchangeRate,
      DiscountType: data.discountType,
      DiscountValue: data.discountValue,
      DepositAmount: data.depositAmount,
      Notes: data.notes || "",
      Items: data.items.map((item) => ({
        ProductId: item.productId,
        ProductVariantId: item.productVariantId || null,
        InventoryId: item.inventoryId || null,
        Quantity: item.quantity,
        UnitPrice: item.unitPrice,
        PricePeriodId: item.pricePeriodId || null,
        StartDateTime: item.startDateTime || null,
        EndDateTime: item.endDateTime || null,
        DiscountType: item.discountType,
        DiscountValue: item.discountValue,
        ApplyRentalDiscount: true,
      })),
      Services: data.services.map((service) => ({
        ExtraServiceId: service.extraServiceId,
        AssignedEmployeeId: service.assignedEmployeeId || null,
        AssignedVehicleId: service.assignedVehicleId || null,
        Quantity: service.quantity,
        UnitPrice: service.unitPrice,
        PricePeriodId: service.pricePeriodId || null,
        StartDateTime: service.startDateTime || null,
        EndDateTime: service.endDateTime || null,
        DiscountType: service.discountType,
        DiscountValue: service.discountValue,
        ApplyRentalDiscount: true,
        Notes: service.notes || "",
      })),
    })
    return response.data
  },

  updateStatus: async (id: string, data: RentalUpdateStatusRequest) => {
    await api.put(`/rental/${id}/status`, {
      Status: data.status,
      ActualStartDate: data.actualStartDate || null,
      ActualEndDate: data.actualEndDate || null,
    })
  },

  addPayment: async (id: string, data: RentalPaymentRequest) => {
    const response = await api.post<{ id: string }>(`/rental/${id}/payments`, {
      Type: data.type,
      Amount: data.amount,
      CurrencyId: data.currencyId || null,
      PaymentDate: data.paymentDate,
      PaymentMethod: data.paymentMethod || "",
      ReferenceNumber: data.referenceNumber || "",
      Notes: data.notes || "",
    })
    return response.data
  },

  returnItems: async (id: string, items: RentalItemReturnRequest[]) => {
    await api.post(`/rental/${id}/return`, items.map((item) => ({
      RentalItemId: item.rentalItemId,
      ReturnCondition: item.returnCondition,
      ReturnNotes: item.returnNotes || "",
      DamageFee: item.damageFee,
      LifespanAtReturn: item.lifespanAtReturn || null,
    })))
  },

  delete: async (id: string) => {
    await api.delete(`/rental/${id}`)
  },
}
