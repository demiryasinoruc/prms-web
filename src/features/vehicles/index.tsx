import { useState } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { type ColumnDef } from "@tanstack/react-table"
import {
  Truck,
} from "lucide-react"
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
import { PageHeader } from "@/components/shared/page-header"
import { SearchInput } from "@/components/shared/search-input"
import { useVehicles, useDeleteVehicle } from "./hooks"
import { WarehouseSelect } from "@/components/shared/warehouse-select"
import { VehicleDialog } from "./vehicle-dialog"
import { VehicleDetailSheet } from "./vehicle-detail-sheet"
import { VehicleType, VehicleStatus, type Vehicle } from "@/types/api"
import { usePermission } from "@/hooks/use-permission"
import { Permissions } from "@/lib/permissions"
import { createActionButtonsColumn } from "@/components/shared/column-helpers"
import { useDialogResetKey } from "@/hooks/use-dialog-reset-key"

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
  const dialogKey = useDialogResetKey(dialogOpen)
  const [detailVehicleId, setDetailVehicleId] = useState<string | null>(null)

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
    createActionButtonsColumn<Vehicle>({
      onEdit: handleEdit,
      onDelete: (id) => deleteVehicle.mutateAsync(id),
      getId: (row) => row.id,
      canUpdate,
      canDelete,
      entityName: "Araç",
    }),
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Araçlar"
        description="Araç filonuzu yönetin"
        action={{ label: "Yeni Araç", onClick: () => setDialogOpen(true), permission: canCreate }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Araç Listesi</CardTitle>
          <CardDescription>
            Toplam {data?.totalCount || 0} araç kaydı
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            <SearchInput
              value={search}
              onChange={(value) => { setSearch(value); setPage(0) }}
              placeholder="Araç ara..."
            />
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
            <WarehouseSelect
              value={warehouseFilter || null}
              onChange={(v) => {
                setWarehouseFilter(v || undefined)
                setPage(0)
              }}
              filterMode
              triggerClassName="w-[180px]"
            />
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
        key={dialogKey}
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

    </div>
  )
}
