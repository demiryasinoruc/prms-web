import api from "@/lib/axios"

export interface EmployeeCertificate {
  id: string
  certificateId: string
  certificateName: string
  certificateDescription: string
  expiryDate: string | null
  notes: string
  createdDate: string
}

export interface EmployeeCertificateAddRequest {
  employeeId: string
  certificateId: string
  expiryDate: string | null
  notes: string
}

export const employeeCertificateApi = {
  getByEmployee: async (employeeId: string) => {
    const response = await api.get<EmployeeCertificate[]>(
      `/employeecertificate/by-employee/${employeeId}`,
    )
    return response.data
  },

  add: async (data: EmployeeCertificateAddRequest) => {
    const response = await api.post<{ id: string }>("/employeecertificate", {
      EmployeeId: data.employeeId,
      CertificateId: data.certificateId,
      ExpiryDate: data.expiryDate,
      Notes: data.notes,
    })
    return response.data
  },

  remove: async (id: string) => {
    await api.delete(`/employeecertificate/${id}`)
  },
}
