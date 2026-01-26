import { useState, useMemo } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { type ColumnDef } from "@tanstack/react-table"
import {
  Plus,
  Pencil,
  Trash2,
  Sparkles,
  Search,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useExtraServices, useDeleteExtraService, usePricePeriods, useCertificates } from "./hooks"
import { ExtraServiceDialog } from "./extra-service-dialog"
import type { ExtraService, ExtraServiceFilters, ExtraServiceParams } from "./api"
import { usePermission } from "@/hooks/use-permission"
import { Permissions } from "@/lib/permissions"

export default function ExtraServicesPage() {
  const canCreate = usePermission(Permissions.ExtraServices.Create)
  const canUpdate = usePermission(Permissions.ExtraServices.Update)
  const canDelete = usePermission(Permissions.ExtraServices.Delete)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<ExtraService | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

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

  const handleDelete = (id: string) => {
    setDeleteId(id)
  }

  const confirmDelete = async () => {
    if (deleteId) {
      await deleteService.mutateAsync(deleteId)
      setDeleteId(null)
    }
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

  const updateFilter = (key: keyof ExtraServiceFilters, value: string | boolean | undefined) => {
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
      accessorKey: "isActive",
      header: "Durum",
      enableSorting: true,
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "default" : "secondary"}>
          {row.original.isActive ? "Aktif" : "Pasif"}
        </Badge>
      ),
    },
    {
      id: "actions",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          {canUpdate && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Düzenle"
              onClick={() => handleEdit(row.original)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              title="Sil"
              onClick={() => handleDelete(row.original.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ek Hizmetler</h1>
          <p className="text-muted-foreground">
            Kiralama işlemlerine eklenebilecek ek hizmetleri yönetin
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Ek Hizmet
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ek Hizmet Listesi</CardTitle>
          <CardDescription>
            Toplam {totalCount} ek hizmet kaydı
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:flex-wrap mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Ek hizmet ara..."
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(0)
                }}
              />
            </div>
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
              value={filters.isActive === undefined ? "all" : filters.isActive ? "active" : "inactive"}
              onValueChange={(value) => updateFilter("isActive", value === "all" ? undefined : value === "active")}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Pasif</SelectItem>
              </SelectContent>
            </Select>
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
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        extraService={editingService}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ek hizmeti silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Ek hizmet kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
