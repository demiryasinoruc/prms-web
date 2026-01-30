import { useState } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { type ColumnDef } from "@tanstack/react-table"
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
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
import { useProducts, useDeleteProduct, useCategorySelect } from "./hooks"
import { ProductDialog } from "./product-dialog"
import { ProductDetailSheet } from "./product-detail-sheet"
import { ProductType, ProductTypeLabels, type Product } from "./api"
import { usePermission } from "@/hooks/use-permission"
import { Permissions } from "@/lib/permissions"

export default function ProductsPage() {
  const canCreate = usePermission(Permissions.Product.Create)
  const canUpdate = usePermission(Permissions.Product.Update)
  const canDelete = usePermission(Permissions.Product.Delete)

  // KURAL: page = 0 (0-indexed)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 400)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  // KURAL: sorting obje olarak
  const [sorting, setSorting] = useState<{ sortBy: string | null; sortDir: "asc" | "desc" | null }>({
    sortBy: null,
    sortDir: null,
  })

  // Filtreler
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [detailProductId, setDetailProductId] = useState<string | null>(null)

  // Lookup data for filters
  const { data: categories } = useCategorySelect()

  const { data, isLoading } = useProducts({
    pageNumber: page + 1, // API 1-indexed bekler
    pageSize,
    searchTerm: debouncedSearch || undefined,
    sortBy: sorting.sortBy || undefined,
    sortDir: sorting.sortDir || undefined,
    categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
    isActive: statusFilter !== "all" ? statusFilter === "active" : undefined,
  })

  const deleteProduct = useDeleteProduct()

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setDeleteId(id)
  }

  const confirmDelete = async () => {
    if (deleteId) {
      await deleteProduct.mutateAsync(deleteId)
      setDeleteId(null)
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingProduct(null)
  }

  const formatPrice = (price: number, currencyCode: string) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: currencyCode,
    }).format(price)
  }

  const getProductTypeVariant = (type: ProductType) => {
    switch (type) {
      case ProductType.Tracked:
        return "default"
      case ProductType.Countable:
        return "secondary"
      case ProductType.Consumable:
        return "outline"
      default:
        return "default"
    }
  }

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: "name",
      header: "Ürün Adı",
      enableSorting: true,
      cell: ({ row }) => (
        // KURAL: Detail sheet VAR - tıklanabilir, text-primary
        <button
          onClick={() => setDetailProductId(row.original.id)}
          className="flex items-center gap-2 text-left hover:underline"
        >
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <Package className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <span className="font-medium text-primary">{row.original.name}</span>
            <p className="text-xs text-muted-foreground">{row.original.productCode}</p>
          </div>
        </button>
      ),
    },
    {
      accessorKey: "type",
      header: "Tip",
      enableSorting: true,
      cell: ({ row }) => (
        <Badge variant={getProductTypeVariant(row.original.type)}>
          {ProductTypeLabels[row.original.type]}
        </Badge>
      ),
    },
    {
      accessorKey: "categoryName",
      header: "Kategori",
      enableSorting: true,
      cell: ({ row }) => row.original.categoryName,
    },
    {
      accessorKey: "basePrice",
      header: "Fiyat",
      enableSorting: true,
      cell: ({ row }) => (
        <div>
          <span className="font-medium">
            {formatPrice(row.original.basePrice, row.original.currencyCode)}
          </span>
          <p className="text-xs text-muted-foreground">{row.original.pricePeriodName}</p>
        </div>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Durum",
      enableSorting: true,
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
          <h1 className="text-2xl font-bold tracking-tight">Ürünler</h1>
          <p className="text-muted-foreground">
            Kiralanabilir ürünlerinizi yönetin
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Ürün
          </Button>
        )}
      </div>

      {/* KURAL: Card wrapper */}
      <Card>
        <CardHeader>
          <CardTitle>Ürün Listesi</CardTitle>
          <CardDescription>
            Toplam {data?.totalCount || 0} ürün kaydı
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            {/* KURAL: useDebounce kullan */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Ürün ara..."
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(0)
                }}
              />
            </div>
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
                {categories?.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.text}
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

          {/* KURAL: DataTable kullan */}
          <DataTable
            columns={columns}
            data={data?.items || []}
            isLoading={isLoading}
            emptyMessage="Henüz ürün eklenmemiş"
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

      <ProductDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        product={editingProduct}
      />

      <ProductDetailSheet
        open={!!detailProductId}
        onOpenChange={(open) => !open && setDetailProductId(null)}
        productId={detailProductId}
        onEdit={(product) => {
          setDetailProductId(null)
          // ProductDetail'den Product'a dönüştür
          setEditingProduct({
            id: product.id,
            type: product.type,
            name: product.name,
            productCode: product.productCode,
            cost: 0, // Detail'de yok, edit modunda API'den çekilir
            basePrice: product.basePrice,
            pricePeriodName: product.pricePeriodName,
            currencyCode: product.currencyCode,
            categoryName: product.categoryName,
            variantCount: 0, // Detail'den bilinmez, edit modunda API'den çekilir
            isActive: product.isActive,
          })
          setDialogOpen(true)
        }}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ürünü silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Ürün kalıcı olarak silinecektir.
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
