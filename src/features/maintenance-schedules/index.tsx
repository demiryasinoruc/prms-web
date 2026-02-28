import { useState } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { type ColumnDef } from "@tanstack/react-table"
import {
  Wrench,
  Calendar,
  Gauge,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { SearchInput } from "@/components/shared/search-input"
import { StatusFilterSelect } from "@/components/shared/status-filter-select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/data-table"
import { CategoryFilterSelect } from "@/components/shared/category-filter-select"
import { useMaintenanceSchedules, useDeleteMaintenanceSchedule } from "./hooks"
import { MaintenanceScheduleDialog } from "./maintenance-schedule-dialog"
import type { MaintenanceSchedule } from "./api"
import { MaintenanceTriggerType } from "./api"
import { usePermission } from "@/hooks/use-permission"
import { Permissions } from "@/lib/permissions"
import { createActionButtonsColumn, createStatusBadgeColumn } from "@/components/shared/column-helpers"

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

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingSchedule(null)
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
    createStatusBadgeColumn<MaintenanceSchedule>({ enableSorting: true }),
    createActionButtonsColumn<MaintenanceSchedule>({
      onEdit: handleEdit,
      onDelete: (id) => deleteSchedule.mutateAsync(id),
      getId: (row) => row.id,
      canUpdate,
      canDelete,
    }),
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bakım Planları"
        description="Kategori ve ürün bazlı periyodik bakım planlarını yönetin"
        action={{ label: "Yeni Bakım Planı", onClick: () => setDialogOpen(true), permission: canCreate }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Bakım Planı Listesi</CardTitle>
          <CardDescription>
            Toplam {data?.totalCount || 0} bakım planı
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            <SearchInput
              value={search}
              onChange={(value) => { setSearch(value); setPage(0) }}
              placeholder="Bakım planı ara..."
            />
            <CategoryFilterSelect
              value={categoryFilter || null}
              onChange={(v) => {
                setCategoryFilter(v || undefined)
                setPage(0)
              }}
              filterMode
              triggerClassName="w-[180px]"
            />
            <StatusFilterSelect value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(0) }} />
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

    </div>
  )
}
