import { useState, useMemo } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { type ColumnDef } from "@tanstack/react-table"
import {
  Plus,
  FileText,
  Trash2,
  AlertTriangle,
  Eye,
  Search,
  Pencil,
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
import { useRentals, useDeleteRental } from "./hooks"
import { RentalDialog } from "./rental-dialog"
import { RentalDetailSheet } from "./rental-detail-sheet"
import {
  RentalStatus,
  RentalStatusLabels,
  RentalFlag,
  type Rental,
} from "./api"
import { DeliveryType } from "@/features/company/api"
import { usePermission } from "@/hooks/use-permission"
import { Permissions } from "@/lib/permissions"

export default function RentalsPage() {
  const canCreate = usePermission(Permissions.Rental.Create)
  const canUpdate = usePermission(Permissions.Rental.Update)
  const canDelete = usePermission(Permissions.Rental.Delete)

  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 400)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [sorting, setSorting] = useState<{ sortBy: string | null; sortDir: "asc" | "desc" | null }>({
    sortBy: null,
    sortDir: null,
  })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [detailRentalId, setDetailRentalId] = useState<string | null>(null)

  const { data, isLoading } = useRentals({
    pageNumber: page + 1,
    pageSize,
    searchTerm: debouncedSearch || undefined,
    status: statusFilter !== "all" ? Number(statusFilter) as RentalStatus : undefined,
    sortBy: sorting.sortBy || undefined,
    sortDir: sorting.sortDir || undefined,
  })

  const deleteRental = useDeleteRental()

  const handleDelete = (id: string) => {
    setDeleteId(id)
  }

  const confirmDelete = async () => {
    if (deleteId) {
      await deleteRental.mutateAsync(deleteId)
      setDeleteId(null)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(amount)
  }

  const getStatusVariant = (status: RentalStatus) => {
    switch (status) {
      case RentalStatus.Draft:
        return "secondary"
      case RentalStatus.Reservation:
        return "outline"
      case RentalStatus.Active:
        return "default"
      case RentalStatus.PartialReturn:
        return "outline"
      case RentalStatus.Waiting:
        return "secondary"
      case RentalStatus.Completed:
        return "default"
      case RentalStatus.Cancelled:
        return "destructive"
      default:
        return "default"
    }
  }

  const hasFlag = (flags: RentalFlag, flag: RentalFlag) => (flags & flag) === flag

  const columns: ColumnDef<Rental>[] = useMemo(
    () => [
      {
        accessorKey: "rentalNumber",
        header: "Kiralama No",
        enableSorting: true,
        cell: ({ row }) => (
          <button
            onClick={() => setDetailRentalId(row.original.id)}
            className="flex items-center gap-2 text-left hover:underline"
          >
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <span className="font-medium text-primary">{row.original.rentalNumber}</span>
              <p className="text-xs text-muted-foreground">{row.original.customerName}</p>
            </div>
          </button>
        ),
      },
      {
        accessorKey: "status",
        header: "Durum",
        enableSorting: true,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            <Badge variant={getStatusVariant(row.original.status)}>
              {RentalStatusLabels[row.original.status]}
            </Badge>
            {hasFlag(row.original.flags, RentalFlag.StartDelayed) && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
              </Badge>
            )}
            {hasFlag(row.original.flags, RentalFlag.ReturnDelayed) && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
              </Badge>
            )}
          </div>
        ),
      },
      {
        accessorKey: "deliveryType",
        header: "Teslimat",
        enableSorting: true,
        cell: ({ row }) => (
          <Badge variant={row.original.deliveryType === DeliveryType.CompanyDelivery ? "default" : "secondary"}>
            {row.original.deliveryType === DeliveryType.CompanyDelivery
              ? "Teslimat Var"
              : "Müşteri Alacak"}
          </Badge>
        ),
      },
      {
        accessorKey: "plannedStartDate",
        header: "Başlangıç",
        enableSorting: true,
        cell: ({ row }) => (
          <div>
            <p>{formatDate(row.original.plannedStartDate)}</p>
            {row.original.actualStartDate && (
              <p className="text-xs text-muted-foreground">
                Gerçek: {formatDate(row.original.actualStartDate)}
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: "plannedEndDate",
        header: "Bitiş",
        enableSorting: true,
        cell: ({ row }) => (
          <div>
            <p>{formatDate(row.original.plannedEndDate)}</p>
            {row.original.actualEndDate && (
              <p className="text-xs text-muted-foreground">
                Gerçek: {formatDate(row.original.actualEndDate)}
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: "itemCount",
        header: "Kalem",
        enableSorting: false,
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.itemCount} ürün</Badge>
        ),
      },
      {
        accessorKey: "totalAmount",
        header: "Tutar",
        enableSorting: true,
        cell: ({ row }) => {
          const { totalAmount, depositAmount, paidAmount } = row.original
          // Kalan bakiye = kiralama tutarı - ödenen (depozito ayrı, zaten tahsil edilmiş güvence)
          const remainingBalance = totalAmount - paidAmount

          return (
            <div>
              <p className="font-medium">{formatPrice(totalAmount)}</p>
              {depositAmount > 0 && (
                <p className="text-xs text-muted-foreground">
                  Depozito: {formatPrice(depositAmount)}
                </p>
              )}
              <p className={`text-xs ${remainingBalance > 0 ? "text-orange-600" : "text-green-600"}`}>
                {remainingBalance > 0
                  ? `Kalan: ${formatPrice(remainingBalance)}`
                  : "Ödendi"}
              </p>
            </div>
          )
        },
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
              onClick={() => setDetailRentalId(row.original.id)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {canUpdate && (row.original.status === RentalStatus.Draft || row.original.status === RentalStatus.Reservation) && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Düzenle"
                onClick={() => {
                  setEditId(row.original.id)
                  setDialogOpen(true)
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {canDelete && (row.original.status === RentalStatus.Draft || row.original.status === RentalStatus.Cancelled) && (
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
    ],
    [canDelete, canUpdate]
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kiralamalar</h1>
          <p className="text-muted-foreground">
            Kiralama işlemlerinizi yönetin
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Kiralama
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kiralama Listesi</CardTitle>
          <CardDescription>
            Toplam {data?.totalCount || 0} kiralama kaydı
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Kiralama no veya müşteri ara..."
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
                {Object.entries(RentalStatusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DataTable
            columns={columns}
            data={data?.items || []}
            isLoading={isLoading}
            emptyMessage="Henüz kiralama işlemi yok"
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

      <RentalDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditId(null)
        }}
        editId={editId}
      />

      <RentalDetailSheet
        open={!!detailRentalId}
        onOpenChange={(open) => !open && setDetailRentalId(null)}
        rentalId={detailRentalId}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kiralamayı silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Kiralama kalıcı olarak silinecektir.
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
