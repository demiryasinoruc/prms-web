import {
  ArrowRightLeft,
  Warehouse,
  Calendar,
  Truck,
  PackageCheck,
  XCircle,
  Pencil,
  Package,
  User,
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
  useWarehouseTransferDetail,
  useDispatchWarehouseTransfer,
  useReceiveWarehouseTransfer,
  useCancelWarehouseTransfer,
} from "./hooks"
import { TransferStatus, TransferStatusLabels, TransferStatusClass } from "./api"
import { usePermission } from "@/hooks/use-permission"
import { Permissions } from "@/lib/permissions"

interface WarehouseTransferDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transferId: string | null
  onEdit?: (id: string) => void
}

export function WarehouseTransferDetailSheet({
  open,
  onOpenChange,
  transferId,
  onEdit,
}: WarehouseTransferDetailSheetProps) {
  const { data: transfer, isLoading } = useWarehouseTransferDetail(transferId)
  const canUpdate = usePermission(Permissions.Inventory.Update)

  const dispatchTransfer = useDispatchWarehouseTransfer()
  const receiveTransfer = useReceiveWarehouseTransfer()
  const cancelTransfer = useCancelWarehouseTransfer()

  const busy =
    dispatchTransfer.isPending || receiveTransfer.isPending || cancelTransfer.isPending

  const isPlanned = transfer?.status === TransferStatus.Planned
  const isDispatched = transfer?.status === TransferStatus.Dispatched

  const handleDispatch = () => {
    if (!transfer) return
    if (
      !window.confirm(
        `${transfer.transferNumber} numaralı transferi göndermek istediğinize emin misiniz? Stok kaynak depodan düşülecek.`,
      )
    )
      return
    dispatchTransfer.mutate(transfer.id)
  }

  const handleReceive = () => {
    if (!transfer) return
    if (
      !window.confirm(
        `${transfer.transferNumber} numaralı transferi teslim almak istediğinize emin misiniz? Stok hedef depoya eklenecek.`,
      )
    )
      return
    receiveTransfer.mutate(transfer.id)
  }

  const handleCancel = () => {
    if (!transfer) return
    if (
      !window.confirm(
        `${transfer.transferNumber} numaralı transferi iptal etmek istediğinize emin misiniz?`,
      )
    )
      return
    cancelTransfer.mutate(transfer.id)
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
        {/* KURAL: Her durumda SheetTitle/SheetDescription render edilmeli */}
        {isLoading ? (
          <DetailSheetSkeleton title="Transfer Detayları" />
        ) : transfer ? (
          <div className="space-y-6">
            <SheetHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <ArrowRightLeft className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <SheetTitle className="text-xl">{transfer.transferNumber}</SheetTitle>
                    <SheetDescription className="flex items-center gap-2 mt-1">
                      <Warehouse className="h-3 w-3" />
                      {transfer.sourceWarehouseName} → {transfer.destinationWarehouseName}
                    </SheetDescription>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
                  {canUpdate && isPlanned && (
                    <>
                      <Button size="sm" onClick={handleDispatch} disabled={busy}>
                        <Truck className="mr-2 h-4 w-4" />
                        Gönder
                      </Button>
                      {onEdit && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEdit(transfer.id)}
                          disabled={busy}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Düzenle
                        </Button>
                      )}
                    </>
                  )}
                  {canUpdate && isDispatched && (
                    <Button size="sm" onClick={handleReceive} disabled={busy}>
                      <PackageCheck className="mr-2 h-4 w-4" />
                      Teslim Al
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
                </div>
              </div>
            </SheetHeader>

            {/* Durum */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={TransferStatusClass[transfer.status]}>
                {TransferStatusLabels[transfer.status]}
              </Badge>
            </div>

            <Separator />

            {/* Tarih ve Depo Bilgileri */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Transfer Bilgileri
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Kaynak Depo</p>
                  <p className="font-medium">{transfer.sourceWarehouseName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Hedef Depo</p>
                  <p className="font-medium">{transfer.destinationWarehouseName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Planlı Tarih</p>
                  <p className="font-medium">{formatDate(transfer.plannedDate)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Gönderim Tarihi</p>
                  <p className="font-medium">{formatDate(transfer.dispatchedDate)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Teslim Alma Tarihi</p>
                  <p className="font-medium">{formatDate(transfer.receivedDate)}</p>
                </div>
                {transfer.createdByUserName && (
                  <div>
                    <p className="text-muted-foreground">Oluşturan</p>
                    <p className="font-medium flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {transfer.createdByUserName}
                    </p>
                  </div>
                )}
              </div>
              {transfer.notes && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Notlar</p>
                  <p className="whitespace-pre-wrap">{transfer.notes}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Kalemler */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Package className="h-4 w-4" />
                Transfer Kalemleri ({transfer.items.length})
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
                    {transfer.items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          Kalem bulunamadı
                        </TableCell>
                      </TableRow>
                    ) : (
                      transfer.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.productName}</p>
                              {item.productVariantName && (
                                <p className="text-xs text-muted-foreground">
                                  {item.productVariantName}
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
          <DetailSheetEmptyState title="Transfer Detayları" message="Transfer bulunamadı" />
        )}
      </SheetContent>
    </Sheet>
  )
}
