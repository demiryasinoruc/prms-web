import { useState } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { type ColumnDef } from "@tanstack/react-table"
import {
  Plus,
  Search,
  Package,
  Pencil,
  Trash2,
  Warehouse,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { useInventory, useDeleteInventory } from "./hooks"
import { WarehouseSelect } from "@/components/shared/warehouse-select"
import { InventoryDialog } from "./inventory-dialog"
import { InventoryDetailSheet } from "./inventory-detail-sheet"
import {
  InventoryStatus,
  InventoryStatusLabels,
  type Inventory,
} from "./api"
import { usePermission } from "@/hooks/use-permission"
import { Permissions } from "@/lib/permissions"

export default function InventoryPage() {
  const canCreate = usePermission(Permissions.Inventory.Create)
  const canUpdate = usePermission(Permissions.Inventory.Update)
  const canDelete = usePermission(Permissions.Inventory.Delete)

  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 400)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [warehouseFilter, setWarehouseFilter] = useState<string>("all")
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [sorting, setSorting] = useState<{
    sortBy: string | null
    sortDir: "asc" | "desc" | null
  }>({ sortBy: null, sortDir: null })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingInventory, setEditingInventory] = useState<Inventory | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [detailInventoryId, setDetailInventoryId] = useState<string | null>(null)

  const { data, isLoading } = useInventory({
    pageNumber: page + 1,
    pageSize,
    searchTerm: debouncedSearch || undefined,
    status: statusFilter !== "all" ? Number(statusFilter) as InventoryStatus : undefined,
    warehouseId: warehouseFilter !== "all" ? warehouseFilter : undefined,
    sortBy: sorting.sortBy || undefined,
    sortDir: sorting.sortDir || undefined,
  })

  const deleteInventory = useDeleteInventory()

  const handleEdit = (inventory: Inventory) => {
    setEditingInventory(inventory)
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setDeleteId(id)
  }

  const confirmDelete = async () => {
    if (deleteId) {
      await deleteInventory.mutateAsync(deleteId)
      setDeleteId(null)
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingInventory(null)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("tr-TR").format(value)
  }

  const getStatusVariant = (status: InventoryStatus) => {
    switch (status) {
      case InventoryStatus.Available:
        return "default"
      case InventoryStatus.Rented:
        return "secondary"
      case InventoryStatus.Maintenance:
        return "outline"
      case InventoryStatus.Broken:
        return "destructive"
      case InventoryStatus.Lost:
        return "destructive"
      case InventoryStatus.Disposed:
        return "secondary"
      case InventoryStatus.Reserved:
        return "outline"
      default:
        return "default"
    }
  }

  const columns: ColumnDef<Inventory>[] = [
    {
      accessorKey: "productName",
      header: "Ürün",
      enableSorting: true,
      cell: ({ row }) => (
        <button
          onClick={() => setDetailInventoryId(row.original.id)}
          className="flex items-center gap-2 text-left hover:underline"
        >
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <Package className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <span className="font-medium text-primary">{row.original.productName}</span>
            <p className="text-xs text-muted-foreground">
              {row.original.serialNumber || row.original.productCode}
            </p>
          </div>
        </button>
      ),
    },
    {
      accessorKey: "warehouseName",
      header: "Depo",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Warehouse className="h-4 w-4 text-muted-foreground" />
          {row.original.warehouseName}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Durum",
      enableSorting: true,
      cell: ({ row }) => (
        <Badge variant={getStatusVariant(row.original.status)}>
          {InventoryStatusLabels[row.original.status]}
        </Badge>
      ),
    },
    {
      accessorKey: "quantity",
      header: "Miktar",
      enableSorting: true,
      cell: ({ row }) => formatNumber(row.original.quantity),
    },
    {
      accessorKey: "currentUnitValue",
      header: "Birim Değer",
      enableSorting: true,
      cell: ({ row }) => `${formatNumber(row.original.currentUnitValue)} ₺`,
    },
    {
      accessorKey: "currentLifespan",
      header: "Kullanım",
      enableSorting: false,
      cell: ({ row }) =>
        row.original.currentLifespan != null
          ? formatNumber(row.original.currentLifespan)
          : "-",
    },
    {
      accessorKey: "expiryDate",
      header: "Son Kul. Tarihi",
      enableSorting: false,
      cell: ({ row }) =>
        row.original.expiryDate
          ? new Date(row.original.expiryDate).toLocaleDateString("tr-TR")
          : "-",
    },
    {
      accessorKey: "isActive",
      header: "Kayıt Durumu",
      enableSorting: false,
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
          <h1 className="text-2xl font-bold tracking-tight">Envanter</h1>
          <p className="text-muted-foreground">Stok durumunuzu takip edin</p>
        </div>
        {canCreate && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Envanter
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stok Listesi</CardTitle>
          <CardDescription>
            Toplam {data?.totalCount || 0} envanter kaydı
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Envanter ara..."
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(0)
                }}
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(0) }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                {Object.entries(InventoryStatusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <WarehouseSelect
              value={warehouseFilter === "all" ? null : warehouseFilter}
              onChange={(v) => {
                setWarehouseFilter(v || "all")
                setPage(0)
              }}
              filterMode
              triggerClassName="w-[180px]"
            />
          </div>

          <DataTable
            columns={columns}
            data={data?.data || []}
            isLoading={isLoading}
            emptyMessage="Henüz envanter kaydı yok"
            pagination={{
              pageIndex: page,
              pageSize,
              pageCount: Math.ceil((data?.totalCount || 0) / pageSize),
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

      <InventoryDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        inventory={editingInventory}
      />

      <InventoryDetailSheet
        open={!!detailInventoryId}
        onOpenChange={(open) => !open && setDetailInventoryId(null)}
        inventoryId={detailInventoryId}
        onEdit={(inventory) => {
          setDetailInventoryId(null)
          setEditingInventory({
            id: inventory.id,
            productId: inventory.productId,
            productName: inventory.productName,
            productCode: inventory.productCode,
            productVariantId: inventory.productVariantId ?? null,
            productVariantSku: inventory.productVariantSku ?? null,
            warehouseId: inventory.warehouseId,
            warehouseName: inventory.warehouseName,
            status: inventory.status,
            serialNumber: inventory.serialNumber,
            quantity: inventory.quantity,
            currentUnitValue: inventory.currentUnitValue,
            currentLifespan: inventory.currentLifespan,
            lifespanUnitTypeName: inventory.lifespanUnitTypeName,
            lastMaintenanceDate: inventory.lastMaintenanceDate,
            expiryDate: inventory.expiryDate,
            isActive: inventory.isActive,
          })
          setDialogOpen(true)
        }}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Envanter kaydını silmek istediğinize emin misiniz?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Envanter kaydı kalıcı olarak silinecektir.
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
