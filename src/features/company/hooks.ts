import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { companyApi, type CompanyUpdateRequest } from "./api"
import { settingsKeys } from "@/features/settings/hooks"

export const companyKeys = {
  all: ["company"] as const,
  byUser: () => [...companyKeys.all, "byUser"] as const,
  forEdit: (id: string) => [...companyKeys.all, "forEdit", id] as const,
}

export function useCompanyByUser() {
  return useQuery({
    queryKey: companyKeys.byUser(),
    queryFn: () => companyApi.getByUser(),
  })
}

export function useCompanyForEdit(id: string | null) {
  return useQuery({
    queryKey: companyKeys.forEdit(id!),
    queryFn: () => companyApi.getForEdit(id!),
    enabled: !!id,
  })
}

export function useUpdateCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CompanyUpdateRequest }) =>
      companyApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: companyKeys.byUser() })
      queryClient.invalidateQueries({ queryKey: companyKeys.forEdit(variables.id) })
      queryClient.invalidateQueries({ queryKey: settingsKeys.company() })
    },
  })
}
