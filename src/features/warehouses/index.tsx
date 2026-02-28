import { useState } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { type ColumnDef } from "@tanstack/react-table"
import {
  Plus,
  Pencil,
  Trash2,
  Warehouse,
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
import { SearchInput } from "@/components/shared/search-input"
import { StatusFilterSelect } from "@/components/shared/status-filter-select"
import { useWarehouses, useDeleteWarehouse } from "./hooks"
import { WarehouseDialog } from "./warehouse-dialog"
import { WarehouseDetailSheet } from "./warehouse-detail-sheet"
import type { Warehouse as WarehouseType } from "@/types/api"
import { usePermission } from "@/hooks/use-permission"
import { Permissions } from "@/lib/permissions"

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
              onClick={() => deleteWarehouse.mutateAsync(row.original.id)}
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
          <h1 className="text-2xl font-bold tracking-tight">Depolar</h1>
          <p className="text-muted-foreground">
            Depo ve şube lokasyonlarını yönetin
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Depo
          </Button>
        )}
      </div>

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
