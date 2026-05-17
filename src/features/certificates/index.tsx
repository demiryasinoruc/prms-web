import { useState } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { type ColumnDef } from "@tanstack/react-table"
import {
  Award,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DataTable } from "@/components/data-table"
import { PageHeader } from "@/components/shared/page-header"
import { SearchInput } from "@/components/shared/search-input"
import { StatusFilterSelect } from "@/components/shared/status-filter-select"
import { useCertificates, useDeleteCertificate } from "./hooks"
import { CertificateDialog } from "./certificate-dialog"
import type { Certificate } from "./api"
import { usePermission } from "@/hooks/use-permission"
import { Permissions } from "@/lib/permissions"
import { useDialogResetKey } from "@/hooks/use-dialog-reset-key"
import { createActionButtonsColumn, createStatusBadgeColumn } from "@/components/shared/column-helpers"

export default function CertificatesPage() {
  const canCreate = usePermission(Permissions.Certificates.Create)
  const canUpdate = usePermission(Permissions.Certificates.Update)
  const canDelete = usePermission(Permissions.Certificates.Delete)

  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 400)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [sorting, setSorting] = useState<{ sortBy: string | null; sortDir: "asc" | "desc" | null }>({
    sortBy: null,
    sortDir: null,
  })

  // Filters
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCertificate, setEditingCertificate] = useState<Certificate | null>(null)
  const dialogKey = useDialogResetKey(dialogOpen)

  const { data, isLoading } = useCertificates({
    pageNumber: page + 1,
    pageSize,
    searchTerm: debouncedSearch || undefined,
    sortBy: sorting.sortBy || undefined,
    sortDir: sorting.sortDir || undefined,
    isActive: statusFilter,
  })

  const deleteCertificate = useDeleteCertificate()

  const handleEdit = (certificate: Certificate) => {
    setEditingCertificate(certificate)
    setDialogOpen(true)
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingCertificate(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const columns: ColumnDef<Certificate>[] = [
    {
      accessorKey: "name",
      header: "Sertifika Adı",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <Award className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Açıklama",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-muted-foreground truncate max-w-[300px] block">
          {row.original.description || "-"}
        </span>
      ),
    },
    {
      accessorKey: "createdDate",
      header: "Oluşturma Tarihi",
      enableSorting: true,
      cell: ({ row }) => formatDate(row.original.createdDate),
    },
    createStatusBadgeColumn<Certificate>({ enableSorting: true }),
    createActionButtonsColumn<Certificate>({
      onEdit: handleEdit,
      onDelete: (id) => deleteCertificate.mutateAsync(id),
      getId: (row) => row.id,
      canUpdate,
      canDelete,
      entityName: "Sertifika",
    }),
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sertifikalar"
        description="Personel ve ek hizmetler için gerekli sertifikaları yönetin"
        action={{ label: "Yeni Sertifika", onClick: () => setDialogOpen(true), permission: canCreate }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Sertifika Listesi</CardTitle>
          <CardDescription>
            Toplam {data?.totalCount || 0} sertifika kaydı
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            <SearchInput
              value={search}
              onChange={(value) => { setSearch(value); setPage(0) }}
              placeholder="Sertifika ara..."
            />
            <StatusFilterSelect
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setPage(0) }}
            />
          </div>

          <DataTable
            columns={columns}
            data={data?.items || []}
            isLoading={isLoading}
            emptyMessage="Henüz sertifika eklenmemiş"
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

      <CertificateDialog
        key={dialogKey}
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        certificate={editingCertificate}
      />
    </div>
  )
}
