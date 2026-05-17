import { useState } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { type ColumnDef } from "@tanstack/react-table"
import {
  Warehouse,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DataTable } from "@/components/data-table"
import { PageHeader } from "@/components/shared/page-header"
import { SearchInput } from "@/components/shared/search-input"
import { StatusFilterSelect } from "@/components/shared/status-filter-select"
import { useWarehouses, useDeleteWarehouse } from "./hooks"
import { WarehouseDialog } from "./warehouse-dialog"
import { WarehouseDetailSheet } from "./warehouse-detail-sheet"
import type { Warehouse as WarehouseType } from "@/types/api"
import { usePermission } from "@/hooks/use-permission"
import { Permissions } from "@/lib/permissions"
import { createActionButtonsColumn, createStatusBadgeColumn } from "@/components/shared/column-helpers"
import { useDialogResetKey } from "@/hooks/use-dialog-reset-key"

export default function WarehousesPage() {
  const canCreate = usePermission(Permissions.Warehouse.Create)
  const canUpdate = usePermission(Permissions.Warehouse.Update)
  const canDelete = usePermission(Permissions.Warehouse.Delete)

  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 400)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [sorting, setSorting] = useState<{ sortBy: string | null; sortDir: "asc" | "desc" | null }>({
    sortBy: null,
    sortDir: null,
  })
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseType | null>(null)
  const [detailWarehouseId, setDetailWarehouseId] = useState<string | null>(null)
  const dialogKey = useDialogResetKey(dialogOpen)

  const { data, isLoading } = useWarehouses({
    pageNumber: page + 1,
    pageSize,
    searchTerm: debouncedSearch || undefined,
    sortBy: sorting.sortBy || undefined,
    sortDir: sorting.sortDir || undefined,
    isActive: statusFilter,
  })

  const deleteWarehouse = useDeleteWarehouse()

  const handleEdit = (warehouse: WarehouseType) => {
    setEditingWarehouse(warehouse)
    setDialogOpen(true)
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingWarehouse(null)
  }

  const columns: ColumnDef<WarehouseType>[] = [
    {
      accessorKey: "name",
      header: "Depo Adı",
      enableSorting: true,
      cell: ({ row }) => (
        <button
          onClick={() => setDetailWarehouseId(row.original.id)}
          className="flex items-center gap-2 text-left hover:underline"
        >
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="font-medium text-primary">{row.original.name}</span>
        </button>
      ),
    },
    {
      accessorKey: "address",
      header: "Adres",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-muted-foreground truncate max-w-[300px] block">
          {row.original.address || "-"}
        </span>
      ),
    },
    {
      accessorKey: "contactInfo",
      header: "İletişim",
      enableSorting: true,
      cell: ({ row }) => row.original.contactInfo || "-",
    },
    createStatusBadgeColumn<WarehouseType>({ enableSorting: true }),
    createActionButtonsColumn<WarehouseType>({
      onEdit: handleEdit,
      onDelete: (id) => deleteWarehouse.mutateAsync(id),
      getId: (row) => row.id,
      canUpdate,
      canDelete,
      entityName: "Depo",
    }),
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Depolar"
        description="Depo ve şube lokasyonlarını yönetin"
        action={{ label: "Yeni Depo", onClick: () => setDialogOpen(true), permission: canCreate }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Depo Listesi</CardTitle>
          <CardDescription>
            Toplam {data?.totalCount || 0} depo kaydı
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            <SearchInput
              value={search}
              onChange={(value) => { setSearch(value); setPage(0) }}
              placeholder="Depo ara..."
            />
            <StatusFilterSelect
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setPage(0) }}
            />
          </div>

          <DataTable
            columns={columns}
            data={data?.items || []}
            isLoading={isLoading}
            emptyMessage="Henüz depo eklenmemiş"
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

      <WarehouseDialog
        key={dialogKey}
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        warehouse={editingWarehouse}
      />

      <WarehouseDetailSheet
        open={!!detailWarehouseId}
        onOpenChange={(open) => !open && setDetailWarehouseId(null)}
        warehouseId={detailWarehouseId}
        onEdit={(warehouse) => {
          setEditingWarehouse(warehouse)
          setDialogOpen(true)
        }}
      />
    </div>
  )
}
