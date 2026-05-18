import { useState, useMemo } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { type ColumnDef } from "@tanstack/react-table"
import { XCircle } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { useInvitations, useRevokeInvitation } from "./hooks"
import { InvitationDialog } from "./invitation-dialog"
import { InvitationStatus, type Invitation } from "./api"
import { usePermission } from "@/hooks/use-permission"
import { useDialogResetKey } from "@/hooks/use-dialog-reset-key"
import { Permissions } from "@/lib/permissions"
import { confirm } from "@/lib/confirm"
import { toast } from "sonner"

const statusBadgeVariant: Record<number, "default" | "secondary" | "destructive" | "outline"> = {
  [InvitationStatus.Pending]: "default",
  [InvitationStatus.Accepted]: "secondary",
  [InvitationStatus.Rejected]: "destructive",
  [InvitationStatus.Revoked]: "outline",
  [InvitationStatus.Expired]: "outline",
}

export default function InvitationsPage() {
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 400)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [sorting, setSorting] = useState<{
    sortBy: string | null
    sortDir: "asc" | "desc" | null
  }>({ sortBy: null, sortDir: null })
  const [statusFilter, setStatusFilter] = useState<string>("pending")

  const [dialogOpen, setDialogOpen] = useState(false)
  const dialogKey = useDialogResetKey(dialogOpen)

  const canManage = usePermission(Permissions.User.Manage)

  const statusId = useMemo(() => {
    if (statusFilter === "pending") return undefined // Varsayılan: bekleyen + süresi dolmamış
    if (statusFilter === "all") return undefined
    return Number(statusFilter)
  }, [statusFilter])

  // "all" seçildiğinde backend'e özel bir parametre göndermemiz lazım
  // statusId undefined + isAll=true gibi. Ama backend'de filtre null olunca varsayılan davranış devreye giriyor.
  // Bunu çözmek için "all" durumunda -1 gibi geçersiz bir değer göndermek yerine,
  // backend'deki varsayılan davranışı kullanmayı bırakıp tüm statüleri göstermek için 0 kullanalım.
  // Aslında en temizi: statusFilter === "all" iken tüm statüleri listelemek.
  // Backend'de Filters.StatusId = 0 veya null kontrolü yapabiliriz.

  const { data, isLoading } = useInvitations({
    pageNumber: page + 1,
    pageSize,
    searchTerm: debouncedSearch || undefined,
    sortBy: sorting.sortBy || undefined,
    sortDir: sorting.sortDir || undefined,
    statusId: statusFilter === "all" ? -1 : statusId,
  })

  const revokeInvitation = useRevokeInvitation()

  const handleRevoke = async (id: string) => {
    const confirmed = await confirm({
      title: "Daveti iptal etmek istediğinize emin misiniz?",
      description: "Bu davet iptal edilecek ve kullanıcı bu davetle kayıt olamayacaktır.",
      actionLabel: "İptal Et",
    })
    if (!confirmed) return

    try {
      await revokeInvitation.mutateAsync(id)
      toast.success("Davet başarıyla iptal edildi")
    } catch {
      // Error handled by axios interceptor
    }
  }

  const columns: ColumnDef<Invitation>[] = useMemo(
    () => [
      {
        accessorKey: "email",
        header: "E-posta",
        enableSorting: true,
        cell: ({ row }) => (
          <span className="font-medium">{row.original.email}</span>
        ),
      },
      {
        accessorKey: "roleName",
        header: "Rol",
        enableSorting: true,
        cell: ({ row }) => row.original.roleName,
      },
      {
        accessorKey: "statusId",
        header: "Durum",
        enableSorting: true,
        cell: ({ row }) => (
          <Badge variant={statusBadgeVariant[row.original.statusId] || "outline"}>
            {row.original.statusName}
          </Badge>
        ),
      },
      {
        accessorKey: "createdDate",
        header: "Gönderilme Tarihi",
        enableSorting: true,
        cell: ({ row }) =>
          new Date(row.original.createdDate).toLocaleDateString("tr-TR"),
      },
      {
        accessorKey: "expiredDate",
        header: "Son Geçerlilik Tarihi",
        enableSorting: true,
        cell: ({ row }) =>
          new Date(row.original.expiredDate).toLocaleDateString("tr-TR"),
      },
      {
        id: "actions",
        enableSorting: false,
        cell: ({ row }) =>
          canManage && row.original.statusId === InvitationStatus.Pending ? (
            <div className="flex items-center justify-end">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                title="Daveti iptal et"
                onClick={() => handleRevoke(row.original.id)}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          ) : null,
      },
    ],
    [canManage]
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Davetler"
        description="Davetleri yönetin"
        action={{
          label: "Yeni Davet",
          onClick: () => setDialogOpen(true),
          permission: canManage,
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Davet Listesi</CardTitle>
          <CardDescription>
            Toplam {data?.totalCount || 0} davet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            <SearchInput
              value={search}
              onChange={(value) => {
                setSearch(value)
                setPage(0)
              }}
              placeholder="E-posta ara..."
            />
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value)
                setPage(0)
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Bekleyen</SelectItem>
                <SelectItem value={String(InvitationStatus.Accepted)}>Kabul Edildi</SelectItem>
                <SelectItem value={String(InvitationStatus.Rejected)}>Reddedildi</SelectItem>
                <SelectItem value={String(InvitationStatus.Revoked)}>İptal Edildi</SelectItem>
                <SelectItem value={String(InvitationStatus.Expired)}>Süresi Doldu</SelectItem>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DataTable
            columns={columns}
            data={data?.items || []}
            isLoading={isLoading}
            emptyMessage="Davet bulunamadı"
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

      <InvitationDialog
        key={dialogKey}
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) setDialogOpen(false)
        }}
      />
    </div>
  )
}
