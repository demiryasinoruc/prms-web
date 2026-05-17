import { useState } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { type ColumnDef } from "@tanstack/react-table"
import {
  User,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/data-table"
import { PageHeader } from "@/components/shared/page-header"
import { SearchInput } from "@/components/shared/search-input"
import { StatusFilterSelect } from "@/components/shared/status-filter-select"
import { useEmployees, useDeleteEmployee } from "./hooks"
import { EmployeeDialog } from "./employee-dialog"
import { EmployeeDetailSheet } from "./employee-detail-sheet"
import { Gender, type Employee } from "@/types/api"
import { usePermission } from "@/hooks/use-permission"
import { Permissions } from "@/lib/permissions"
import { createActionButtonsColumn, createStatusBadgeColumn } from "@/components/shared/column-helpers"
import { useDialogResetKey } from "@/hooks/use-dialog-reset-key"

const genderLabels: Record<Gender, string> = {
  [Gender.Male]: "Erkek",
  [Gender.Female]: "Kadın",
}

export default function EmployeesPage() {
  const canCreate = usePermission(Permissions.Employee.Create)
  const canUpdate = usePermission(Permissions.Employee.Update)
  const canDelete = usePermission(Permissions.Employee.Delete)

  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 400)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [sorting, setSorting] = useState<{ sortBy: string | null; sortDir: "asc" | "desc" | null }>({
    sortBy: null,
    sortDir: null,
  })
  const [genderFilter, setGenderFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const dialogKey = useDialogResetKey(dialogOpen)
  const [detailEmployeeId, setDetailEmployeeId] = useState<string | null>(null)

  const { data, isLoading } = useEmployees({
    pageNumber: page + 1,
    pageSize,
    searchTerm: debouncedSearch || undefined,
    gender: genderFilter !== "all" ? Number(genderFilter) : undefined,
    isActive: statusFilter,
    sortBy: sorting.sortBy || undefined,
    sortDir: sorting.sortDir || undefined,
  })

  const deleteEmployee = useDeleteEmployee()

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setDialogOpen(true)
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingEmployee(null)
  }

  const columns: ColumnDef<Employee>[] = [
    {
      accessorKey: "name",
      header: "Ad Soyad",
      enableSorting: true,
      cell: ({ row }) => (
        <button
          onClick={() => setDetailEmployeeId(row.original.id)}
          className="flex items-center gap-2 text-left hover:underline"
        >
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="font-medium text-primary">
            {row.original.name} {row.original.surname}
          </span>
        </button>
      ),
    },
    {
      accessorKey: "email",
      header: "E-posta",
      enableSorting: true,
      cell: ({ row }) => row.original.email || "-",
    },
    {
      accessorKey: "phone",
      header: "Telefon",
      enableSorting: true,
      cell: ({ row }) => row.original.phone || "-",
    },
    {
      accessorKey: "gender",
      header: "Cinsiyet",
      enableSorting: false,
      cell: ({ row }) => (
        <Badge variant="outline">
          {genderLabels[row.original.gender]}
        </Badge>
      ),
    },
    createStatusBadgeColumn<Employee>(),
    createActionButtonsColumn<Employee>({
      onEdit: handleEdit,
      onDelete: (id) => deleteEmployee.mutateAsync(id),
      getId: (row) => row.id,
      canUpdate,
      canDelete,
      entityName: "Çalışan",
    }),
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Çalışanlar"
        description="Personel kayıtlarını yönetin"
        action={{ label: "Yeni Çalışan", onClick: () => setDialogOpen(true), permission: canCreate }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Çalışan Listesi</CardTitle>
          <CardDescription>
            Toplam {data?.totalCount || 0} çalışan kaydı
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            <SearchInput
              value={search}
              onChange={(value) => { setSearch(value); setPage(0) }}
              placeholder="Ad, soyad veya e-posta ile ara..."
            />
            <Select
              value={genderFilter}
              onValueChange={(value) => {
                setGenderFilter(value)
                setPage(0)
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Cinsiyet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Cinsiyetler</SelectItem>
                <SelectItem value="1">Erkek</SelectItem>
                <SelectItem value="2">Kadın</SelectItem>
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
            emptyMessage="Henüz çalışan eklenmemiş"
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

      <EmployeeDialog
        key={dialogKey}
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        employee={editingEmployee}
      />

      <EmployeeDetailSheet
        open={!!detailEmployeeId}
        onOpenChange={(open) => !open && setDetailEmployeeId(null)}
        employeeId={detailEmployeeId}
        onEdit={(employee) => {
          setEditingEmployee(employee)
          setDialogOpen(true)
        }}
      />
    </div>
  )
}
