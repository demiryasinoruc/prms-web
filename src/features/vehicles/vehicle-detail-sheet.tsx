import { Pencil, Truck, Warehouse, Calendar, Gauge, FileText } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { useVehicle } from "./hooks"
import { VehicleType, VehicleStatus, type Vehicle } from "@/types/api"

const vehicleTypeLabels: Record<VehicleType, string> = {
  [VehicleType.Truck]: "Kamyon",
  [VehicleType.Van]: "Kamyonet",
  [VehicleType.Minibus]: "Minibüs",
  [VehicleType.Car]: "Binek",
  [VehicleType.Other]: "Diğer",
}

const vehicleStatusLabels: Record<VehicleStatus, string> = {
  [VehicleStatus.Available]: "Müsait",
  [VehicleStatus.InTransit]: "Teslimat'ta",
  [VehicleStatus.Maintenance]: "Bakımda",
  [VehicleStatus.Broken]: "Arızalı",
}

const vehicleStatusVariants: Record<VehicleStatus, "default" | "secondary" | "destructive" | "outline"> = {
  [VehicleStatus.Available]: "default",
  [VehicleStatus.InTransit]: "secondary",
  [VehicleStatus.Maintenance]: "outline",
  [VehicleStatus.Broken]: "destructive",
}

interface VehicleDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicleId: string | null
  onEdit: (vehicle: Vehicle) => void
}

export function VehicleDetailSheet({
  open,
  onOpenChange,
  vehicleId,
  onEdit,
}: VehicleDetailSheetProps) {
  const { data: vehicle, isLoading } = useVehicle(vehicleId || "")

  const handleEdit = () => {
    if (vehicle) {
      onEdit(vehicle)
      onOpenChange(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        {isLoading ? (
          <DetailSheetSkeleton title="Araç Detayları" />
        ) : vehicle ? (
          <div className="space-y-6">
            <SheetHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <Truck className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <SheetTitle className="text-left">{vehicle.plate}</SheetTitle>
                    <SheetDescription className="text-left">
                      {vehicle.brandName} {vehicle.model}
                    </SheetDescription>
                  </div>
                </div>
                <Button size="sm" onClick={handleEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Düzenle
                </Button>
              </div>
            </SheetHeader>

            <div className="flex gap-2">
              <Badge variant="outline">
                {vehicleTypeLabels[vehicle.vehicleType]}
              </Badge>
              <Badge variant={vehicleStatusVariants[vehicle.status]}>
                {vehicleStatusLabels[vehicle.status]}
              </Badge>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Araç Bilgileri</CardTitle>
                  <CardDescription>Temel araç detayları</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Model Yılı</p>
                      <p className="text-sm font-medium">{vehicle.year || "-"}</p>
                    </div>
                  </div>
                  {vehicle.color && (
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: vehicle.color.toLowerCase() }} />
                      <div>
                        <p className="text-xs text-muted-foreground">Renk</p>
                        <p className="text-sm font-medium">{vehicle.color}</p>
                      </div>
                    </div>
                  )}
                  {vehicle.capacity ? (
                    <div className="flex items-center gap-3">
                      <Gauge className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Kapasite</p>
                        <p className="text-sm font-medium">
                          {vehicle.capacity} {vehicle.capacityUnit}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Lokasyon</CardTitle>
                  <CardDescription>Aracın bağlı olduğu depo</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Warehouse className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Depo</p>
                      <p className="text-sm font-medium">{vehicle.warehouseName || "-"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {vehicle.notes && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Notlar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="text-sm whitespace-pre-wrap">{vehicle.notes}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <DetailSheetEmptyState title="Araç Detayları" message="Araç bulunamadı" />
        )}
      </SheetContent>
    </Sheet>
  )
}
