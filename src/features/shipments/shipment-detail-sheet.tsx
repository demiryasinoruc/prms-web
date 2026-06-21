import {
  Truck,
  Warehouse,
  Calendar,
  PackageCheck,
  XCircle,
  Pencil,
  Package,
  Car,
  User,
  FileText,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  DetailSheetSkeleton,
  DetailSheetEmptyState,
} from "@/components/shared/detail-sheet-skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  useRentalShipmentDetail,
  useDispatchRentalShipment,
  useDeliverRentalShipment,
  useCancelRentalShipment,
  useDeleteRentalShipment,
} from "./hooks"
import {
  ShipmentStatus,
  ShipmentStatusLabels,
  ShipmentStatusClass,
  ShipmentFulfillmentTypeLabels,
} from "./api"
import { usePermission } from "@/hooks/use-permission"
import { Permissions } from "@/lib/permissions"

interface ShipmentDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shipmentId: string | null
  onEdit?: (id: string) => void
}

export function ShipmentDetailSheet({
  open,
  onOpenChange,
  shipmentId,
  onEdit,
}: ShipmentDetailSheetProps) {
  const { data: shipment, isLoading } = useRentalShipmentDetail(shipmentId)
  const canUpdate = usePermission(Permissions.Rental.Update)
  const canDelete = usePermission(Permissions.Rental.Delete)

  const dispatchShipment = useDispatchRentalShipment()
  const deliverShipment = useDeliverRentalShipment()
  const cancelShipment = useCancelRentalShipment()
  const deleteShipment = useDeleteRentalShipment()

  const busy =
    dispatchShipment.isPending ||
    deliverShipment.isPending ||
    cancelShipment.isPending ||
    deleteShipment.isPending

  const isPlanned = shipment?.status === ShipmentStatus.Planned
  const isDispatched = shipment?.status === ShipmentStatus.Dispatched

  const handleDispatch = () => {
    if (!shipment) return
    if (
      !window.confirm(
        `${shipment.shipmentNumber} numaralı sevkiyatı yola çıkarmak istediğinize emin misiniz? Stok kaynak depodan düşülecek.`,
      )
    )
      return
    dispatchShipment.mutate(shipment.id)
  }

  const handleDeliver = () => {
    if (!shipment) return
    if (
      !window.confirm(
        `${shipment.shipmentNumber} numaralı sevkiyatı teslim etmek istediğinize emin misiniz?`,
      )
    )
      return
    deliverShipment.mutate(shipment.id)
  }

  const handleCancel = () => {
    if (!shipment) return
    if (
      !window.confirm(
        `${shipment.shipmentNumber} numaralı sevkiyatı iptal etmek istediğinize emin misiniz?`,
      )
    )
      return
    cancelShipment.mutate(shipment.id)
  }

  const handleDelete = () => {
    if (!shipment) return
    if (
      !window.confirm(
        `${shipment.shipmentNumber} numaralı sevkiyatı silmek istediğinize emin misiniz?`,
      )
    )
      return
    deleteShipment.mutate(shipment.id, {
      onSuccess: () => onOpenChange(false),
    })
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        {/* KURAL 4: Her durumda SheetTitle render edilmeli */}
        {isLoading ? (
          <DetailSheetSkeleton title="Sevkiyat Detayları" />
        ) : shipment ? (
          <div className="space-y-6">
            <SheetHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Truck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <SheetTitle className="text-xl">{shipment.shipmentNumber}</SheetTitle>
                    <SheetDescription className="flex items-center gap-2 mt-1">
                      <Warehouse className="h-3 w-3" />
                      {shipment.sourceWarehouseName} · Kiralama {shipment.rentalNumber}
                    </SheetDescription>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
                  {canUpdate && isPlanned && (
                    <>
                      <Button size="sm" onClick={handleDispatch} disabled={busy}>
                        <Truck className="mr-2 h-4 w-4" />
                        Yola Çıkar
                      </Button>
                      {onEdit && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEdit(shipment.id)}
                          disabled={busy}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Düzenle
                        </Button>
                      )}
                    </>
                  )}
                  {canUpdate && isDispatched && (
                    <Button size="sm" onClick={handleDeliver} disabled={busy}>
                      <PackageCheck className="mr-2 h-4 w-4" />
                      Teslim Et
                    </Button>
                  )}
                  {canUpdate && (isPlanned || isDispatched) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={busy}
                      className="text-destructive hover:text-destructive"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      İptal
                    </Button>
                  )}
                  {canDelete && isPlanned && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDelete}
                      disabled={busy}
                      className="text-destructive hover:text-destructive"
                    >
                      Sil
                    </Button>
                  )}
                </div>
              </div>
            </SheetHeader>

            {/* Durum + Tip */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={ShipmentStatusClass[shipment.status]}>
                {ShipmentStatusLabels[shipment.status]}
              </Badge>
              <Badge variant="outline">
                {ShipmentFulfillmentTypeLabels[shipment.fulfillmentType]}
              </Badge>
            </div>

            <Separator />

            {/* Sevkiyat Bilgileri */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Sevkiyat Bilgileri
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Kaynak Depo</p>
                  <p className="font-medium">{shipment.sourceWarehouseName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Kiralama No</p>
                  <p className="font-medium">{shipment.rentalNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Planlı Tarih</p>
                  <p className="font-medium">{formatDate(shipment.plannedDate)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Araç</p>
                  <p className="font-medium flex items-center gap-1">
                    <Car className="h-3 w-3" />
                    {shipment.vehicleName || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Personel</p>
                  <p className="font-medium flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {shipment.employeeName || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Yola Çıkış Tarihi</p>
                  <p className="font-medium">{formatDate(shipment.dispatchedDate)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Teslim Tarihi</p>
                  <p className="font-medium">{formatDate(shipment.deliveredDate)}</p>
                </div>
                {shipment.cancelledDate && (
                  <div>
                    <p className="text-muted-foreground">İptal Tarihi</p>
                    <p className="font-medium">{formatDate(shipment.cancelledDate)}</p>
                  </div>
                )}
              </div>
              {shipment.notes && (
                <div className="text-sm">
                  <p className="text-muted-foreground flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Notlar
                  </p>
                  <p className="whitespace-pre-wrap">{shipment.notes}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Kalemler */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Package className="h-4 w-4" />
                Sevkiyat Kalemleri ({shipment.items.length})
              </h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ürün</TableHead>
                      <TableHead>Seri No</TableHead>
                      <TableHead className="text-right">Miktar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shipment.items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          Kalem bulunamadı
                        </TableCell>
                      </TableRow>
                    ) : (
                      shipment.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.productName}</p>
                              {item.productVariantSku && (
                                <p className="text-xs text-muted-foreground">
                                  {item.productVariantSku}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{item.serialNumber || "-"}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        ) : (
          <DetailSheetEmptyState title="Sevkiyat Detayları" message="Sevkiyat bulunamadı" />
        )}
      </SheetContent>
    </Sheet>
  )
}
