import { Package, Pencil, Tag, DollarSign, Calendar, Clock } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { useProductDetail } from "./hooks"
import { ProductType, ProductTypeLabels, type ProductDetail } from "./api"
import { usePermission } from "@/hooks/use-permission"
import { Permissions } from "@/lib/permissions"

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
          <div className="space-y-6">
            <SheetHeader>
              <SheetTitle>Ürün Detayları</SheetTitle>
              <SheetDescription>Yükleniyor...</SheetDescription>
            </SheetHeader>
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
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
          <div className="space-y-6">
            <SheetHeader>
              <SheetTitle>Ürün Detayları</SheetTitle>
              <SheetDescription>Bilgi bulunamadı</SheetDescription>
            </SheetHeader>
            <div className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">Ürün bulunamadı</p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
