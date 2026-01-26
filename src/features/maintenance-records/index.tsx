import { useState } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { type ColumnDef } from "@tanstack/react-table"
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ClipboardList,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  PlayCircle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useMaintenanceRecords, useDeleteMaintenanceRecord } from "./hooks"
import { MaintenanceRecordDialog } from "./maintenance-record-dialog"
import type { MaintenanceRecord } from "./api"
import {
  MaintenanceStatus,
  MaintenanceStatusLabels,
  MaintenanceType,
  MaintenanceTypeLabels,
} from "./api"
import { usePermission } from "@/hooks/use-permission"
import { Permissions } from "@/lib/permissions"

export default function MaintenanceRecordsPage() {
  const canCreate = usePermission(Permissions.MaintenanceRecord.Create)
  const canUpdate = usePermission(Permissions.MaintenanceRecord.Update)
  const canDelete = usePermission(Permissions.MaintenanceRecord.Delete)

  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 400)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [sorting, setSorting] = useState<{ sortBy: string | null; sortDir: "asc" | "desc" | null }>({
    sortBy: null,
    sortDir: null,
  })

  // Filters
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | undefined>(undefined)
  const [typeFilter, setTypeFilter] = useState<MaintenanceType | undefined>(undefined)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading } = useMaintenanceRecords({
    pageNumber: page + 1,
    pageSize,
    searchTerm: debouncedSearch || undefined,
    sortBy: sorting.sortBy || undefined,
    sortDir: sorting.sortDir || undefined,
    status: statusFilter,
    maintenanceType: typeFilter,
  })

  const deleteRecord = useDeleteMaintenanceRecord()

  const handleEdit = (record: MaintenanceRecord) => {
    setEditingRecord(record)
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setDeleteId(id)
  }

  const confirmDelete = async () => {
    if (deleteId) {
      await deleteRecord.mutateAsync(deleteId)
      setDeleteId(null)
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingRecord(null)
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value === "all" ? undefined : Number(value) as MaintenanceStatus)
    setPage(0)
  }

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value === "all" ? undefined : Number(value) as MaintenanceType)
    setPage(0)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "-"
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(amount)
  }

  const getStatusIcon = (status: MaintenanceStatus) => {
    switch (status) {
      case MaintenanceStatus.Scheduled:
        return <Calendar className="h-4 w-4" />
      case MaintenanceStatus.InProgress:
        return <PlayCircle className="h-4 w-4" />
      case MaintenanceStatus.Completed:
        return <CheckCircle className="h-4 w-4" />
      case MaintenanceStatus.Cancelled:
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusVariant = (status: MaintenanceStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case MaintenanceStatus.Scheduled:
        return "outline"
      case MaintenanceStatus.InProgress:
        return "default"
      case MaintenanceStatus.Completed:
        return "secondary"
      case MaintenanceStatus.Cancelled:
        return "destructive"
      default:
        return "outline"
    }
  }

  const columns: ColumnDef<MaintenanceRecord>[] = [
    {
      accessorKey: "title",
      header: "Bakım Kaydı",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium">{row.original.title}</span>
            <span className="text-xs text-muted-foreground">
              {row.original.maintenanceTypeName}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "inventory",
      header: "Envanter",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{row.original.inventorySerialNumber}</span>
          <span className="text-xs text-muted-foreground">{row.original.productName}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Durum",
      enableSorting: true,
      cell: ({ row }) => (
        <Badge variant={getStatusVariant(row.original.status)} className="gap-1">
          {getStatusIcon(row.original.status)}
          {row.original.statusName}
        </Badge>
      ),
    },
    {
      accessorKey: "scheduledDate",
      header: "Planlanan Tarih",
      enableSorting: true,
      cell: ({ row }) => formatDate(row.original.scheduledDate),
    },
    {
      accessorKey: "completedDate",
      header: "Tamamlanma",
      enableSorting: true,
      cell: ({ row }) => formatDate(row.original.completedDate),
    },
    {
      accessorKey: "totalCost",
      header: "Maliyet",
      enableSorting: true,
      cell: ({ row }) => formatCurrency(row.original.totalCost),
    },
    {
      accessorKey: "performedBy",
      header: "Yapan",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.performedBy || "-"}
        </span>
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
          <h1 className="text-2xl font-bold tracking-tight">Bakım Kayıtları</h1>
          <p className="text-muted-foreground">
            Envanter öğeleri için yapılan bakım kayıtlarını yönetin
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Bakım Kaydı
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bakım Kaydı Listesi</CardTitle>
          <CardDescription>
            Toplam {data?.totalCount || 0} bakım kaydı
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Bakım kaydı ara..."
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(0)
                }}
              />
            </div>
            <Select
              value={statusFilter === undefined ? "all" : String(statusFilter)}
              onValueChange={handleStatusFilterChange}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                {Object.entries(MaintenanceStatusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={typeFilter === undefined ? "all" : String(typeFilter)}
              onValueChange={handleTypeFilterChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Bakım Türü" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Türler</SelectItem>
                {Object.entries(MaintenanceTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
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
            emptyMessage="Henüz bakım kaydı eklenmemiş"
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

      <MaintenanceRecordDialog
        key={editingRecord?.id ?? "new"}
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        record={editingRecord}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Bakım kaydını silmek istediğinize emin misiniz?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Bakım kaydı kalıcı olarak silinecektir.
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
