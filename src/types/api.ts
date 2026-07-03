export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  items: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  refreshToken: string
  user: User
}

export interface User {
  id: string
  email: string
  name: string
  surname: string
  /** E-posta doğrulandı mı (yumuşak doğrulama — false ise banner gösterilir) */
  emailConfirmed?: boolean
  companyId: string
  companyName: string
  roleId: string
  roleName: string
}

export interface Company {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  taxNumber?: string
  taxOffice?: string
  isActive: boolean
}

export interface Category {
  id: string
  name: string
  description?: string
  parentId?: string
  parentName?: string
  children?: Category[]
}

export interface Warehouse {
  id: string
  name: string
  address?: string
  contactInfo?: string
  isActive: boolean
  latitude?: number | null
  longitude?: number | null
  locationAddress?: string | null
}

export interface Inventory {
  id: string
  productId: string
  productName: string
  warehouseId: string
  warehouseName: string
  serialNumber?: string
  quantity: number
  status: number
  currentLifespanHours?: number
  lastMaintenanceDate?: string
}

export interface Customer {
  id: string
  name: string
  customerType: CustomerType
  identityNumber?: string
  taxNumber?: string
  taxOffice?: string
  phone?: string
  email?: string
  notes?: string
  isActive: boolean
  addresses?: CustomerAddress[]
}

export enum CustomerType {
  Individual = 1,
  Corporate = 2,
}

export interface CustomerAddress {
  id: string
  customerId: string
  title: string
  addressType: AddressType
  addressLine1: string
  addressLine2?: string
  city: string
  state?: string
  postalCode?: string
  country: string
  isDefault: boolean
}

export enum AddressType {
  Billing = 1,
  Delivery = 2,
  Other = 3,
}

export interface Rental {
  id: string
  rentalNumber: string
  customerId: string
  customerName: string
  warehouseId: string
  warehouseName: string
  status: number
  plannedStartDate: string
  plannedEndDate: string
  actualStartDate?: string
  actualEndDate?: string
  subTotal: number
  discountAmount: number
  discountPercent: number
  taxAmount: number
  totalAmount: number
  depositAmount: number
  paidAmount: number
  currencyCode: string
  notes?: string
  items?: RentalItem[]
}

export interface RentalItem {
  id: string
  rentalId: string
  productId: string
  productName: string
  inventoryId?: string
  serialNumber?: string
  quantity: number
  unitPrice: number
  pricePeriodId: number
  pricePeriodName: string
  discountAmount: number
  discountPercent: number
  lineTotal: number
  isDelivered: boolean
  deliveredDate?: string
  isReturned: boolean
  returnedDate?: string
  returnCondition?: string
  damageFee: number
  returnNotes?: string
}

export interface Employee {
  id: string
  name: string
  surname: string
  email?: string
  phone?: string
  birthDate?: string
  gender: Gender
  notes?: string
  isActive: boolean
  warehouseId?: string | null
  warehouseName?: string
}

export enum Gender {
  Male = 1,
  Female = 2,
}

export interface Vehicle {
  id: string
  brandName: string
  model: string
  year?: number
  plate: string
  color?: string
  capacity?: number
  capacityUnit?: string
  vehicleType: VehicleType
  status: VehicleStatus
  warehouseId: string
  warehouseName: string
  notes?: string
  inspectionDate?: string | null
  insuranceDate?: string | null
}

export enum VehicleType {
  Truck = 1,
  Van = 2,
  Minibus = 3,
  Car = 4,
  Other = 5,
}

export enum VehicleStatus {
  Available = 1,
  InTransit = 2,
  Maintenance = 3,
  Broken = 4,
}

export interface UnitType {
  id: string
  name: string
  abbreviation: string
}

export interface PricePeriod {
  id: string
  name: string
}

export interface Currency {
  id: string
  code: string
  name: string
  symbol: string
}
