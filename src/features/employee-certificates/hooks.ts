import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { employeeCertificateApi, type EmployeeCertificateAddRequest } from "./api"

export const employeeCertificateKeys = {
  all: ["employee-certificates"] as const,
  byEmployee: (employeeId: string) =>
    [...employeeCertificateKeys.all, "by-employee", employeeId] as const,
}

export function useEmployeeCertificates(employeeId: string | null) {
  return useQuery({
    queryKey: employeeCertificateKeys.byEmployee(employeeId || ""),
    queryFn: () => employeeCertificateApi.getByEmployee(employeeId!),
    enabled: !!employeeId,
    staleTime: 0,
  })
}

export function useAddEmployeeCertificate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: EmployeeCertificateAddRequest) => employeeCertificateApi.add(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: employeeCertificateKeys.byEmployee(variables.employeeId),
      })
    },
  })
}

export function useRemoveEmployeeCertificate(employeeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => employeeCertificateApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: employeeCertificateKeys.byEmployee(employeeId),
      })
    },
  })
}
