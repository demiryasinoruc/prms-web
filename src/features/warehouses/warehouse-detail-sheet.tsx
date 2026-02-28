import { Pencil, Warehouse, MapPin, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { DetailSheetSkeleton, DetailSheetEmptyState } from "@/components/shared/detail-sheet-skeleton"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useWarehouse } from "./hooks"
import type { Warehouse as WarehouseType } from "@/types/api"

interface WarehouseDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  warehouseId: string | null
  onEdit: (warehouse: WarehouseType) => void
}

export function WarehouseDetailSheet({
  open,
  onOpenChange,
  warehouseId,
  onEdit,
}: WarehouseDetailSheetProps) {
  const { data: warehouse, isLoading } = useWarehouse(warehouseId || "")

  const handleEdit = () => {
    if (warehouse) {
      onEdit(warehouse)
      onOpenChange(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        {isLoading ? (
          <DetailSheetSkeleton title="Depo Detayı" />
        ) : warehouse ? (
          <div className="space-y-6">
            <SheetHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <Warehouse className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <SheetTitle className="text-left">{warehouse.name}</SheetTitle>
                    <SheetDescription className="text-left">
                      Depo Detayları
                    </SheetDescription>
                  </div>
                </div>
                <Button size="sm" onClick={handleEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Düzenle
                </Button>
              </div>
            </SheetHeader>

            <div className="space-y-4">
              {warehouse.address && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Adres</CardTitle>
                    <CardDescription>Depo lokasyonu</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="text-sm whitespace-pre-wrap">{warehouse.address}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {warehouse.contactInfo && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">İletişim</CardTitle>
                    <CardDescription>İletişim bilgileri</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">{warehouse.contactInfo}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!warehouse.address && !warehouse.contactInfo && (
                <Card>
                  <CardContent className="py-8">
                    <p className="text-center text-muted-foreground">
                      Ek bilgi bulunmuyor
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <DetailSheetEmptyState title="Depo Detayı" message="Depo bulunamadı" />
        )}
      </SheetContent>
    </Sheet>
  )
}
