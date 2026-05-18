import { useState } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { type ColumnDef } from "@tanstack/react-table"
import { Link } from "react-router-dom"
import {
  Search,
  Pencil,
  User,
  Shield,
  MailPlus,
  ArrowRight,
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
import { PageHeader } from "@/components/shared/page-header"
import { useUsers } from "./hooks"
import { useRoleSelect } from "@/features/roles/hooks"
import { UserDialog } from "./user-dialog"
import type { User as UserType } from "./api"
import { usePermission } from "@/hooks/use-permission"
import { useDialogResetKey } from "@/hooks/use-dialog-reset-key"
import { Permissions } from "@/lib/permissions"

export default function UsersPage() {
  const canManage = usePermission(Permissions.User.Manage)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 400)
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [sorting, setSorting] = useState<{ sortBy: string | null; sortDir: "asc" | "desc" | null }>({
    sortBy: null,
    sortDir: null,
  })

  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const dialogKey = useDialogResetKey(!!editingUserId)

  const { data: roles } = useRoleSelect()

  const { data, isLoading } = useUsers({
    pageNumber: page + 1,
    pageSize,
    searchTerm: debouncedSearch || undefined,
    roleId: roleFilter !== "all" ? roleFilter : undefined,
    sortBy: sorting.sortBy || undefined,
    sortDir: sorting.sortDir || undefined,
  })

  const handleEdit = (user: UserType) => {
    setEditingUserId(user.id)
  }

  const handleDialogClose = () => {
    setEditingUserId(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const columns: ColumnDef<UserType>[] = [
    {
      accessorKey: "name",
      header: "Kullanıcı",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <span className="font-medium">
              {row.original.name} {row.original.surname}
            </span>
            <p className="text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "roleName",
      header: "Rol",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <Badge variant="outline">{row.original.roleName}</Badge>
        </div>
      ),
    },
    {
      accessorKey: "createdDate",
      header: "Kayıt Tarihi",
      enableSorting: true,
      cell: ({ row }) => formatDate(row.original.createdDate),
    },
    {
      id: "actions",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          {canManage && (
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
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kullanıcılar"
        description="Şirket kullanıcılarını yönetin"
      />

      <div className="flex items-start gap-3 rounded-md border border-primary/20 bg-primary/5 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MailPlus className="h-4 w-4" />
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium">Yeni kullanıcı eklemek mi istiyorsunuz?</p>
          <p className="text-sm text-muted-foreground">
            Bu sayfadan yeni kullanıcı oluşturulamaz. Kullanıcılar yalnızca e-posta daveti
            kabul ettiğinde sisteme katılır. Davet göndermek için Davetler sayfasını kullanın.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link to="/settings/invitations">
            Davetler
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kullanıcı Listesi</CardTitle>
          <CardDescription>
            Toplam {data?.totalCount || 0} kullanıcı kaydı
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Kullanıcı ara..."
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(0)
                }}
              />
            </div>
            <Select value={roleFilter} onValueChange={(value) => { setRoleFilter(value); setPage(0) }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Roller</SelectItem>
                {roles?.map((role) => (
                  <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DataTable
            columns={columns}
            data={data?.items || []}
            isLoading={isLoading}
            emptyMessage="Henüz kullanıcı eklenmemiş"
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

      <UserDialog
        key={dialogKey}
        open={!!editingUserId}
        onOpenChange={handleDialogClose}
        userId={editingUserId}
      />
    </div>
  )
}
