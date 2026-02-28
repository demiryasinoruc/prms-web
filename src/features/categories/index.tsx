import { useState } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { type ColumnDef } from "@tanstack/react-table"
import {
  FolderTree,
  ChevronRight,
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
import { DataTable } from "@/components/data-table"
import { PageHeader } from "@/components/shared/page-header"
import { SearchInput } from "@/components/shared/search-input"
import { useCategories, useDeleteCategory, useCategorySelectParent } from "./hooks"
import { CategoryDialog } from "./category-dialog"
import type { Category } from "./api"
import { usePermission } from "@/hooks/use-permission"
import { Permissions } from "@/lib/permissions"
import { createActionButtonsColumn } from "@/components/shared/column-helpers"

export default function CategoriesPage() {
  const canManage = usePermission(Permissions.Category.Update)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 400)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [sorting, setSorting] = useState<{ sortBy: string | null; sortDir: "asc" | "desc" | null }>({
    sortBy: null,
    sortDir: null,
  })
  const [parentFilter, setParentFilter] = useState<string | undefined>(undefined)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  const { data: parentCategories } = useCategorySelectParent()

  const { data, isLoading } = useCategories({
    pageNumber: page + 1,
    pageSize,
    searchTerm: debouncedSearch || undefined,
    sortBy: sorting.sortBy || undefined,
    sortDir: sorting.sortDir || undefined,
    parentId: parentFilter,
  })

  const deleteCategory = useDeleteCategory()

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setDialogOpen(true)
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingCategory(null)
  }

  const columns: ColumnDef<Category>[] = [
    {
      accessorKey: "name",
      header: "Kategori Adı",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <FolderTree className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "parentCategoryName",
      header: "Üst Kategori",
      enableSorting: true,
      cell: ({ row }) => {
        const parentName = row.original.parentCategoryName
        if (!parentName) {
          return <span className="text-muted-foreground">-</span>
        }
        return (
          <div className="flex items-center gap-1 text-muted-foreground">
            <ChevronRight className="h-3 w-3" />
            <span>{parentName}</span>
          </div>
        )
      },
    },
    createActionButtonsColumn<Category>({
      onEdit: handleEdit,
      onDelete: (id) => deleteCategory.mutateAsync(id),
      getId: (row) => row.id,
      canUpdate: canManage,
      canDelete: canManage,
    }),
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kategoriler"
        description="Ürün kategorilerini yönetin"
        action={{ label: "Yeni Kategori", onClick: () => setDialogOpen(true), permission: canManage }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Kategori Listesi</CardTitle>
          <CardDescription>
            Toplam {data?.totalCount || 0} kategori kaydı
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            <SearchInput
              value={search}
              onChange={(value) => { setSearch(value); setPage(0) }}
              placeholder="Kategori ara..."
            />
            <Select
              value={parentFilter ?? "all"}
              onValueChange={(value) => {
                setParentFilter(value === "all" ? undefined : value)
                setPage(0)
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Üst Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Kategoriler</SelectItem>
                {parentCategories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DataTable
            columns={columns}
            data={data?.items || []}
            isLoading={isLoading}
            emptyMessage="Henüz kategori eklenmemiş"
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

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        category={editingCategory}
      />
    </div>
  )
}
