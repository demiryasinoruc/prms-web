import { useState } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { type ColumnDef } from "@tanstack/react-table"
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Truck,
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
import { useVehicles, useDeleteVehicle } from "./hooks"
import { useWarehouseSelect } from "../warehouses/hooks"
import { VehicleDialog } from "./vehicle-dialog"
import { VehicleDetailSheet } from "./vehicle-detail-sheet"
import { VehicleType, VehicleStatus, type Vehicle } from "@/types/api"
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
import { usePermission } from "@/hooks/use-permission"
import { Permissions } from "@/lib/permissions"

const vehicleTypeLabels: Record<VehicleType, string> = {
  [VehicleType.Truck]: "Kamyon",
  [VehicleType.Van]: "Kamyonet",
  [VehicleType.Minibus]: "Minibüs",
  [VehicleType.Car]: "Binek",
  [VehicleType.Other]: "Diğer",
}

const vehicleStatusLabels: Record<VehicleStatus, string> = {
  [VehicleStatus.Available]: "Müsait",
  [VehicleStatus.InTransit]: "Teslimat'ta",
  [VehicleStatus.Maintenance]: "Bakımda",
  [VehicleStatus.Broken]: "Arızalı",
}

const vehicleStatusVariants: Record<VehicleStatus, "default" | "secondary" | "destructive" | "outline"> = {
  [VehicleStatus.Available]: "default",
  [VehicleStatus.InTransit]: "secondary",
  [VehicleStatus.Maintenance]: "outline",
  [VehicleStatus.Broken]: "destructive",
}

export default function VehiclesPage() {
  const canCreate = usePermission(Permissions.Vehicle.Create)
  const canUpdate = usePermission(Permissions.Vehicle.Update)
  const canDelete = usePermission(Permissions.Vehicle.Delete)

  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 400)
  const [vehicleType, setVehicleType] = useState<string>("all")
  const [status, setStatus] = useState<string>("all")
  const [warehouseFilter, setWarehouseFilter] = useState<string | undefined>(undefined)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [sorting, setSorting] = useState<{ sortBy: string | null; sortDir: "asc" | "desc" | null }>({
    sortBy: null,
    sortDir: null,
  })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [detailVehicleId, setDetailVehicleId] = useState<string | null>(null)

  const { data: warehouses } = useWarehouseSelect()

  const { data, isLoading } = useVehicles({
    pageNumber: page + 1,
    pageSize,
    searchTerm: debouncedSearch || undefined,
    vehicleType: vehicleType !== "all" ? Number(vehicleType) : undefined,
    status: status !== "all" ? Number(status) : undefined,
    warehouseId: warehouseFilter,
    sortBy: sorting.sortBy || undefined,
    sortDir: sorting.sortDir || undefined,
  })

  const deleteVehicle = useDeleteVehicle()

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setDeleteId(id)
  }

  const confirmDelete = async () => {
    if (deleteId) {
      await deleteVehicle.mutateAsync(deleteId)
      setDeleteId(null)
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingVehicle(null)
  }

  const columns: ColumnDef<Vehicle>[] = [
    {
      accessorKey: "plate",
      header: "Plaka",
      enableSorting: true,
      cell: ({ row }) => (
        <button
          onClick={() => setDetailVehicleId(row.original.id)}
          className="flex items-center gap-2 text-left hover:underline"
        >
          <Truck className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-primary">{row.original.plate}</span>
        </button>
      ),
    },
    {
      accessorKey: "brandName",
      header: "Marka / Model",
      enableSorting: true,
      cell: ({ row }) => (
        <div>
          <span className="font-medium">{row.original.brandName}</span>
          <span className="text-muted-foreground ml-1">{row.original.model}</span>
        </div>
      ),
    },
    {
      accessorKey: "vehicleType",
      header: "Tip",
      enableSorting: true,
      cell: ({ row }) => (
        <Badge variant="outline">
          {vehicleTypeLabels[row.original.vehicleType]}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Durum",
      enableSorting: true,
      cell: ({ row }) => (
        <Badge variant={vehicleStatusVariants[row.original.status]}>
          {vehicleStatusLabels[row.original.status]}
        </Badge>
      ),
    },
    {
      accessorKey: "warehouseName",
      header: "Depo",
      enableSorting: true,
      cell: ({ row }) => row.original.warehouseName || "-",
    },
    {
      accessorKey: "capacity",
      header: "Kapasite",
      enableSorting: false,
      cell: ({ row }) =>
        row.original.capacity
          ? `${row.original.capacity} ${row.original.capacityUnit || ""}`
          : "-",
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
          <h1 className="text-2xl font-bold tracking-tight">Araçlar</h1>
          <p className="text-muted-foreground">
            Araç filonuzu yönetin
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Araç
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Araç Listesi</CardTitle>
          <CardDescription>
            Toplam {data?.totalCount || 0} araç kaydı
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Araç ara..."
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(0)
                }}
              />
            </div>
            <Select
              value={vehicleType}
              onValueChange={(value) => {
                setVehicleType(value)
                setPage(0)
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Araç tipi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Tipler</SelectItem>
                <SelectItem value="1">Kamyon</SelectItem>
                <SelectItem value="2">Kamyonet</SelectItem>
                <SelectItem value="3">Minibüs</SelectItem>
                <SelectItem value="4">Binek</SelectItem>
                <SelectItem value="5">Diğer</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value)
                setPage(0)
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="1">Müsait</SelectItem>
                <SelectItem value="2">Teslimat'ta</SelectItem>
                <SelectItem value="3">Bakımda</SelectItem>
                <SelectItem value="4">Arızalı</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={warehouseFilter ?? "all"}
              onValueChange={(value) => {
                setWarehouseFilter(value === "all" ? undefined : value)
                setPage(0)
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Depo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Depolar</SelectItem>
                {warehouses?.map((wh) => (
                  <SelectItem key={wh.id} value={wh.id}>
                    {wh.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DataTable
            columns={columns}
            data={data?.items || []}
            isLoading={isLoading}
            emptyMessage="Henüz araç eklenmemiş"
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

      <VehicleDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        vehicle={editingVehicle}
      />

      <VehicleDetailSheet
        open={!!detailVehicleId}
        onOpenChange={(open) => !open && setDetailVehicleId(null)}
        vehicleId={detailVehicleId}
        onEdit={(vehicle) => {
          setEditingVehicle(vehicle)
          setDialogOpen(true)
        }}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aracı silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Araç ve ilişkili tüm veriler kalıcı olarak silinecektir.
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
