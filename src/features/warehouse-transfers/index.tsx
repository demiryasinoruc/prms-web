import { useState, useMemo } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { type ColumnDef } from "@tanstack/react-table"
import { ArrowRightLeft, Eye, Pencil, Trash2 } from "lucide-react"
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
import { useWarehouseTransfers, useDeleteWarehouseTransfer } from "./hooks"
import { WarehouseTransferDialog } from "./warehouse-transfer-dialog"
import { WarehouseTransferDetailSheet } from "./warehouse-transfer-detail-sheet"
import {
  TransferStatus,
  TransferStatusLabels,
  TransferStatusClass,
  type WarehouseTransfer,
} from "./api"
import { usePermission } from "@/hooks/use-permission"
import { useDialogResetKey } from "@/hooks/use-dialog-reset-key"
import { Permissions } from "@/lib/permissions"

export default function WarehouseTransfersPage() {
  const canCreate = usePermission(Permissions.Inventory.Create)
  const canUpdate = usePermission(Permissions.Inventory.Update)
  const canDelete = usePermission(Permissions.Inventory.Delete)

  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 400)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sourceFilter, setSourceFilter] = useState<string | null>(null)
  const [destinationFilter, setDestinationFilter] = useState<string | null>(null)
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

  const { data, isLoading } = useWarehouseTransfers({
    pageNumber: page + 1,
    pageSize,
    searchTerm: debouncedSearch || undefined,
    status: statusFilter !== "all" ? (Number(statusFilter) as TransferStatus) : undefined,
    sourceWarehouseId: sourceFilter || undefined,
    destinationWarehouseId: destinationFilter || undefined,
    sortBy: sorting.sortBy || undefined,
    sortDir: sorting.sortDir || undefined,
  })

  const deleteTransfer = useDeleteWarehouseTransfer()

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

  const columns: ColumnDef<WarehouseTransfer>[] = useMemo(
    () => [
      {
        accessorKey: "transferNumber",
        header: "Transfer No",
        enableSorting: true,
        cell: ({ row }) => (
          <button
            onClick={() => setDetailId(row.original.id)}
            className="flex items-center gap-2 text-left hover:underline"
          >
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="font-medium text-primary">{row.original.transferNumber}</span>
          </button>
        ),
      },
      {
        id: "route",
        header: "Kaynak → Hedef",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.sourceWarehouseName}
            <span className="text-muted-foreground"> → </span>
            {row.original.destinationWarehouseName}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Durum",
        enableSorting: true,
        cell: ({ row }) => (
          <Badge variant="outline" className={TransferStatusClass[row.original.status]}>
            {TransferStatusLabels[row.original.status]}
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
            {canUpdate && row.original.status === TransferStatus.Planned && (
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
              (row.original.status === TransferStatus.Planned ||
                row.original.status === TransferStatus.Cancelled) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  title="Sil"
                  onClick={() => {
                    if (
                      window.confirm(
                        `${row.original.transferNumber} numaralı transferi silmek istediğinize emin misiniz?`,
                      )
                    ) {
                      deleteTransfer.mutate(row.original.id)
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
        title="Depo Transferleri"
        description="Depolar arası stok taşıma (depo → depo). Kiralama teslimatı için Sevkiyatlar'ı kullanın."
        action={{
          label: "Yeni Transfer",
          onClick: () => setDialogOpen(true),
          permission: canCreate,
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Transfer Listesi</CardTitle>
          <CardDescription>Toplam {data?.totalCount || 0} transfer kaydı</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            <SearchInput
              value={search}
              onChange={(value) => {
                setSearch(value)
                setPage(0)
              }}
              placeholder="Transfer no ara..."
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
                {Object.entries(TransferStatusLabels).map(([key, label]) => (
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
            <WarehouseSelect
              filterMode
              value={destinationFilter}
              onChange={(v) => {
                setDestinationFilter(v)
                setPage(0)
              }}
              allLabel="Tüm Depolar"
              placeholder="Hedef Depo"
            />
          </div>

          <DataTable
            columns={columns}
            data={data?.items || []}
            isLoading={isLoading}
            emptyMessage="Henüz transfer kaydı eklenmemiş"
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

      <WarehouseTransferDialog
        key={dialogKey}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditId(null)
        }}
        editId={editId}
      />

      <WarehouseTransferDetailSheet
        open={!!detailId}
        onOpenChange={(open) => !open && setDetailId(null)}
        transferId={detailId}
        onEdit={handleEdit}
      />
    </div>
  )
}
