import api from "@/lib/axios"
import type {
  Customer,
  PaginatedResponse,
  CustomerAddress,
} from "@/types/api"

export interface CustomerListParams {
  pageNumber?: number
  pageSize?: number
  searchTerm?: string
  customerType?: number
  isActive?: boolean
  sortBy?: string
  sortDir?: "asc" | "desc"
}

export interface CustomerCreateRequest {
  name: string
  customerType: number
  identityNumber?: string
  taxNumber?: string
  taxOffice?: string
  phone?: string
  email?: string
  notes?: string
  isActive: boolean
  addresses?: CustomerAddressRequest[]
}

export interface CustomerAddressRequest {
  id?: string
  title: string
  addressType: number
  addressLine1: string
  addressLine2?: string
  city: string
  state?: string
  postalCode?: string
  country: string
  isDefault: boolean
}

export interface CustomerUpdateRequest extends CustomerCreateRequest {
  id: string
  isActive: boolean
}

// API response types (matching backend)
interface ApiCustomerListResponse {
  totalCount: number
  currentPage: number
  pageSize: number
  pageCount: number
  data: ApiCustomer[]
}

interface ApiCustomerAddress {
  id: string
  customerId?: string
  type: number
  title: string
  addressLine1: string
  addressLine2?: string
  city: string
  state?: string
  postalCode?: string
  country: string
  isDefault: boolean
}

interface ApiCustomer {
  id: string
  type: number
  name: string
  eMail: string
  phone: string
  identityNumber: string
  taxNumber: string
  taxOffice: string
  notes?: string
  isActive?: boolean
  addresses?: ApiCustomerAddress[]
}

// Transform API address response to frontend format
function transformAddress(apiAddress: ApiCustomerAddress): CustomerAddress {
  return {
    id: apiAddress.id,
    customerId: apiAddress.customerId || "",
    title: apiAddress.title,
    addressType: apiAddress.type,
    addressLine1: apiAddress.addressLine1,
    addressLine2: apiAddress.addressLine2,
    city: apiAddress.city,
    state: apiAddress.state,
    postalCode: apiAddress.postalCode,
    country: apiAddress.country,
    isDefault: apiAddress.isDefault,
  }
}

// Transform API response to frontend format
function transformCustomer(apiCustomer: ApiCustomer): Customer {
  return {
    id: apiCustomer.id,
    name: apiCustomer.name,
    customerType: apiCustomer.type,
    email: apiCustomer.eMail,
    phone: apiCustomer.phone,
    identityNumber: apiCustomer.identityNumber,
    taxNumber: apiCustomer.taxNumber,
    taxOffice: apiCustomer.taxOffice,
    notes: apiCustomer.notes,
    isActive: apiCustomer.isActive ?? true,
    addresses: apiCustomer.addresses?.map(transformAddress) || [],
  }
}

export const customerApi = {
  getAll: async (params: CustomerListParams = {}) => {
    const response = await api.get<ApiCustomerListResponse>("/customer", {
      params: {
        "Pagination.Page": params.pageNumber || 1,
        "Pagination.PageSize": params.pageSize || 10,
        "Searching.Search": params.searchTerm || undefined,
        "Filters.Type": params.customerType || undefined,
        "Filters.IsActive": params.isActive,
        "Sorting.SortBy": params.sortBy || undefined,
        "Sorting.SortDir": params.sortDir || undefined,
      },
    })

    // Transform to frontend format
    const apiData = response.data
    return {
      items: apiData.data.map(transformCustomer),
      totalCount: apiData.totalCount,
      pageNumber: apiData.currentPage,
      pageSize: apiData.pageSize,
      totalPages: apiData.pageCount,
      hasPreviousPage: apiData.currentPage > 1,
      hasNextPage: apiData.currentPage < apiData.pageCount,
    } as PaginatedResponse<Customer>
  },

  getById: async (id: string) => {
    const response = await api.get<ApiCustomer>(`/customer/detail/${id}`)
    return transformCustomer(response.data)
  },

  getForEdit: async (id: string) => {
    const response = await api.get<Omit<ApiCustomer, "id">>(`/customer/get-for-edit/${id}`)
    // Backend doesn't return id for edit endpoint, we add it from the parameter
    return transformCustomer({ ...response.data, id })
  },

  getSelect: async () => {
    const response = await api.get<{ value: string; text: string }[]>(
      "/customer/select"
    )
    // Transform to { id, name } format for consistency
    return response.data.map((item) => ({
      id: item.value,
      name: item.text,
    }))
  },

  create: async (data: CustomerCreateRequest) => {
    // Transform to backend format (PascalCase for C# backend)
    const requestBody = {
      Type: data.customerType,
      Name: data.name,
      EMail: data.email || "",
      Phone: data.phone || "",
      IdentityNumber: data.identityNumber || "",
      TaxNumber: data.taxNumber || "",
      TaxOffice: data.taxOffice || "",
      Notes: data.notes || "",
      IsActive: data.isActive,
      Addresses: data.addresses?.map((addr) => ({
        Id: addr.id || null,
        Type: addr.addressType,
        Title: addr.title,
        AddressLine1: addr.addressLine1,
        AddressLine2: addr.addressLine2 || "",
        City: addr.city,
        State: addr.state || "",
        PostalCode: addr.postalCode || "",
        Country: addr.country,
        IsDefault: addr.isDefault,
      })),
    }
    const response = await api.post<Customer>("/customer", requestBody)
    return response.data
  },

  update: async (id: string, data: CustomerUpdateRequest) => {
    // Transform to backend format (PascalCase for C# backend)
    const requestBody = {
      Type: data.customerType,
      Name: data.name,
      EMail: data.email || "",
      Phone: data.phone || "",
      IdentityNumber: data.identityNumber || "",
      TaxNumber: data.taxNumber || "",
      TaxOffice: data.taxOffice || "",
      Notes: data.notes || "",
      IsActive: data.isActive,
      Addresses: data.addresses?.map((addr) => ({
        Id: addr.id || null,
        Type: addr.addressType,
        Title: addr.title,
        AddressLine1: addr.addressLine1,
        AddressLine2: addr.addressLine2 || "",
        City: addr.city,
        State: addr.state || "",
        PostalCode: addr.postalCode || "",
        Country: addr.country,
        IsDefault: addr.isDefault,
      })),
    }
    const response = await api.put<Customer>(`/customer/${id}`, requestBody)
    return response.data
  },

  delete: async (id: string) => {
    await api.delete(`/customer/${id}`)
  },
}
