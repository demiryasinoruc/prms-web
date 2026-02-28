import { useState, useMemo } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { type ColumnDef } from "@tanstack/react-table"
import {
  Plus,
  Pencil,
  Trash2,
  Building2,
  User,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTable } from "@/components/data-table"
import { SearchInput } from "@/components/shared/search-input"
import { StatusFilterSelect } from "@/components/shared/status-filter-select"
import { useCustomers, useDeleteCustomer } from "./hooks"
import { CustomerDialog } from "./customer-dialog"
import { CustomerDetailSheet } from "./customer-detail-sheet"
import { CustomerType, type Customer } from "@/types/api"
import { usePermission } from "@/hooks/use-permission"
import { Permissions } from "@/lib/permissions"

export default function CustomersPage() {
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 400)
  const [customerType, setCustomerType] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [sorting, setSorting] = useState<{ sortBy: string | null; sortDir: "asc" | "desc" | null }>({
    sortBy: null,
    sortDir: null,
  })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [detailCustomerId, setDetailCustomerId] = useState<string | null>(null)

  // Permission checks
  const canCreate = usePermission(Permissions.Customer.Create)
  const canUpdate = usePermission(Permissions.Customer.Update)
  const canDelete = usePermission(Permissions.Customer.Delete)

  const { data, isLoading } = useCustomers({
    pageNumber: page + 1,
    pageSize,
    searchTerm: debouncedSearch || undefined,
    customerType: customerType !== "all" ? Number(customerType) : undefined,
    isActive: statusFilter,
    sortBy: sorting.sortBy || undefined,
    sortDir: sorting.sortDir || undefined,
  })

  const deleteCustomer = useDeleteCustomer()

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setDialogOpen(true)
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingCustomer(null)
  }

  const columns: ColumnDef<Customer>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Müşteri Adı",
        enableSorting: true,
        cell: ({ row }) => (
          <button
            onClick={() => setDetailCustomerId(row.original.id)}
            className="flex items-center gap-2 text-left hover:underline"
          >
            {row.original.customerType === CustomerType.Corporate ? (
              <Building2 className="h-4 w-4 text-muted-foreground" />
            ) : (
              <User className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="font-medium text-primary">{row.original.name}</span>
          </button>
        ),
      },
      {
        accessorKey: "customerType",
        header: "Tip",
        enableSorting: true,
        cell: ({ row }) => {
          const type = row.original.customerType
          const label = type === CustomerType.Corporate ? "Kurumsal" : "Bireysel"
          return (
            <Badge variant="outline">
              {label}
            </Badge>
          )
        },
      },
      {
        accessorKey: "contactNumber",
        header: "Telefon",
        enableSorting: true,
        cell: ({ row }) => row.original.contactNumber || "-",
      },
      {
        accessorKey: "email",
        header: "E-posta",
        enableSorting: true,
        cell: ({ row }) => row.original.email || "-",
      },
      {
        accessorKey: "isActive",
        header: "Durum",
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
                onClick={() => deleteCustomer.mutateAsync(row.original.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [canUpdate, canDelete]
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Müşteriler</h1>
          <p className="text-muted-foreground">
            Müşteri kayıtlarınızı yönetin
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Müşteri
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Müşteri Listesi</CardTitle>
          <CardDescription>
            Toplam {data?.totalCount || 0} müşteri kaydı
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            <SearchInput
              value={search}
              onChange={(value) => { setSearch(value); setPage(0) }}
              placeholder="Müşteri ara..."
            />
            <Select
              value={customerType}
              onValueChange={(value) => {
                setCustomerType(value)
                setPage(0)
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Müşteri tipi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Tipler</SelectItem>
                <SelectItem value="1">Bireysel</SelectItem>
                <SelectItem value="2">Kurumsal</SelectItem>
              </SelectContent>
            </Select>
            <StatusFilterSelect
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setPage(0) }}
            />
          </div>

          <DataTable
            columns={columns}
            data={data?.items || []}
            isLoading={isLoading}
            emptyMessage="Henüz müşteri eklenmemiş"
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

      <CustomerDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        customer={editingCustomer}
      />

      <CustomerDetailSheet
        open={!!detailCustomerId}
        onOpenChange={(open) => !open && setDetailCustomerId(null)}
        customerId={detailCustomerId}
        onEdit={(customer) => {
          setEditingCustomer(customer)
          setDialogOpen(true)
        }}
      />
    </div>
  )
}
