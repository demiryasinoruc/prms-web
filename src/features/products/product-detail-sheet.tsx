import { Package, Pencil, Tag, DollarSign, Calendar, Clock, Boxes, Settings2, Check, X } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { DetailSheetSkeleton, DetailSheetEmptyState } from "@/components/shared/detail-sheet-skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useProductDetail } from "./hooks"
import { ProductType, ProductTypeLabels, type ProductDetail } from "./api"
import { usePermission } from "@/hooks/use-permission"
import { Permissions } from "@/lib/permissions"
import { useInventoryStatsByProduct } from "@/features/inventory/hooks"
import { InventoryStatus, InventoryStatusLabels } from "@/features/inventory/api"
import { AttributeDataType } from "@/features/category-attributes/api"
import type { ProductDetailAttribute } from "./api"

interface ProductDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string | null
  onEdit?: (product: ProductDetail) => void
}

export function ProductDetailSheet({
  open,
  onOpenChange,
  productId,
  onEdit,
}: ProductDetailSheetProps) {
  const canUpdate = usePermission(Permissions.Product.Update)
  const { data: product, isLoading } = useProductDetail(productId)
  const { data: invStats } = useInventoryStatsByProduct(open ? productId : null)

  /**
   * Kategori özelliği değerini human-readable formata çevirir.
   * dataType'a göre doğru field'dan okunur ve TR locale ile formatlanır.
   */
  const formatAttributeValue = (attr: ProductDetailAttribute): React.ReactNode => {
    switch (attr.dataType) {
      case AttributeDataType.String:
      case AttributeDataType.Select:
      case AttributeDataType.MultiSelect:
        return attr.stringValue || <span className="text-muted-foreground">—</span>
      case AttributeDataType.Integer:
      case AttributeDataType.Decimal:
        return attr.numericValue !== null
          ? attr.numericValue.toLocaleString("tr-TR")
          : <span className="text-muted-foreground">—</span>
      case AttributeDataType.Boolean:
        if (attr.boolValue === null) return <span className="text-muted-foreground">—</span>
        return attr.boolValue ? (
          <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-400">
            <Check className="h-3.5 w-3.5" /> Evet
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <X className="h-3.5 w-3.5" /> Hayır
          </span>
        )
      case AttributeDataType.Date:
        return attr.dateValue
          ? new Date(attr.dateValue).toLocaleDateString("tr-TR")
          : <span className="text-muted-foreground">—</span>
      default:
        return attr.stringValue || <span className="text-muted-foreground">—</span>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        {/* KURAL: Her durumda SheetTitle/SheetDescription render edilmeli */}
        {isLoading ? (
          <DetailSheetSkeleton title="Ürün Detayları" />
        ) : product ? (
          <div className="space-y-6">
            <SheetHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <SheetTitle className="text-xl">{product.name}</SheetTitle>
                    <SheetDescription className="flex items-center gap-2 mt-1">
                      <Tag className="h-3 w-3" />
                      {product.productCode}
                    </SheetDescription>
                  </div>
                </div>
                {canUpdate && onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(product)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Düzenle
                  </Button>
                )}
              </div>
            </SheetHeader>

            <div className="flex items-center gap-2">
              <Badge variant={getProductTypeVariant(product.type)}>
                {ProductTypeLabels[product.type]}
              </Badge>
              <Badge variant={product.isActive ? "default" : "secondary"}>
                {product.isActive ? "Aktif" : "Pasif"}
              </Badge>
            </div>

            {product.description && (
              <p className="text-sm text-muted-foreground">
                {product.description}
              </p>
            )}

            {/* Kategori Özellikleri (U9) — sektör bağımsız generic attribute görüntüsü */}
            {product.attributeValues && product.attributeValues.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <Settings2 className="h-4 w-4" />
                    Özellikler
                    <Badge variant="outline" className="ml-auto">{product.attributeValues.length} alan</Badge>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 rounded-md border bg-muted/20 p-3">
                    {product.attributeValues.map((attr) => (
                      <div key={attr.categoryAttributeId} className="flex items-baseline justify-between gap-3 py-1">
                        <span className="text-sm text-muted-foreground truncate">
                          {attr.displayName}
                        </span>
                        <span className="text-sm font-medium text-right">
                          {formatAttributeValue(attr)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Envanter Özeti (P2-4) — sadece envanter kaydı varsa göster */}
            {invStats && invStats.total > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <Boxes className="h-4 w-4" />
                    Envanter Durumu
                    <Badge variant="outline" className="ml-auto">{invStats.total} adet</Badge>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { status: InventoryStatus.Available, classes: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
                      { status: InventoryStatus.Rented, classes: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
                      { status: InventoryStatus.Reserved, classes: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
                      { status: InventoryStatus.Maintenance, classes: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
                      { status: InventoryStatus.Broken, classes: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
                      { status: InventoryStatus.Lost, classes: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300" },
                      { status: InventoryStatus.Disposed, classes: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
                    ]
                      .filter((s) => (invStats.counts[s.status] ?? 0) > 0)
                      .map((s) => (
                        <div
                          key={s.status}
                          className={`rounded-md p-2 text-center ${s.classes}`}
                        >
                          <div className="text-xs font-medium">{InventoryStatusLabels[s.status]}</div>
                          <div className="text-lg font-bold mt-0.5">{invStats.counts[s.status]}</div>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Fiyat Bilgileri */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Fiyat Bilgileri
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Temel Fiyat</p>
                  <p className="font-medium text-lg">
                    {formatPrice(product.basePrice, product.currencyCode)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Periyot</p>
                  <p className="font-medium">{product.pricePeriodName}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Kategori ve Birim */}
            <div className="space-y-4">
              <h3 className="font-medium">Sınıflandırma</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Kategori</p>
                  <p className="font-medium">{product.categoryName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Birim</p>
                  <p className="font-medium">{product.unitTypeName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Min. Stok</p>
                  <p className="font-medium">{product.minimumStockLevel}</p>
                </div>
              </div>
            </div>

            {product.variantCount > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-medium">Varyantlar</h3>
                  <div className="text-sm">
                    <p className="text-muted-foreground">Toplam Varyant</p>
                    <p className="font-medium">{product.variantCount} adet</p>
                  </div>
                </div>
              </>
            )}

            {product.type === ProductType.Tracked && product.totalLifespan && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Ömür Bilgisi
                  </h3>
                  <div className="text-sm">
                    <p className="text-muted-foreground">Toplam Ömür</p>
                    <p className="font-medium">
                      {product.totalLifespan} {product.lifespanUnitTypeName || ""}
                    </p>
                  </div>
                </div>
              </>
            )}

            {product.notes && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="font-medium">Notlar</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {product.notes}
                  </p>
                </div>
              </>
            )}

            <Separator />

            {/* Meta Bilgiler */}
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Oluşturulma: {formatDate(product.createdDate)}
            </div>
          </div>
        ) : (
          <DetailSheetEmptyState title="Ürün Detayları" message="Ürün bulunamadı" />
        )}
      </SheetContent>
    </Sheet>
  )
}
