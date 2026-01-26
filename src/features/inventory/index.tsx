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
import { InventoryDialog } from "./inventory-dialog"
import { InventoryDetailSheet } from "./inventory-detail-sheet"
import {
  InventoryStatus,
  InventoryStatusLabels,
  type Inventory,
  type InventoryListParams,
} from "./api"
import { usePermission } from "@/hooks/use-permission"
import { Permissions } from "@/lib/permissions"

export default function InventoryPage() {
  const canCreate = usePermission(Permissions.Inventory.Create)
  const canUpdate = usePermission(Permissions.Inventory.Update)
  const canDelete = usePermission(Permissions.Inventory.Delete)

  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 400)
  const [statusFilter, setStatusFilter] = useState<InventoryStatus | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingInventory, setEditingInventory] = useState<Inventory | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [detailInventoryId, setDetailInventoryId] = useState<string | null>(null)

  // Status filtresi olmadan tüm veriyi çek (sayılar için)
  const params: InventoryListParams = {
    searchTerm: debouncedSearch || undefined,
  }

  const { data: allInventoryList, isLoading } = useInventory(params)

  // Client-side status filtreleme
  const inventoryList = statusFilter
    ? allInventoryList?.filter((i) => i.status === statusFilter)
    : allInventoryList
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

  // Durum sayıları (tüm veriden hesaplanır)
  const statusCounts = {
    all: allInventoryList?.length || 0,
    [InventoryStatus.Available]:
      allInventoryList?.filter((i) => i.status === InventoryStatus.Available).length || 0,
    [InventoryStatus.Rented]:
      allInventoryList?.filter((i) => i.status === InventoryStatus.Rented).length || 0,
    [InventoryStatus.Maintenance]:
      allInventoryList?.filter((i) => i.status === InventoryStatus.Maintenance).length || 0,
    [InventoryStatus.Broken]:
      allInventoryList?.filter((i) => i.status === InventoryStatus.Broken).length || 0,
  }

  const columns: ColumnDef<Inventory>[] = [
    {
      accessorKey: "productName",
      header: "Ürün",
      enableSorting: false,
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
      enableSorting: false,
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
      enableSorting: false,
      cell: ({ row }) => (
        <Badge variant={getStatusVariant(row.original.status)}>
          {InventoryStatusLabels[row.original.status]}
        </Badge>
      ),
    },
    {
      accessorKey: "quantity",
      header: "Miktar",
      enableSorting: false,
      cell: ({ row }) => formatNumber(row.original.quantity),
    },
    {
      accessorKey: "currentUnitValue",
      header: "Birim Değer",
      enableSorting: false,
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

      {/* Durum Filtreleri */}
      <div className="flex gap-2 flex-wrap">
        <Badge
          variant={statusFilter === null ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setStatusFilter(null)}
        >
          Tümü ({statusCounts.all})
        </Badge>
        <Badge
          variant={statusFilter === InventoryStatus.Available ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setStatusFilter(InventoryStatus.Available)}
        >
          Müsait ({statusCounts[InventoryStatus.Available]})
        </Badge>
        <Badge
          variant={statusFilter === InventoryStatus.Rented ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setStatusFilter(InventoryStatus.Rented)}
        >
          Kiralamada ({statusCounts[InventoryStatus.Rented]})
        </Badge>
        <Badge
          variant={statusFilter === InventoryStatus.Maintenance ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setStatusFilter(InventoryStatus.Maintenance)}
        >
          Bakımda ({statusCounts[InventoryStatus.Maintenance]})
        </Badge>
        <Badge
          variant={statusFilter === InventoryStatus.Broken ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setStatusFilter(InventoryStatus.Broken)}
        >
          Arızalı ({statusCounts[InventoryStatus.Broken]})
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stok Listesi</CardTitle>
          <CardDescription>
            Toplam {inventoryList?.length || 0} envanter kaydı
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
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <DataTable
            columns={columns}
            data={inventoryList || []}
            isLoading={isLoading}
            emptyMessage="Henüz envanter kaydı yok"
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
