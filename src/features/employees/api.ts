import api from "@/lib/axios"
import type { Employee, PaginatedResponse, Gender } from "@/types/api"

export interface EmployeeListParams {
  pageNumber?: number
  pageSize?: number
  searchTerm?: string
  gender?: number
  isActive?: boolean
  sortBy?: string
  sortDir?: "asc" | "desc"
}

export interface EmployeeCreateRequest {
  name: string
  surname: string
  gender: number
  birthDate?: string
  email?: string
  phone?: string
  notes?: string
}

export interface EmployeeUpdateRequest extends EmployeeCreateRequest {
  id: string
  isActive: boolean
}

// API response types (matching backend PascalCase)
interface ApiEmployeeListResponse {
  totalCount: number
  currentPage: number
  pageSize: number
  pageCount: number
  data: ApiEmployee[]
}

interface ApiEmployee {
  id: string
  name: string
  surname: string
  gender: number
  birthDate?: string
  email: string
  phone: string
  isActive: boolean
  notes?: string
  createdDate?: string
}

// Transform API response to frontend format
function transformEmployee(apiEmployee: ApiEmployee): Employee {
  return {
    id: apiEmployee.id,
    name: apiEmployee.name,
    surname: apiEmployee.surname,
    gender: apiEmployee.gender as Gender,
    birthDate: apiEmployee.birthDate,
    email: apiEmployee.email,
    phone: apiEmployee.phone,
    isActive: apiEmployee.isActive,
    notes: apiEmployee.notes,
  }
}

export const employeeApi = {
  getAll: async (params: EmployeeListParams = {}) => {
    const response = await api.get<ApiEmployeeListResponse>("/employee", {
      params: {
        "Pagination.Page": params.pageNumber || 1,
        "Pagination.PageSize": params.pageSize || 10,
        "Searching.Search": params.searchTerm || undefined,
        "Filters.Gender": params.gender || undefined,
        "Filters.IsActive": params.isActive !== undefined ? params.isActive : undefined,
        "Sorting.SortBy": params.sortBy || undefined,
        "Sorting.SortDir": params.sortDir || undefined,
      },
    })

    const apiData = response.data
    return {
      items: apiData.data.map(transformEmployee),
      totalCount: apiData.totalCount,
      pageNumber: apiData.currentPage,
      pageSize: apiData.pageSize,
      totalPages: apiData.pageCount,
      hasPreviousPage: apiData.currentPage > 1,
      hasNextPage: apiData.currentPage < apiData.pageCount,
    } as PaginatedResponse<Employee>
  },

  getById: async (id: string) => {
    const response = await api.get<ApiEmployee>(`/employee/detail/${id}`)
    return transformEmployee(response.data)
  },

  getForEdit: async (id: string) => {
    const response = await api.get<Omit<ApiEmployee, "id" | "createdDate">>(`/employee/get-for-edit/${id}`)
    return transformEmployee({ ...response.data, id })
  },

  getSelect: async () => {
    const response = await api.get<{ value: string; text: string }[]>("/employee/select")
    // Transform to { id, name, surname } format - backend returns only Name in text
    return response.data.map((item) => ({
      id: item.value,
      name: item.text,
      surname: "", // Backend only returns name, not surname
    }))
  },

  create: async (data: EmployeeCreateRequest) => {
    const requestBody = {
      Name: data.name,
      Surname: data.surname,
      Gender: data.gender,
      BirthDate: data.birthDate || null,
      Email: data.email || "",
      Phone: data.phone || "",
      Notes: data.notes || "",
    }
    const response = await api.post<Employee>("/employee", requestBody)
    return response.data
  },

  update: async (id: string, data: EmployeeUpdateRequest) => {
    const requestBody = {
      Name: data.name,
      Surname: data.surname,
      Gender: data.gender,
      BirthDate: data.birthDate || null,
      Email: data.email || "",
      Phone: data.phone || "",
      IsActive: data.isActive,
      Notes: data.notes || "",
    }
    const response = await api.put<Employee>(`/employee/${id}`, requestBody)
    return response.data
  },

  delete: async (id: string) => {
    await api.delete(`/employee/${id}`)
  },
}
