import api from "@/lib/axios"

export enum CalendarEventType {
  Maintenance = 1,
  Holiday = 2,
  Blockout = 3,
  Reservation = 4,
  Custom = 5,
}

export const CalendarEventTypeLabels: Record<CalendarEventType, string> = {
  [CalendarEventType.Maintenance]: "Bakım",
  [CalendarEventType.Holiday]: "Tatil",
  [CalendarEventType.Blockout]: "Bloke",
  [CalendarEventType.Reservation]: "Rezervasyon",
  [CalendarEventType.Custom]: "Özel",
}

export type CalendarEventKind = "Event" | "Rental"

export interface CalendarEvent {
  id: string
  title: string
  type: CalendarEventType
  startDate: string
  endDate: string
  isAllDay: boolean
  productName: string | null
  inventorySerialNumber: string | null
  warehouseName: string | null
  employeeName: string | null
  color: string
  isActive: boolean
  /** "Event" — kullanıcı eklediği; "Rental" — Rental tablosundan üretilmiş. */
  kind: CalendarEventKind
}

export interface CalendarEventDetail {
  id: string
  title: string
  description: string | null
  type: CalendarEventType
  startDate: string
  endDate: string
  isAllDay: boolean
  productId: string | null
  productName: string | null
  inventoryId: string | null
  inventorySerialNumber: string | null
  warehouseId: string | null
  warehouseName: string | null
  employeeId: string | null
  employeeName: string | null
  color: string
  isActive: boolean
  createdDate: string
}

export interface CalendarEventListParams {
  type?: CalendarEventType
  productId?: string
  inventoryId?: string
  warehouseId?: string
  employeeId?: string
  startDate?: string
  endDate?: string
}

export interface CalendarEventCreateRequest {
  title: string
  description: string
  type: CalendarEventType
  startDate: string
  endDate: string
  isAllDay: boolean
  productId: string | null
  inventoryId: string | null
  warehouseId: string | null
  employeeId: string | null
  color: string
  isActive: boolean
}

export interface CalendarEventUpdateRequest {
  title: string
  description: string
  type: CalendarEventType
  startDate: string
  endDate: string
  isAllDay: boolean
  productId: string | null
  inventoryId: string | null
  warehouseId: string | null
  employeeId: string | null
  color: string
  isActive: boolean
}

export const calendarApi = {
  getAll: async (params: CalendarEventListParams = {}) => {
    const response = await api.get<CalendarEvent[]>("/calendar-event", {
      params: {
        type: params.type,
        productId: params.productId,
        inventoryId: params.inventoryId,
        warehouseId: params.warehouseId,
        employeeId: params.employeeId,
        startDate: params.startDate,
        endDate: params.endDate,
      },
    })
    return response.data
  },

  getDetail: async (id: string) => {
    const response = await api.get<CalendarEventDetail>(`/calendar-event/${id}`)
    return response.data
  },

  create: async (data: CalendarEventCreateRequest) => {
    const response = await api.post<{ id: string }>("/calendar-event", {
      Title: data.title,
      Description: data.description,
      Type: data.type,
      StartDate: data.startDate,
      EndDate: data.endDate,
      IsAllDay: data.isAllDay,
      ProductId: data.productId,
      InventoryId: data.inventoryId,
      WarehouseId: data.warehouseId,
      EmployeeId: data.employeeId,
      Color: data.color,
      IsActive: data.isActive,
    })
    return response.data.id
  },

  update: async (id: string, data: CalendarEventUpdateRequest) => {
    await api.put(`/calendar-event/${id}`, {
      Title: data.title,
      Description: data.description,
      Type: data.type,
      StartDate: data.startDate,
      EndDate: data.endDate,
      IsAllDay: data.isAllDay,
      ProductId: data.productId,
      InventoryId: data.inventoryId,
      WarehouseId: data.warehouseId,
      EmployeeId: data.employeeId,
      Color: data.color,
      IsActive: data.isActive,
    })
  },

  delete: async (id: string) => {
    await api.delete(`/calendar-event/${id}`)
  },
}
