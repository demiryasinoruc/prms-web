import {
  Package,
  Pencil,
  Tag,
  Warehouse,
  Calendar,
  Clock,
  Hash,
  Activity,
  FileText,
} from "lucide-react"
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
import { useInventoryDetail } from "./hooks"
import {
  InventoryStatus,
  InventoryStatusLabels,
  type InventoryDetail,
} from "./api"
import { ProductType, ProductTypeLabels } from "@/features/products/api"
import { usePermission } from "@/hooks/use-permission"
import { Permissions } from "@/lib/permissions"

interface InventoryDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  inventoryId: string | null
  onEdit?: (inventory: InventoryDetail) => void
}

export function InventoryDetailSheet({
  open,
  onOpenChange,
  inventoryId,
  onEdit,
}: InventoryDetailSheetProps) {
  const canUpdate = usePermission(Permissions.Inventory.Update)
  const { data: inventory, isLoading } = useInventoryDetail(inventoryId)

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("tr-TR").format(value)
  }

  const getStatusVariant = (status: InventoryStatus) => {
    switch (status) {
      case InventoryStatus.Available:
        return "default"
      case InventoryStatus.Rented:
        return "secondary"
      case InventoryStatus.Maintenance:
        return "outline"
      case InventoryStatus.Broken:
        return "destructive"
      case InventoryStatus.Lost:
        return "destructive"
      case InventoryStatus.Disposed:
        return "secondary"
      case InventoryStatus.Reserved:
        return "outline"
      default:
        return "default"
    }
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
              <SheetTitle>Envanter Detayları</SheetTitle>
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
        ) : inventory ? (
          <div className="space-y-6">
            <SheetHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <SheetTitle className="text-xl">{inventory.productName}</SheetTitle>
                    <SheetDescription className="flex items-center gap-2 mt-1">
                      <Hash className="h-3 w-3" />
                      {inventory.serialNumber || inventory.productCode}
                    </SheetDescription>
                  </div>
                </div>
                {canUpdate && onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(inventory)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Düzenle
                  </Button>
                )}
              </div>
            </SheetHeader>

            {/* Durum Bilgileri */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={getStatusVariant(inventory.status)}>
                {InventoryStatusLabels[inventory.status]}
              </Badge>
              <Badge variant={getProductTypeVariant(inventory.productType)}>
                {ProductTypeLabels[inventory.productType]}
              </Badge>
              <Badge variant={inventory.isActive ? "default" : "secondary"}>
                {inventory.isActive ? "Aktif" : "Pasif"}
              </Badge>
            </div>

            <Separator />

            {/* Temel Bilgiler */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Temel Bilgiler
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Ürün Kodu</p>
                  <p className="font-medium">{inventory.productCode}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Seri Numarası</p>
                  <p className="font-medium">{inventory.serialNumber || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Miktar</p>
                  <p className="font-medium">{formatNumber(inventory.quantity)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Birim Değer</p>
                  <p className="font-medium">{formatNumber(inventory.currentUnitValue)} ₺</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Depo Bilgileri */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Warehouse className="h-4 w-4" />
                Depo Bilgileri
              </h3>
              <div className="text-sm">
                <p className="text-muted-foreground">Bulunduğu Depo</p>
                <p className="font-medium">{inventory.warehouseName}</p>
              </div>
            </div>

            {/* Ömür Bilgileri - Sadece takipli ürünler için */}
            {inventory.productType === ProductType.Tracked && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Ömür Bilgileri
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Mevcut Kullanım</p>
                      <p className="font-medium">
                        {inventory.currentLifespan != null
                          ? formatNumber(inventory.currentLifespan)
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Toplam Ömür</p>
                      <p className="font-medium">
                        {inventory.totalLifespan != null
                          ? formatNumber(inventory.totalLifespan)
                          : "-"}
                      </p>
                    </div>
                    {inventory.totalLifespan != null && inventory.currentLifespan != null && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Kalan Ömür</p>
                        <p className="font-medium">
                          {formatNumber(inventory.totalLifespan - inventory.currentLifespan)}
                          <span className="text-muted-foreground ml-2">
                            ({Math.round(((inventory.totalLifespan - inventory.currentLifespan) / inventory.totalLifespan) * 100)}%)
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Bakım Bilgileri */}
            {inventory.lastMaintenanceDate && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Bakım Bilgileri
                  </h3>
                  <div className="text-sm">
                    <p className="text-muted-foreground">Son Bakım Tarihi</p>
                    <p className="font-medium">{formatDate(inventory.lastMaintenanceDate)}</p>
                  </div>
                </div>
              </>
            )}

            {/* Son Kullanma Tarihi */}
            {inventory.expiryDate && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Son Kullanma Tarihi
                  </h3>
                  <div className="text-sm">
                    <p className="text-muted-foreground">Tarih</p>
                    <p className="font-medium">{formatDate(inventory.expiryDate)}</p>
                  </div>
                </div>
              </>
            )}

            {/* Notlar */}
            {inventory.notes && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Notlar
                  </h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {inventory.notes}
                  </p>
                </div>
              </>
            )}

            <Separator />

            {/* Meta Bilgiler */}
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Oluşturulma: {formatDate(inventory.createdDate)}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <SheetHeader>
              <SheetTitle>Envanter Detayları</SheetTitle>
              <SheetDescription>Bilgi bulunamadı</SheetDescription>
            </SheetHeader>
            <div className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">Envanter kaydı bulunamadı</p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
