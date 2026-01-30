import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { Pencil, Trash2, Plus, Wand2 } from "lucide-react"
import {
  useProductVariants,
  useDeleteProductVariant,
} from "@/features/product-variants/hooks"
import type { CategoryAttributeForEdit } from "@/features/category-attributes/api"
import { ProductVariantDialog } from "./product-variant-dialog"
import { ProductVariantBulkDialog } from "./product-variant-bulk-dialog"

interface ProductVariantManagerProps {
  productId: string
  variantAttributes: CategoryAttributeForEdit[]
}

export function ProductVariantManager({
  productId,
  variantAttributes,
}: ProductVariantManagerProps) {
  const { data: variants, isLoading } = useProductVariants(productId)
  const deleteMutation = useDeleteProductVariant()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleEdit = (id: string) => {
    setEditingVariantId(id)
    setDialogOpen(true)
  }

  const handleCreate = () => {
    setEditingVariantId(null)
    setDialogOpen(true)
  }

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId)
      setDeleteId(null)
    }
  }

  if (isLoading) {
    return <div className="py-4 text-center text-muted-foreground">Yükleniyor...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {variants?.length || 0} varyant tanımlı
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setBulkDialogOpen(true)}
          >
            <Wand2 className="mr-2 h-4 w-4" />
            Otomatik Oluştur
          </Button>
          <Button type="button" size="sm" onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Varyant
          </Button>
        </div>
      </div>

      {variants && variants.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Özellikler</TableHead>
                <TableHead>Fiyat</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="w-[100px]">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((variant) => (
                <TableRow key={variant.id}>
                  <TableCell className="font-medium">{variant.sku}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {variant.variantValues.map((vv) => (
                        <Badge key={vv.categoryAttributeId} variant="secondary">
                          {vv.attributeDisplayName}: {vv.optionValue}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {variant.priceOverride != null
                      ? variant.priceOverride.toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                        })
                      : (
                          <span className="text-muted-foreground">
                            {variant.productBasePrice.toLocaleString("tr-TR", {
                              minimumFractionDigits: 2,
                            })}{" "}
                            (ana ürün)
                          </span>
                        )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={variant.isActive ? "default" : "secondary"}>
                      {variant.isActive ? "Aktif" : "Pasif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(variant.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(variant.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="py-8 text-center text-muted-foreground border rounded-md">
          Henüz varyant tanımlanmamış. "Otomatik Oluştur" veya "Yeni Varyant" butonunu kullanarak
          varyant ekleyebilirsiniz.
        </div>
      )}

      <ProductVariantDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        productId={productId}
        variantId={editingVariantId}
        variantAttributes={variantAttributes}
      />

      <ProductVariantBulkDialog
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
        productId={productId}
        variantAttributes={variantAttributes}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Varyantı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu varyantı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
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
