import { useState } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { type ColumnDef } from "@tanstack/react-table"
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  User,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/data-table"
import { useEmployees, useDeleteEmployee } from "./hooks"
import { EmployeeDialog } from "./employee-dialog"
import { EmployeeDetailSheet } from "./employee-detail-sheet"
import { Gender, type Employee } from "@/types/api"
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
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [detailEmployeeId, setDetailEmployeeId] = useState<string | null>(null)

  const { data, isLoading } = useEmployees({
    pageNumber: page + 1,
    pageSize,
    searchTerm: debouncedSearch || undefined,
    gender: genderFilter !== "all" ? Number(genderFilter) : undefined,
    isActive: statusFilter !== "all" ? statusFilter === "active" : undefined,
    sortBy: sorting.sortBy || undefined,
    sortDir: sorting.sortDir || undefined,
  })

  const deleteEmployee = useDeleteEmployee()

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setDeleteId(id)
  }

  const confirmDelete = async () => {
    if (deleteId) {
      await deleteEmployee.mutateAsync(deleteId)
      setDeleteId(null)
    }
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
      accessorKey: "contactNumber",
      header: "Telefon",
      enableSorting: true,
      cell: ({ row }) => row.original.contactNumber || "-",
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
          <h1 className="text-2xl font-bold tracking-tight">Çalışanlar</h1>
          <p className="text-muted-foreground">
            Personel kayıtlarını yönetin
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Çalışan
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Çalışan Listesi</CardTitle>
          <CardDescription>
            Toplam {data?.totalCount || 0} çalışan kaydı
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Ad, soyad veya e-posta ile ara..."
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(0)
                }}
              />
            </div>
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
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value)
                setPage(0)
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Pasif</SelectItem>
              </SelectContent>
            </Select>
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

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Çalışanı silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Çalışan ve ilişkili tüm veriler kalıcı olarak silinecektir.
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
