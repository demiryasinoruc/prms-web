import { useState } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { type ColumnDef } from "@tanstack/react-table"
import { CalendarDays } from "lucide-react"
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
import { useEmployeeLeaves, useDeleteEmployeeLeave, useEmployeeSelect } from "./hooks"
import { EmployeeLeaveDialog } from "./employee-leave-dialog"
import { LeaveType, LeaveTypeLabels, type EmployeeLeave } from "./api"
import { usePermission } from "@/hooks/use-permission"
import { Permissions } from "@/lib/permissions"
import { createActionButtonsColumn } from "@/components/shared/column-helpers"
import { useDialogResetKey } from "@/hooks/use-dialog-reset-key"

export default function EmployeeLeavesPage() {
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

  // Filters
  const [employeeFilter, setEmployeeFilter] = useState<string>("all")
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<LeaveType | undefined>(undefined)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLeave, setEditingLeave] = useState<EmployeeLeave | null>(null)
  const dialogKey = useDialogResetKey(dialogOpen)

  const { data: employees } = useEmployeeSelect()

  const { data, isLoading } = useEmployeeLeaves({
    pageNumber: page + 1,
    pageSize,
    searchTerm: debouncedSearch || undefined,
    sortBy: sorting.sortBy || undefined,
    sortDir: sorting.sortDir || undefined,
    employeeId: employeeFilter !== "all" ? employeeFilter : undefined,
    leaveType: leaveTypeFilter,
  })

  const deleteLeave = useDeleteEmployeeLeave()

  const handleEdit = (leave: EmployeeLeave) => {
    setEditingLeave(leave)
    setDialogOpen(true)
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingLeave(null)
  }

  const handleLeaveTypeFilterChange = (value: string) => {
    setLeaveTypeFilter(value === "all" ? undefined : (Number(value) as LeaveType))
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

  const columns: ColumnDef<EmployeeLeave>[] = [
    {
      accessorKey: "employeeFullName",
      header: "Çalışan",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="font-medium">{row.original.employeeFullName}</span>
        </div>
      ),
    },
    {
      accessorKey: "leaveType",
      header: "İzin Türü",
      enableSorting: true,
      cell: ({ row }) => (
        <Badge variant="outline">
          {LeaveTypeLabels[row.original.leaveType]}
        </Badge>
      ),
    },
    {
      accessorKey: "startDate",
      header: "Başlangıç",
      enableSorting: true,
      cell: ({ row }) => formatDate(row.original.startDate),
    },
    {
      accessorKey: "endDate",
      header: "Bitiş",
      enableSorting: true,
      cell: ({ row }) => formatDate(row.original.endDate),
    },
    {
      accessorKey: "notes",
      header: "Notlar",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-muted-foreground truncate max-w-[250px] block">
          {row.original.notes || "-"}
        </span>
      ),
    },
    createActionButtonsColumn<EmployeeLeave>({
      onEdit: handleEdit,
      onDelete: (id) => deleteLeave.mutateAsync(id),
      getId: (row) => row.id,
      canUpdate,
      canDelete,
      entityName: "İzin",
    }),
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="İzinler"
        description="Çalışan izin kayıtlarını yönetin"
        action={{ label: "Yeni İzin", onClick: () => setDialogOpen(true), permission: canCreate }}
      />

      <Card>
        <CardHeader>
          <CardTitle>İzin Listesi</CardTitle>
          <CardDescription>
            Toplam {data?.totalCount || 0} izin kaydı
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            <SearchInput
              value={search}
              onChange={(value) => { setSearch(value); setPage(0) }}
              placeholder="İzin ara..."
            />
            <Select
              value={employeeFilter}
              onValueChange={(value) => {
                setEmployeeFilter(value)
                setPage(0)
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Çalışan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Çalışanlar</SelectItem>
                {employees?.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id.toLowerCase()}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={leaveTypeFilter === undefined ? "all" : String(leaveTypeFilter)}
              onValueChange={handleLeaveTypeFilterChange}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="İzin Türü" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Türler</SelectItem>
                {Object.entries(LeaveTypeLabels).map(([value, label]) => (
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
            emptyMessage="Henüz izin kaydı eklenmemiş"
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

      <EmployeeLeaveDialog
        key={dialogKey}
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        leave={editingLeave}
      />
    </div>
  )
}
