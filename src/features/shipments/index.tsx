import { useState, useMemo } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { type ColumnDef } from "@tanstack/react-table"
import { Truck, Eye, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { WarehouseSelect } from "@/components/shared/warehouse-select"
import { useRentalShipments, useDeleteRentalShipment } from "./hooks"
import { ShipmentDialog } from "./shipment-dialog"
import { ShipmentDetailSheet } from "./shipment-detail-sheet"
import {
  ShipmentStatus,
  ShipmentStatusLabels,
  ShipmentStatusClass,
  ShipmentFulfillmentType,
  ShipmentFulfillmentTypeLabels,
  type RentalShipment,
} from "./api"
import { usePermission } from "@/hooks/use-permission"
import { useDialogResetKey } from "@/hooks/use-dialog-reset-key"
import { Permissions } from "@/lib/permissions"

export default function ShipmentsPage() {
  const canUpdate = usePermission(Permissions.Rental.Update)
  const canDelete = usePermission(Permissions.Rental.Delete)

  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 400)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sourceFilter, setSourceFilter] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [sorting, setSorting] = useState<{
    sortBy: string | null
    sortDir: "asc" | "desc" | null
  }>({ sortBy: null, sortDir: null })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const dialogKey = useDialogResetKey(dialogOpen)
  const [detailId, setDetailId] = useState<string | null>(null)

  const { data, isLoading } = useRentalShipments({
    pageNumber: page + 1,
    pageSize,
    searchTerm: debouncedSearch || undefined,
    status: statusFilter !== "all" ? (Number(statusFilter) as ShipmentStatus) : undefined,
    sourceWarehouseId: sourceFilter || undefined,
    fulfillmentType:
      typeFilter !== "all" ? (Number(typeFilter) as ShipmentFulfillmentType) : undefined,
    sortBy: sorting.sortBy || undefined,
    sortDir: sorting.sortDir || undefined,
  })

  const deleteShipment = useDeleteRentalShipment()

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const handleEdit = (id: string) => {
    setDetailId(null)
    setEditId(id)
    setDialogOpen(true)
  }

  const columns: ColumnDef<RentalShipment>[] = useMemo(
    () => [
      {
        accessorKey: "shipmentNumber",
        header: "Sevkiyat No",
        enableSorting: true,
        cell: ({ row }) => (
          <button
            onClick={() => setDetailId(row.original.id)}
            className="flex items-center gap-2 text-left hover:underline"
          >
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <Truck className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="font-medium text-primary">{row.original.shipmentNumber}</span>
          </button>
        ),
      },
      {
        accessorKey: "rentalNumber",
        header: "Kiralama No",
        enableSorting: true,
        cell: ({ row }) => <span className="text-sm">{row.original.rentalNumber}</span>,
      },
      {
        accessorKey: "sourceWarehouseName",
        header: "Kaynak Depo",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm">{row.original.sourceWarehouseName}</span>
        ),
      },
      {
        accessorKey: "fulfillmentType",
        header: "Tip",
        enableSorting: false,
        cell: ({ row }) => (
          <Badge variant="outline">
            {ShipmentFulfillmentTypeLabels[row.original.fulfillmentType]}
          </Badge>
        ),
      },
      {
        accessorKey: "status",
        header: "Durum",
        enableSorting: true,
        cell: ({ row }) => (
          <Badge variant="outline" className={ShipmentStatusClass[row.original.status]}>
            {ShipmentStatusLabels[row.original.status]}
          </Badge>
        ),
      },
      {
        accessorKey: "plannedDate",
        header: "Planlı Tarih",
        enableSorting: true,
        cell: ({ row }) => formatDate(row.original.plannedDate),
      },
      {
        accessorKey: "vehicleName",
        header: "Araç",
        enableSorting: false,
        cell: ({ row }) => row.original.vehicleName || "-",
      },
      {
        accessorKey: "employeeName",
        header: "Personel",
        enableSorting: false,
        cell: ({ row }) => row.original.employeeName || "-",
      },
      {
        accessorKey: "itemCount",
        header: "Kalem",
        enableSorting: false,
        cell: ({ row }) => <Badge variant="outline">{row.original.itemCount} kalem</Badge>,
      },
      {
        id: "actions",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Detay"
              onClick={() => setDetailId(row.original.id)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {canUpdate && row.original.status === ShipmentStatus.Planned && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Düzenle"
                onClick={() => handleEdit(row.original.id)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {canDelete &&
              (row.original.status === ShipmentStatus.Planned ||
                row.original.status === ShipmentStatus.Cancelled) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  title="Sil"
                  onClick={() => {
                    if (
                      window.confirm(
                        `${row.original.shipmentNumber} numaralı sevkiyatı silmek istediğinize emin misiniz?`,
                      )
                    ) {
                      deleteShipment.mutate(row.original.id)
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
          </div>
        ),
      },
    ],
    [canDelete, canUpdate],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sevkiyatlar"
        description="Kiralamalara bağlı depo sevkiyatlarını yönetin"
      />

      <Card>
        <CardHeader>
          <CardTitle>Sevkiyat Listesi</CardTitle>
          <CardDescription>Toplam {data?.totalCount || 0} sevkiyat kaydı</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            <SearchInput
              value={search}
              onChange={(value) => {
                setSearch(value)
                setPage(0)
              }}
              placeholder="Sevkiyat no ara..."
            />
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value)
                setPage(0)
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                {Object.entries(ShipmentStatusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <WarehouseSelect
              filterMode
              value={sourceFilter}
              onChange={(v) => {
                setSourceFilter(v)
                setPage(0)
              }}
              allLabel="Tüm Depolar"
              placeholder="Kaynak Depo"
            />
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value)
                setPage(0)
              }}
            >
              <SelectTrigger className="w-[190px]">
                <SelectValue placeholder="Tip" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Tipler</SelectItem>
                {Object.entries(ShipmentFulfillmentTypeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DataTable
            columns={columns}
            data={data?.items || []}
            isLoading={isLoading}
            emptyMessage="Henüz sevkiyat kaydı yok"
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

      <ShipmentDialog
        key={dialogKey}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditId(null)
        }}
        editId={editId}
      />

      <ShipmentDetailSheet
        open={!!detailId}
        onOpenChange={(open) => !open && setDetailId(null)}
        shipmentId={detailId}
        onEdit={handleEdit}
      />
    </div>
  )
}
