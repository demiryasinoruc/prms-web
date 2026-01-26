import { useState } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { type ColumnDef } from "@tanstack/react-table"
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Wrench,
  Calendar,
  Gauge,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useMaintenanceSchedules, useDeleteMaintenanceSchedule } from "./hooks"
import { MaintenanceScheduleDialog } from "./maintenance-schedule-dialog"
import type { MaintenanceSchedule } from "./api"
import { MaintenanceTriggerType } from "./api"
import { usePermission } from "@/hooks/use-permission"
import { Permissions } from "@/lib/permissions"
import { useCategorySelect } from "@/features/categories/hooks"

export default function MaintenanceSchedulesPage() {
  const canCreate = usePermission(Permissions.MaintenanceSchedule.Create)
  const canUpdate = usePermission(Permissions.MaintenanceSchedule.Update)
  const canDelete = usePermission(Permissions.MaintenanceSchedule.Delete)

  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 400)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [sorting, setSorting] = useState<{ sortBy: string | null; sortDir: "asc" | "desc" | null }>({
    sortBy: null,
    sortDir: null,
  })

  // Filters
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined)
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<MaintenanceSchedule | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: categories } = useCategorySelect()

  const { data, isLoading } = useMaintenanceSchedules({
    pageNumber: page + 1,
    pageSize,
    searchTerm: debouncedSearch || undefined,
    sortBy: sorting.sortBy || undefined,
    sortDir: sorting.sortDir || undefined,
    isActive: statusFilter,
    categoryId: categoryFilter,
  })

  const deleteSchedule = useDeleteMaintenanceSchedule()

  const handleEdit = (schedule: MaintenanceSchedule) => {
    setEditingSchedule(schedule)
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setDeleteId(id)
  }

  const confirmDelete = async () => {
    if (deleteId) {
      await deleteSchedule.mutateAsync(deleteId)
      setDeleteId(null)
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingSchedule(null)
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value === "all" ? undefined : value === "active")
    setPage(0)
  }

  const handleCategoryFilterChange = (value: string) => {
    setCategoryFilter(value === "all" ? undefined : value)
    setPage(0)
  }

  const getTriggerIcon = (triggerType: MaintenanceTriggerType) => {
    switch (triggerType) {
      case MaintenanceTriggerType.Time:
        return <Calendar className="h-4 w-4" />
      case MaintenanceTriggerType.Usage:
        return <Gauge className="h-4 w-4" />
      case MaintenanceTriggerType.Both:
        return (
          <div className="flex gap-0.5">
            <Calendar className="h-3 w-3" />
            <Gauge className="h-3 w-3" />
          </div>
        )
      default:
        return null
    }
  }

  const columns: ColumnDef<MaintenanceSchedule>[] = [
    {
      accessorKey: "name",
      header: "Plan Adı",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium">{row.original.name}</span>
            <span className="text-xs text-muted-foreground">
              {row.original.maintenanceTypeName}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "target",
      header: "Hedef",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex flex-col">
          {row.original.categoryName && (
            <span className="text-sm">
              <span className="text-muted-foreground">Kategori:</span>{" "}
              {row.original.categoryName}
            </span>
          )}
          {row.original.productName && (
            <span className="text-sm">
              <span className="text-muted-foreground">Ürün:</span>{" "}
              {row.original.productName}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "triggerType",
      header: "Tetikleme",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {getTriggerIcon(row.original.triggerType)}
          <div className="flex flex-col">
            <span className="text-sm">{row.original.triggerTypeName}</span>
            <span className="text-xs text-muted-foreground">
              {row.original.triggerType === MaintenanceTriggerType.Time && row.original.dayInterval && (
                <>{row.original.dayInterval} gün</>
              )}
              {row.original.triggerType === MaintenanceTriggerType.Usage && row.original.usageInterval && (
                <>{row.original.usageInterval} birim</>
              )}
              {row.original.triggerType === MaintenanceTriggerType.Both && (
                <>
                  {row.original.dayInterval} gün / {row.original.usageInterval} birim
                </>
              )}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "inheritToChildren",
      header: "Miras",
      enableSorting: false,
      cell: ({ row }) => (
        row.original.categoryId && (
          <Badge variant={row.original.inheritToChildren ? "default" : "secondary"}>
            {row.original.inheritToChildren ? "Evet" : "Hayır"}
          </Badge>
        )
      ),
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
          <h1 className="text-2xl font-bold tracking-tight">Bakım Planları</h1>
          <p className="text-muted-foreground">
            Kategori ve ürün bazlı periyodik bakım planlarını yönetin
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Bakım Planı
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bakım Planı Listesi</CardTitle>
          <CardDescription>
            Toplam {data?.totalCount || 0} bakım planı
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Bakım planı ara..."
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(0)
                }}
              />
            </div>
            <Select
              value={categoryFilter || "all"}
              onValueChange={handleCategoryFilterChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Kategoriler</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter === undefined ? "all" : statusFilter ? "active" : "inactive"}
              onValueChange={handleStatusFilterChange}
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
            data={data?.items || []}
            isLoading={isLoading}
            emptyMessage="Henüz bakım planı eklenmemiş"
            pagination={{
              pageIndex: page,
              pageSize,
              pageCount: data?.totalPages || 0,
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

      <MaintenanceScheduleDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        schedule={editingSchedule}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Bakım planını silmek istediğinize emin misiniz?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Bakım planı kalıcı olarak silinecektir.
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
