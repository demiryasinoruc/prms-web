import api from "@/lib/axios"

export type AttachmentEntityType =
  | "Rental"
  | "RentalItem"
  | "MaintenanceRecord"
  | "Inventory"
  | "Customer"
  | "Employee"

export interface Attachment {
  id: string
  entityType: AttachmentEntityType
  entityId: string
  fileName: string
  contentType: string
  fileSize: number
  description?: string
  createdDate: string
}

export const attachmentApi = {
  list: async (entityType: AttachmentEntityType, entityId: string) => {
    const response = await api.get<Attachment[]>("/attachment", {
      params: { entityType, entityId },
    })
    return response.data
  },

  upload: async (params: {
    file: File
    entityType: AttachmentEntityType
    entityId: string
    description?: string
  }) => {
    const form = new FormData()
    form.append("file", params.file)
    form.append("entityType", params.entityType)
    form.append("entityId", params.entityId)
    if (params.description) {
      form.append("description", params.description)
    }
    const response = await api.post<Attachment>("/attachment", form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return response.data
  },

  delete: async (id: string) => {
    await api.delete(`/attachment/${id}`)
  },

  // Yeni sekme yerine fetch ile alıp blob URL üretmemiz gerekiyor —
  // Authorization header'ı doğal img/href ile gönderilmez.
  download: async (id: string) => {
    const response = await api.get<Blob>(`/attachment/${id}/download`, {
      responseType: "blob",
    })
    return response.data
  },

  // Sadece görsel ekler için ~256px JPEG thumbnail döner; PDF veya eski
  // yüklemelerde 404 atılır (404 toast'u silentCodes ile bastırılmıyor ama
  // GET olduğu için interceptor sessizce geçer — UI fallback davranışı normal).
  thumbnail: async (id: string) => {
    const response = await api.get<Blob>(`/attachment/${id}/thumbnail`, {
      responseType: "blob",
    })
    return response.data
  },
}
