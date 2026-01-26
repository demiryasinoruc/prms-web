import { useState } from "react"
import { Plus, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
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
import { useDebounce } from "@/hooks/use-debounce"
import { useCategoryAttributes, useDeleteCategoryAttribute } from "./hooks"
import { useCategorySelect } from "@/features/categories/hooks"
import { CategoryAttributeDialog } from "./category-attribute-dialog"
import type { CategoryAttribute } from "./api"

export default function CategoryAttributesPage() {
  const [page, setPage] = useState(0)
  const [pageSize] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")
  const [sorting, setSorting] = useState<{
    sortBy: string | null
    sortDir: "asc" | "desc" | null
  }>({ sortBy: null, sortDir: null })
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const debouncedSearch = useDebounce(searchTerm, 300)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editAttribute, setEditAttribute] = useState<CategoryAttribute | null>(
    null
  )
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: categories } = useCategorySelect()
  const { data, isLoading } = useCategoryAttributes({
    pageNumber: page + 1,
    pageSize,
    searchTerm: debouncedSearch,
    sortBy: sorting.sortBy || undefined,
    sortDir: sorting.sortDir || undefined,
    categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
    isActive: statusFilter === "all" ? undefined : statusFilter === "active",
  })
  const deleteMutation = useDeleteCategoryAttribute()

  const handleSort = (column: string) => {
    if (sorting.sortBy !== column) {
      setSorting({ sortBy: column, sortDir: "asc" })
    } else if (sorting.sortDir === "asc") {
      setSorting({ sortBy: column, sortDir: "desc" })
    } else if (sorting.sortDir === "desc") {
      setSorting({ sortBy: null, sortDir: null })
    } else {
      setSorting({ sortBy: column, sortDir: "asc" })
    }
    setPage(0)
  }

  const getSortIcon = (column: string) => {
    if (sorting.sortBy !== column)
      return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
    if (sorting.sortDir === "asc") return <ArrowUp className="ml-2 h-4 w-4" />
    return <ArrowDown className="ml-2 h-4 w-4" />
  }

  const handleEdit = (attribute: CategoryAttribute) => {
    setEditAttribute(attribute)
    setDialogOpen(true)
  }

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId)
      setDeleteId(null)
    }
  }

  const pageCount = data ? Math.ceil(data.totalCount / pageSize) : 0

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Kategori Özellikleri</CardTitle>
            <Button
              onClick={() => {
                setEditAttribute(null)
                setDialogOpen(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Yeni Özellik
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Ara..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPage(0)
              }}
              className="max-w-xs"
            />
            <Select
              value={categoryFilter}
              onValueChange={(value) => {
                setCategoryFilter(value)
                setPage(0)
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Kategoriler</SelectItem>
                {categories?.map((cat, index) => (
                  <SelectItem key={cat.id || `cat-${index}`} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
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

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button
                      className="flex items-center hover:text-primary"
                      onClick={() => handleSort("displayname")}
                    >
                      Görünen Ad
                      {getSortIcon("displayname")}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      className="flex items-center hover:text-primary"
                      onClick={() => handleSort("categoryname")}
                    >
                      Kategori
                      {getSortIcon("categoryname")}
                    </button>
                  </TableHead>
                  <TableHead>Veri Tipi</TableHead>
                  <TableHead>Zorunlu</TableHead>
                  <TableHead>Miras</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Yükleniyor...
                    </TableCell>
                  </TableRow>
                ) : data?.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Özellik bulunamadı.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.items.map((attr) => (
                    <TableRow key={attr.id}>
                      <TableCell className="font-medium">
                        {attr.displayName}
                        <span className="block text-xs text-muted-foreground">
                          {attr.name}
                        </span>
                      </TableCell>
                      <TableCell>{attr.categoryName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{attr.dataTypeName}</Badge>
                      </TableCell>
                      <TableCell>
                        {attr.isRequired ? (
                          <Badge variant="default">Zorunlu</Badge>
                        ) : (
                          <Badge variant="secondary">Opsiyonel</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {attr.inheritToChildren ? (
                          <Badge variant="default">Evet</Badge>
                        ) : (
                          <Badge variant="secondary">Hayır</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={attr.isActive ? "default" : "secondary"}
                        >
                          {attr.isActive ? "Aktif" : "Pasif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(attr)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(attr.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data && data.totalCount > 0 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-muted-foreground">
                Toplam {data.totalCount} kayıt
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Önceki
                </Button>
                <span className="text-sm">
                  {page + 1} / {pageCount}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= pageCount - 1}
                >
                  Sonraki
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CategoryAttributeDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditAttribute(null)
        }}
        attribute={editAttribute}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Özelliği Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu özelliği silmek istediğinizden emin misiniz? Bu işlem geri
              alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Sil</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
