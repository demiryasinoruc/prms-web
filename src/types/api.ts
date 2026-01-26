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

export interface Product {
  id: string
  productCode: string
  name: string
  description?: string
  basePrice: number
  pricePeriodId: string
  pricePeriodName: string
  currencyId: string
  currencyCode: string
  categoryId: string
  categoryName: string
  brandId?: string
  brandName?: string
  unitTypeId: string
  unitTypeName: string
  productType: ProductType
  totalLifespanHours?: number
  minimumStockLevel?: number
  isActive: boolean
}

export enum ProductType {
  SerialTracked = 1,
  Countable = 2,
  Consumable = 3,
}

export interface Category {
  id: string
  name: string
  description?: string
  parentId?: string
  parentName?: string
  children?: Category[]
}

export interface Brand {
  id: string
  name: string
  description?: string
}

export interface Warehouse {
  id: string
  name: string
  address?: string
  contactInfo?: string
  isActive: boolean
}

export interface Inventory {
  id: string
  productId: string
  productName: string
  warehouseId: string
  warehouseName: string
  serialNumber?: string
  quantity: number
  status: InventoryStatus
  currentLifespanHours?: number
  lastMaintenanceDate?: string
}

export enum InventoryStatus {
  Available = 1,
  Rental = 2,
  Maintenance = 3,
  Broken = 4,
  Lost = 5,
  Destroyed = 6,
  Reserved = 7,
}

export interface Customer {
  id: string
  name: string
  customerType: CustomerType
  identityNumber?: string
  taxNumber?: string
  taxOffice?: string
  contactNumber?: string
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
  status: RentalStatus
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
  payments?: RentalPayment[]
}

export enum RentalStatus {
  Draft = 1,
  Confirmed = 2,
  Delivered = 3,
  Returned = 4,
  Cancelled = 5,
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
  pricePeriodId: string
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

export interface RentalPayment {
  id: string
  rentalId: string
  paymentType: PaymentType
  amount: number
  paymentMethod: PaymentMethod
  referenceNumber?: string
  notes?: string
  createdAt: string
}

export enum PaymentType {
  Deposit = 1,
  Advance = 2,
  Full = 3,
  Damage = 4,
  LateFee = 5,
}

export enum PaymentMethod {
  Cash = 1,
  Card = 2,
  Transfer = 3,
  Check = 4,
}

export interface Employee {
  id: string
  name: string
  surname: string
  email?: string
  contactNumber?: string
  birthDate?: string
  gender: Gender
  notes?: string
  isActive: boolean
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
