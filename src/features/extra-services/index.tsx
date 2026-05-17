import { useState, useMemo } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { type ColumnDef } from "@tanstack/react-table"
import {
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/data-table"
import { PageHeader } from "@/components/shared/page-header"
import { SearchInput } from "@/components/shared/search-input"
import { StatusFilterSelect } from "@/components/shared/status-filter-select"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useExtraServices, useDeleteExtraService, usePricePeriods, useCertificates } from "./hooks"
import { ExtraServiceDialog } from "./extra-service-dialog"
import { ServiceType, ServiceTypeLabels } from "./api"
import type { ExtraService, ExtraServiceFilters, ExtraServiceParams } from "./api"
import { usePermission } from "@/hooks/use-permission"
import { Permissions } from "@/lib/permissions"
import { createActionButtonsColumn, createStatusBadgeColumn } from "@/components/shared/column-helpers"
import { useDialogResetKey } from "@/hooks/use-dialog-reset-key"

export default function ExtraServicesPage() {
  const canCreate = usePermission(Permissions.ExtraServices.Create)
  const canUpdate = usePermission(Permissions.ExtraServices.Update)
  const canDelete = usePermission(Permissions.ExtraServices.Delete)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<ExtraService | null>(null)
  const dialogKey = useDialogResetKey(dialogOpen)

  // Search, filter, sort, pagination state
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 400)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [sorting, setSorting] = useState<{ sortBy: string | null; sortDir: "asc" | "desc" | null }>({
    sortBy: null,
    sortDir: null,
  })

  // Filters
  const [filters, setFilters] = useState<ExtraServiceFilters>({})

  // Lookup data
  const { data: pricePeriods } = usePricePeriods()
  const { data: certificates } = useCertificates()

  // Build query params
  const queryParams: ExtraServiceParams = useMemo(() => ({
    page: page + 1,
    pageSize,
    search: debouncedSearch || undefined,
    sortBy: sorting.sortBy || undefined,
    sortDir: sorting.sortDir || undefined,
    filters: Object.keys(filters).length > 0 ? filters : undefined,
  }), [page, pageSize, debouncedSearch, sorting.sortBy, sorting.sortDir, filters])

  const { data: response, isLoading } = useExtraServices(queryParams)
  const deleteService = useDeleteExtraService()

  const services = response?.data || []
  const totalCount = response?.totalCount || 0
  const pageCount = response?.pageCount || Math.ceil(totalCount / pageSize) || 1

  const handleEdit = (service: ExtraService) => {
    setEditingService(service)
    setDialogOpen(true)
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingService(null)
  }

  const formatPrice = (price: number, currencyCode: string) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: currencyCode,
    }).format(price)
  }

  const updateFilter = (key: keyof ExtraServiceFilters, value: string | number | boolean | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(0)
  }

  const columns: ColumnDef<ExtraService>[] = [
    {
      accessorKey: "name",
      header: "Hizmet Adı",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Açıklama",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-muted-foreground truncate max-w-[200px] block">
          {row.original.description || "-"}
        </span>
      ),
    },
    {
      accessorKey: "price",
      header: "Fiyat",
      enableSorting: true,
      cell: ({ row }) => formatPrice(row.original.price, row.original.currencyCode),
    },
    {
      accessorKey: "pricePeriodName",
      header: "Periyot",
      enableSorting: true,
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.pricePeriodName}</Badge>
      ),
    },
    {
      accessorKey: "requiredCertificateName",
      header: "Sertifika",
      enableSorting: false,
      cell: ({ row }) => row.original.requiredCertificateName || "-",
    },
    {
      accessorKey: "serviceType",
      header: "Tip",
      enableSorting: false,
      cell: ({ row }) => (
        <Badge variant="secondary">{ServiceTypeLabels[row.original.serviceType]}</Badge>
      ),
    },
    createStatusBadgeColumn<ExtraService>({ enableSorting: true }),
    createActionButtonsColumn<ExtraService>({
      onEdit: handleEdit,
      onDelete: (id) => deleteService.mutateAsync(id),
      getId: (row) => row.id,
      canUpdate,
      canDelete,
      entityName: "Ek Hizmet",
    }),
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ek Hizmetler"
        description="Kiralama işlemlerine eklenebilecek ek hizmetleri yönetin"
        action={{ label: "Yeni Ek Hizmet", onClick: () => setDialogOpen(true), permission: canCreate }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Ek Hizmet Listesi</CardTitle>
          <CardDescription>
            Toplam {totalCount} ek hizmet kaydı
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:flex-wrap mb-4">
            <SearchInput
              value={search}
              onChange={(value) => { setSearch(value); setPage(0) }}
              placeholder="Ek hizmet ara..."
            />
            <Select
              value={filters.pricePeriodId ?? "all"}
              onValueChange={(value) => updateFilter("pricePeriodId", value === "all" ? undefined : value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Periyot" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Periyotlar</SelectItem>
                {pricePeriods?.map((period) => (
                  <SelectItem key={period.value} value={String(period.value)}>
                    {period.text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.requiredCertificateId ?? "all"}
              onValueChange={(value) => updateFilter("requiredCertificateId", value === "all" ? undefined : value)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sertifika" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Sertifikalar</SelectItem>
                {certificates?.map((cert) => (
                  <SelectItem key={String(cert.value)} value={String(cert.value)}>
                    {cert.text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.serviceType === undefined ? "all" : String(filters.serviceType)}
              onValueChange={(value) => updateFilter("serviceType", value === "all" ? undefined : (Number(value) as ServiceType))}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Hizmet Tipi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Hizmet Tipleri</SelectItem>
                {Object.entries(ServiceTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <StatusFilterSelect
              value={filters.isActive}
              onChange={(v) => updateFilter("isActive", v)}
            />
          </div>

          <DataTable
            columns={columns}
            data={services}
            isLoading={isLoading}
            emptyMessage="Henüz ek hizmet eklenmemiş"
            pagination={{
              pageIndex: page,
              pageSize,
              pageCount,
              onPageChange: setPage,
              onPageSizeChange: (size) => {
                setPageSize(size)
                setPage(0)
              },
            }}
            sorting={{
              sortBy: sorting.sortBy,
              sortDir: sorting.sortDir,
              onSortChange: (newSortBy, newSortDir) => {
                setSorting({ sortBy: newSortBy, sortDir: newSortDir })
                setPage(0)
              },
            }}
          />
        </CardContent>
      </Card>

      <ExtraServiceDialog
        key={dialogKey}
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        extraService={editingService}
      />

    </div>
  )
}
