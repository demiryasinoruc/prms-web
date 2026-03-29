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
import { DataTable } from "@/components/data-table"
import { PageHeader } from "@/components/shared/page-header"
import { SearchInput } from "@/components/shared/search-input"
import { useInvitations, useRevokeInvitation } from "./hooks"
import { InvitationDialog } from "./invitation-dialog"
import type { Invitation } from "./api"
import { usePermission } from "@/hooks/use-permission"
import { Permissions } from "@/lib/permissions"
import { confirm } from "@/lib/confirm"
import { toast } from "sonner"

export default function InvitationsPage() {
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 400)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [sorting, setSorting] = useState<{
    sortBy: string | null
    sortDir: "asc" | "desc" | null
  }>({ sortBy: null, sortDir: null })

  const [dialogOpen, setDialogOpen] = useState(false)

  const canManage = usePermission(Permissions.User.Manage)

  const { data, isLoading } = useInvitations({
    pageNumber: page + 1,
    pageSize,
    searchTerm: debouncedSearch || undefined,
    sortBy: sorting.sortBy || undefined,
    sortDir: sorting.sortDir || undefined,
  })

  const revokeInvitation = useRevokeInvitation()

  const handleRevoke = async (id: string) => {
    const confirmed = await confirm({
      title: "Daveti iptal etmek istediginize emin misiniz?",
      description: "Bu davet iptal edilecek ve kullanici bu davetle kayit olamayacaktir.",
      actionLabel: "Iptal Et",
    })
    if (!confirmed) return

    try {
      await revokeInvitation.mutateAsync(id)
      toast.success("Davet basariyla iptal edildi")
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
        accessorKey: "createdDate",
        header: "Gonderilme Tarihi",
        enableSorting: true,
        cell: ({ row }) =>
          new Date(row.original.createdDate).toLocaleDateString("tr-TR"),
      },
      {
        accessorKey: "expiredDate",
        header: "Son Gecerlilik Tarihi",
        enableSorting: true,
        cell: ({ row }) =>
          new Date(row.original.expiredDate).toLocaleDateString("tr-TR"),
      },
      {
        id: "actions",
        enableSorting: false,
        cell: ({ row }) =>
          canManage ? (
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
        description="Bekleyen davetleri yonetin"
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
            Toplam {data?.totalCount || 0} bekleyen davet
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
          </div>

          <DataTable
            columns={columns}
            data={data?.items || []}
            isLoading={isLoading}
            emptyMessage="Bekleyen davet bulunmuyor"
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
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) setDialogOpen(false)
        }}
      />
    </div>
  )
}
