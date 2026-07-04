import api from "@/lib/axios"

export enum NotificationType {
  LifespanWarning = 1,
  ServiceDue = 2,
  ExpiryWarning = 3,
  RentalEndWarning = 4,
  RentalOverdue = 5,
  ReservationReminder = 6,
  EmployeeLeaveReminder = 7,
  TransferReminder = 8,
  LowStockWarning = 9,
  VehicleInspectionWarning = 10,
  VehicleInsuranceWarning = 11,
  DocumentExpiryWarning = 12,
  RentalActivated = 13,
  RentalCompleted = 14,
  RentalCancelled = 15,
  InventoryLost = 16,
  InventoryBroken = 17,
  SubscriptionExpiryWarning = 18,
  ShipmentReminder = 19,
}

export const NotificationTypeLabels: Record<NotificationType, string> = {
  [NotificationType.LifespanWarning]: "Ömür Uyarısı",
  [NotificationType.ServiceDue]: "Servis Zamanı",
  [NotificationType.ExpiryWarning]: "Son Kullanma",
  [NotificationType.RentalEndWarning]: "Kiralama Bitişi",
  [NotificationType.RentalOverdue]: "Gecikmiş Kiralama",
  [NotificationType.ReservationReminder]: "Rezervasyon",
  [NotificationType.EmployeeLeaveReminder]: "Personel İzni",
  [NotificationType.TransferReminder]: "Depo Transferi",
  [NotificationType.LowStockWarning]: "Düşük Stok",
  [NotificationType.VehicleInspectionWarning]: "Araç Muayene",
  [NotificationType.VehicleInsuranceWarning]: "Araç Sigorta",
  [NotificationType.DocumentExpiryWarning]: "Belge Süresi",
  [NotificationType.RentalActivated]: "Kiralama Aktif",
  [NotificationType.RentalCompleted]: "Kiralama Tamamlandı",
  [NotificationType.RentalCancelled]: "Kiralama İptal",
  [NotificationType.InventoryLost]: "Envanter Kayıp",
  [NotificationType.InventoryBroken]: "Envanter Arızalı",
  [NotificationType.SubscriptionExpiryWarning]: "Abonelik Bitişi",
  [NotificationType.ShipmentReminder]: "Sevkiyat Hatırlatması",
}

export enum NotificationStatus {
  Unread = 1,
  Read = 2,
  Acknowledged = 3,
  Snoozed = 4,
  Dismissed = 5,
}

export enum NotificationChannel {
  InApp = 1,
  Email = 2,
}

export interface NotificationListItem {
  id: string
  title: string
  message: string
  type: NotificationType
  status: NotificationStatus
  channel: NotificationChannel
  relatedEntityType: string | null
  relatedEntityId: string | null
  actionUrl: string | null
  readDate: string | null
  createdDate: string
}

export interface NotificationCount {
  unreadCount: number
  totalCount: number
}

export interface NotificationDetail extends NotificationListItem {
  snoozeUntil: string | null
}

export interface NotificationListParams {
  type?: NotificationType
  status?: NotificationStatus
  channel?: NotificationChannel
  onlyUnread?: boolean
  /** Sunucu tavanı 200; varsayılan 50 */
  limit?: number
  offset?: number
}

export interface NotificationUpdateStatusRequest {
  status: NotificationStatus
  snoozeUntil?: string | null
}

export const notificationApi = {
  getAll: async (params: NotificationListParams = {}) => {
    const query = new URLSearchParams()
    if (params.type !== undefined) query.append("type", params.type.toString())
    if (params.status !== undefined) query.append("status", params.status.toString())
    if (params.channel !== undefined) query.append("channel", params.channel.toString())
    if (params.onlyUnread !== undefined) query.append("onlyUnread", params.onlyUnread.toString())
    if (params.limit !== undefined) query.append("limit", params.limit.toString())
    if (params.offset !== undefined) query.append("offset", params.offset.toString())
    const qs = query.toString()
    const url = qs ? `/notification?${qs}` : "/notification"
    const response = await api.get<NotificationListItem[]>(url)
    return response.data
  },

  getCount: async () => {
    const response = await api.get<NotificationCount>("/notification/count")
    return response.data
  },

  getById: async (id: string) => {
    const response = await api.get<NotificationDetail>(`/notification/${id}`)
    return response.data
  },

  updateStatus: async (id: string, data: NotificationUpdateStatusRequest) => {
    await api.put(`/notification/${id}/status`, {
      Status: data.status,
      SnoozeUntil: data.snoozeUntil ?? null,
    })
  },

  markAllRead: async () => {
    await api.post("/notification/mark-all-read")
  },

  delete: async (id: string) => {
    await api.delete(`/notification/${id}`)
  },
}
