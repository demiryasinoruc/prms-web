import { useState } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { type ColumnDef } from "@tanstack/react-table"
import {
  Plus,
  Pencil,
  Trash2,
  Tag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DataTable } from "@/components/data-table"
import { SearchInput } from "@/components/shared/search-input"
import { useBrands, useDeleteBrand } from "./hooks"
import { BrandDialog } from "./brand-dialog"
import type { Brand } from "./api"
import { usePermission } from "@/hooks/use-permission"
import { Permissions } from "@/lib/permissions"

export default function BrandsPage() {
  const canManage = usePermission(Permissions.Brand.Update)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 400)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [sorting, setSorting] = useState<{ sortBy: string | null; sortDir: "asc" | "desc" | null }>({
    sortBy: null,
    sortDir: null,
  })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)

  const { data, isLoading } = useBrands({
    pageNumber: page + 1,
    pageSize,
    searchTerm: debouncedSearch || undefined,
    sortBy: sorting.sortBy || undefined,
    sortDir: sorting.sortDir || undefined,
  })

  const deleteBrand = useDeleteBrand()

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand)
    setDialogOpen(true)
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingBrand(null)
  }

  const columns: ColumnDef<Brand>[] = [
    {
      accessorKey: "name",
      header: "Marka Adı",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <Tag className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      id: "actions",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          {canManage && (
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
                onClick={() => deleteBrand.mutateAsync(row.original.id)}
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
          <h1 className="text-2xl font-bold tracking-tight">Markalar</h1>
          <p className="text-muted-foreground">
            Ürün markalarını yönetin
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Marka
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Marka Listesi</CardTitle>
          <CardDescription>
            Toplam {data?.totalCount || 0} marka kaydı
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            <SearchInput
              value={search}
              onChange={(value) => { setSearch(value); setPage(0) }}
              placeholder="Marka ara..."
            />
          </div>

          <DataTable
            columns={columns}
            data={data?.items || []}
            isLoading={isLoading}
            emptyMessage="Henüz marka eklenmemiş"
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

      <BrandDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        brand={editingBrand}
      />
    </div>
  )
}
