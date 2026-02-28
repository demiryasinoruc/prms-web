import { useState } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { type ColumnDef } from "@tanstack/react-table"
import {
  Plus,
  Pencil,
  Trash2,
  Shield,
  Users,
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
import { DataTable } from "@/components/data-table"
import { SearchInput } from "@/components/shared/search-input"
import { useRoles, useDeleteRole } from "./hooks"
import { RoleSheet } from "./role-sheet"
import type { Role } from "./api"
import { usePermission } from "@/hooks/use-permission"
import { Permissions } from "@/lib/permissions"

export default function RolesPage() {
  const canManage = usePermission(Permissions.Role.Manage)

  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 400)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [sorting, setSorting] = useState<{ sortBy: string | null; sortDir: "asc" | "desc" | null }>({
    sortBy: null,
    sortDir: null,
  })

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)

  const { data, isLoading } = useRoles({
    pageNumber: page + 1,
    pageSize,
    searchTerm: debouncedSearch || undefined,
    sortBy: sorting.sortBy || undefined,
    sortDir: sorting.sortDir || undefined,
  })

  const deleteRole = useDeleteRole()

  const handleEdit = (role: Role) => {
    setEditingRole(role)
    setSheetOpen(true)
  }

  const handleSheetClose = () => {
    setSheetOpen(false)
    setEditingRole(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const columns: ColumnDef<Role>[] = [
    {
      accessorKey: "name",
      header: "Rol Adı",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <Shield className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "permissionCount",
      header: "İzinler",
      enableSorting: true,
      cell: ({ row }) => (
        <Badge variant="secondary" className="gap-1">
          <Shield className="h-3 w-3" />
          {row.original.permissionCount} izin
        </Badge>
      ),
    },
    {
      accessorKey: "userCount",
      header: "Kullanıcılar",
      enableSorting: true,
      cell: ({ row }) => (
        <Badge variant="outline" className="gap-1">
          <Users className="h-3 w-3" />
          {row.original.userCount} kullanıcı
        </Badge>
      ),
    },
    {
      accessorKey: "createdDate",
      header: "Oluşturulma Tarihi",
      enableSorting: true,
      cell: ({ row }) => formatDate(row.original.createdDate),
    },
    {
      id: "actions",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          {canManage && !row.original.isMain && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Düzenle"
                onClick={() => handleEdit(row.original)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                title="Sil"
                onClick={() => deleteRole.mutateAsync(row.original.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Roller</h1>
          <p className="text-muted-foreground">
            Kullanıcı rollerini ve izinlerini yönetin
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setSheetOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Rol
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rol Listesi</CardTitle>
          <CardDescription>
            Toplam {data?.totalCount || 0} rol kaydı
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            <SearchInput
              value={search}
              onChange={(value) => { setSearch(value); setPage(0) }}
              placeholder="Rol ara..."
            />
          </div>

          <DataTable
            columns={columns}
            data={data?.items || []}
            isLoading={isLoading}
            emptyMessage="Henüz rol eklenmemiş"
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

      <RoleSheet
        open={sheetOpen}
        onOpenChange={handleSheetClose}
        role={editingRole}
      />

    </div>
  )
}
