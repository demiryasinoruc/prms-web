import { useMemo, useState } from "react"
import {
  FileText,
  User,
  MapPin,
  Warehouse,
  Truck,
  UserCheck,
  Calendar,
  Clock,
  Package,
  Wrench,
  CreditCard,
  DollarSign,
  AlertTriangle,
  AlertCircle,
  PackageCheck,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { DetailSheetSkeleton, DetailSheetEmptyState } from "@/components/shared/detail-sheet-skeleton"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useRentalDetail, useUpdateRentalStatus, useCancelRental } from "./hooks"
import {
  RentalStatus,
  RentalStatusLabels,
  RentalFlag,
  RentalFlagLabels,
  PaymentTypeLabels,
  ReturnConditionLabels,
  DiscountType,
} from "./api"
import { DeliveryType } from "@/features/company/api"
import { useAvailabilityBatch } from "@/features/availability/hooks"
import type { BatchAvailabilityRequest } from "@/features/availability/api"
import { AttachmentSection } from "@/features/attachments/attachment-section"
import { Button } from "@/components/ui/button"
import { RentalReturnDialog } from "./rental-return-dialog"

interface RentalDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rentalId: string | null
}

export function RentalDetailSheet({
  open,
  onOpenChange,
  rentalId,
}: RentalDetailSheetProps) {
  const { data: rental, isLoading } = useRentalDetail(rentalId)
  const [returnDialogOpen, setReturnDialogOpen] = useState(false)
  const updateStatus = useUpdateRentalStatus()
  const cancelRental = useCancelRental()

  // İade butonu sadece Aktif + iade edilmemiş kalem varsa (iptal değilse).
  const canReturn =
    rental != null &&
    !rental.isCancelled &&
    rental.status === RentalStatus.Active &&
    rental.items.some((i) => !i.isReturned)

  // Statü geçiş aksiyonları — iptal edilmemiş kiralamalar için.
  const canConfirm = rental != null && !rental.isCancelled && rental.status === RentalStatus.Pending
  const canDeliver = rental != null && !rental.isCancelled && rental.status === RentalStatus.Confirmed
  const canCancel =
    rental != null && !rental.isCancelled && rental.status !== RentalStatus.Completed

  const handleConfirm = () => {
    if (!rental) return
    updateStatus.mutate({ id: rental.id, data: { status: RentalStatus.Confirmed } })
  }
  const handleDeliver = () => {
    if (!rental) return
    updateStatus.mutate({
      id: rental.id,
      data: { status: RentalStatus.Active, actualStartDate: new Date().toISOString() },
    })
  }
  const handleCancel = () => {
    if (!rental) return
    if (!window.confirm(`${rental.rentalNumber} numaralı kiralamayı iptal etmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) {
      return
    }
    cancelRental.mutate(rental.id)
  }

  const statusBusy = updateStatus.isPending || cancelRental.isPending

  // Detay açıldığında bu kiralamanın current çakışmalarını sorgula.
  // excludeRentalId ile bu kiralama kendi içeriğiyle çakışıyor sayılmaz.
  const availabilityRequest = useMemo<BatchAvailabilityRequest | null>(() => {
    if (!open || !rental) return null
    const items = rental.items
      .filter((i) => !i.isReturned)
      .map((i, idx) => ({
        itemKey: `item-${idx}`,
        productId: i.productId,
        productVariantId: i.productVariantId || undefined,
        inventoryId: i.inventoryId || undefined,
        quantity: i.quantity,
        startDateTime: i.startDateTime || undefined,
        endDateTime: i.endDateTime || undefined,
      }))
    const vehicles: BatchAvailabilityRequest["vehicles"] = []
    if (rental.deliveryVehicleId) {
      vehicles.push({
        itemKey: "delivery-vehicle",
        vehicleId: rental.deliveryVehicleId,
        startDate: rental.plannedStartDate,
        endDate: rental.plannedStartDate,
      })
    }
    const employees: BatchAvailabilityRequest["employees"] = []
    if (rental.deliveryEmployeeId) {
      employees.push({
        itemKey: "delivery-employee",
        employeeId: rental.deliveryEmployeeId,
        startDate: rental.plannedStartDate,
        endDate: rental.plannedStartDate,
      })
    }
    rental.services.forEach((s, idx) => {
      if (s.assignedVehicleId) {
        vehicles.push({
          itemKey: `service-vehicle-${idx}`,
          vehicleId: s.assignedVehicleId,
          startDate: s.startDateTime || rental.plannedStartDate,
          endDate: s.endDateTime || rental.plannedEndDate,
        })
      }
      if (s.assignedEmployeeId) {
        employees.push({
          itemKey: `service-employee-${idx}`,
          employeeId: s.assignedEmployeeId,
          startDate: s.startDateTime || rental.plannedStartDate,
          endDate: s.endDateTime || rental.plannedEndDate,
        })
      }
    })
    return {
      excludeRentalId: rental.id,
      defaultStartDate: rental.plannedStartDate,
      defaultEndDate: rental.plannedEndDate,
      warehouseId: rental.sourceWarehouseId,
      items,
      vehicles,
      employees,
    }
  }, [open, rental])

  const { data: availabilityData } = useAvailabilityBatch(availabilityRequest)

  const detailConflicts = useMemo(() => {
    if (!availabilityData?.results || !rental) return [] as { label: string; rentalNumber?: string }[]
    const result: { label: string; rentalNumber?: string }[] = []
    for (const r of availabilityData.results) {
      if (r.isAvailable || r.conflicts.length === 0) continue
      let label = r.itemKey
      if (r.itemKey.startsWith("item-")) {
        const idx = parseInt(r.itemKey.slice(5), 10)
        label = `Ürün — ${rental.items[idx]?.productName ?? `${idx + 1}`}`
      } else if (r.itemKey === "delivery-vehicle") {
        label = `Teslimat aracı (${rental.deliveryVehiclePlate || ""})`
      } else if (r.itemKey === "delivery-employee") {
        label = `Teslimat personeli (${rental.deliveryEmployeeName || ""})`
      } else if (r.itemKey.startsWith("service-vehicle-")) {
        const idx = parseInt(r.itemKey.slice("service-vehicle-".length), 10)
        label = `Hizmet aracı (${rental.services[idx]?.assignedVehiclePlate || ""})`
      } else if (r.itemKey.startsWith("service-employee-")) {
        const idx = parseInt(r.itemKey.slice("service-employee-".length), 10)
        label = `Hizmet personeli (${rental.services[idx]?.assignedEmployeeName || ""})`
      }
      for (const c of r.conflicts) {
        result.push({ label, rentalNumber: c.rentalNumber })
      }
    }
    return result
  }, [availabilityData, rental])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleString("tr-TR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatPrice = (amount: number, currencyCode?: string) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: currencyCode || "TRY",
    }).format(amount)
  }

  const getStatusVariant = (status: RentalStatus) => {
    switch (status) {
      case RentalStatus.Pending:
        return "secondary"
      case RentalStatus.Confirmed:
        return "outline"
      case RentalStatus.Active:
        return "default"
      case RentalStatus.Completed:
        return "default"
      default:
        return "default"
    }
  }

  const hasFlag = (flags: RentalFlag, flag: RentalFlag) => (flags & flag) === flag

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        {/* KURAL: Her durumda SheetTitle/SheetDescription render edilmeli */}
        {isLoading ? (
          <DetailSheetSkeleton title="Kiralama Detayları" />
        ) : rental ? (
          <div className="space-y-6">
            <SheetHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <SheetTitle className="text-xl">{rental.rentalNumber}</SheetTitle>
                    <SheetDescription className="flex items-center gap-2 mt-1">
                      <User className="h-3 w-3" />
                      {rental.customerName}
                    </SheetDescription>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
                  {canConfirm && (
                    <Button size="sm" onClick={handleConfirm} disabled={statusBusy}>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Onayla
                    </Button>
                  )}
                  {canDeliver && (
                    <Button size="sm" onClick={handleDeliver} disabled={statusBusy}>
                      <Truck className="mr-2 h-4 w-4" />
                      Teslim Et
                    </Button>
                  )}
                  {canReturn && (
                    <Button size="sm" onClick={() => setReturnDialogOpen(true)} disabled={statusBusy}>
                      <PackageCheck className="mr-2 h-4 w-4" />
                      İade Et
                    </Button>
                  )}
                  {canCancel && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={statusBusy}
                      className="text-destructive hover:text-destructive"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      İptal Et
                    </Button>
                  )}
                </div>
              </div>
            </SheetHeader>

            {/* Çakışma Banner (U7) — sadece çakışma varsa görünür */}
            {detailConflicts.length > 0 && (
              <div
                role="alert"
                className="rounded-md border border-amber-300 bg-amber-50 p-4 dark:bg-amber-950/30 dark:border-amber-800"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-700 dark:text-amber-400" />
                  <div className="flex-1 space-y-2">
                    <p className="font-medium text-amber-900 dark:text-amber-200">
                      Bu kiralamada {detailConflicts.length} çakışma tespit edildi
                    </p>
                    <ul className="space-y-1 text-sm text-amber-900 dark:text-amber-200">
                      {detailConflicts.map((c, idx) => (
                        <li key={idx}>
                          <span className="font-medium">{c.label}</span>
                          {c.rentalNumber ? (
                            <span className="text-amber-800 dark:text-amber-300">
                              {" "}— {c.rentalNumber} ile çakışıyor
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Durum ve Bayraklar */}
            <div className="flex items-center gap-2 flex-wrap">
              {rental.isCancelled ? (
                <Badge variant="destructive">İptal Edildi</Badge>
              ) : (
                <Badge variant={getStatusVariant(rental.status)}>
                  {RentalStatusLabels[rental.status]}
                </Badge>
              )}
              {!rental.isCancelled && rental.hasPartialReturn && (
                <Badge variant="outline">Kısmi İade</Badge>
              )}
              {hasFlag(rental.flags, RentalFlag.StartDelayed) && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {RentalFlagLabels[RentalFlag.StartDelayed]}
                </Badge>
              )}
              {hasFlag(rental.flags, RentalFlag.ReturnDelayed) && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {RentalFlagLabels[RentalFlag.ReturnDelayed]}
                </Badge>
              )}
            </div>

            <Separator />

            {/* Tarih Bilgileri */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Tarih Bilgileri
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Planlanan Başlangıç</p>
                  <p className="font-medium">{formatDate(rental.plannedStartDate)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Planlanan Bitiş</p>
                  <p className="font-medium">{formatDate(rental.plannedEndDate)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Gerçekleşen Başlangıç</p>
                  <p className="font-medium">{formatDate(rental.actualStartDate)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Gerçekleşen Bitiş</p>
                  <p className="font-medium">{formatDate(rental.actualEndDate)}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Teslimat Bilgileri */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Teslimat Bilgileri
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="col-span-2">
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Truck className="h-3 w-3" /> Teslimat Tipi
                  </p>
                  <Badge variant={rental.deliveryType === DeliveryType.CompanyDelivery ? "default" : "secondary"}>
                    {rental.deliveryType === DeliveryType.CompanyDelivery
                      ? "Teslimatı Biz Yapıyoruz"
                      : "Müşteri Teslim Alacak"}
                  </Badge>
                </div>
                {rental.deliveryType === DeliveryType.CompanyDelivery && rental.deliveryAddressLine && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Teslimat Adresi
                    </p>
                    <p className="font-medium">{rental.deliveryAddressLine}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Warehouse className="h-3 w-3" /> Kaynak Depo
                  </p>
                  <p className="font-medium">{rental.sourceWarehouseName || "-"}</p>
                </div>
                {rental.deliveryType === DeliveryType.CompanyDelivery && (
                  <>
                    <div>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Truck className="h-3 w-3" /> Araç
                      </p>
                      <p className="font-medium">{rental.deliveryVehiclePlate || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <UserCheck className="h-3 w-3" /> Teslimat Personeli
                      </p>
                      <p className="font-medium">{rental.deliveryEmployeeName || "-"}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <Separator />

            {/* Kiralama Kalemleri */}
            {rental.items.length > 0 && (
              <>
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Kiralama Kalemleri ({rental.items.length})
                  </h3>
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ürün</TableHead>
                          <TableHead className="text-right">Miktar</TableHead>
                          <TableHead className="text-right">Fiyat</TableHead>
                          <TableHead className="text-right">Toplam</TableHead>
                          <TableHead>Durum</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rental.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.productName}</p>
                                {item.productVariantSku && (
                                  <p className="text-xs text-muted-foreground">
                                    Varyant: {item.productVariantSku}
                                  </p>
                                )}
                                {item.inventorySerialNumber && (
                                  <p className="text-xs text-muted-foreground">
                                    SN: {item.inventorySerialNumber}
                                  </p>
                                )}
                                {item.discountValue > 0 && (
                                  <div className="text-xs text-green-600 mt-1">
                                    İndirim: {item.discountType === DiscountType.Percent
                                      ? `%${item.discountValue}`
                                      : formatPrice(item.discountValue, rental.currencyCode)}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">
                              {formatPrice(item.unitPrice, rental.currencyCode)}
                              {item.pricePeriodName && (
                                <span className="text-xs text-muted-foreground block">
                                  /{item.pricePeriodName}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.discountAmount > 0 && (
                                <span className="text-xs text-green-600 block">
                                  -{formatPrice(item.discountAmount, rental.currencyCode)}
                                </span>
                              )}
                              <span className="font-medium">
                                {formatPrice(item.lineTotal, rental.currencyCode)}
                              </span>
                            </TableCell>
                            <TableCell>
                              {item.isReturned ? (
                                <Badge variant={item.returnCondition === 1 ? "default" : "destructive"}>
                                  {item.returnCondition && ReturnConditionLabels[item.returnCondition]}
                                </Badge>
                              ) : item.isDelivered ? (
                                <Badge variant="outline">Teslim Edildi</Badge>
                              ) : (
                                <Badge variant="secondary">Bekliyor</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Ek Hizmetler */}
            {rental.services.length > 0 && (
              <>
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Ek Hizmetler ({rental.services.length})
                  </h3>
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Hizmet</TableHead>
                          <TableHead>Personel</TableHead>
                          <TableHead className="text-right">Miktar</TableHead>
                          <TableHead className="text-right">Toplam</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rental.services.map((service) => (
                          <TableRow key={service.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{service.extraServiceName}</p>
                                {service.discountValue > 0 && (
                                  <div className="text-xs text-green-600 mt-1">
                                    İndirim: {service.discountType === DiscountType.Percent
                                      ? `%${service.discountValue}`
                                      : formatPrice(service.discountValue, rental.currencyCode)}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{service.assignedEmployeeName || "-"}</TableCell>
                            <TableCell className="text-right">{service.quantity}</TableCell>
                            <TableCell className="text-right">
                              {service.discountAmount > 0 && (
                                <span className="text-xs text-green-600 block">
                                  -{formatPrice(service.discountAmount, rental.currencyCode)}
                                </span>
                              )}
                              <span className="font-medium">
                                {formatPrice(service.lineTotal, rental.currencyCode)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Fiyat Özeti */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Fiyat Özeti
              </h3>
              {/* Döviz kuru bilgisi - TL değilse göster */}
              {rental.currencyCode && !rental.currencyCode.includes("TL") && !rental.currencyCode.includes("TRY") && rental.exchangeRate > 0 && (
                <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                  Döviz Kuru: 1 {rental.currencyCode} = {rental.exchangeRate.toFixed(4)} TL
                </div>
              )}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ara Toplam</span>
                  <span>{formatPrice(rental.subTotal, rental.currencyCode)}</span>
                </div>
                {rental.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>İndirim ({rental.discountPercent}%)</span>
                    <span>-{formatPrice(rental.discountAmount, rental.currencyCode)}</span>
                  </div>
                )}
                {rental.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">KDV</span>
                    <span>{formatPrice(rental.taxAmount, rental.currencyCode)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-medium text-base">
                  <span>Toplam</span>
                  <div className="text-right">
                    <span>{formatPrice(rental.totalAmount, rental.currencyCode)}</span>
                    {/* TL karşılığını göster - TL değilse */}
                    {rental.currencyCode && !rental.currencyCode.includes("TL") && !rental.currencyCode.includes("TRY") && rental.exchangeRate > 0 && (
                      <span className="block text-xs text-muted-foreground">
                        ≈ {formatPrice(rental.totalAmount * rental.exchangeRate, "TRY")}
                      </span>
                    )}
                  </div>
                </div>
                {rental.depositAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Depozito (Talep)</span>
                    <span>{formatPrice(rental.depositAmount, rental.currencyCode)}</span>
                  </div>
                )}
                {rental.depositPaidAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Depozito (Ödenen)</span>
                    <span className="text-green-600">{formatPrice(rental.depositPaidAmount, rental.currencyCode)}</span>
                  </div>
                )}
                {rental.depositRefundedAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Depozito (İade)</span>
                    <span className="text-orange-600">{formatPrice(rental.depositRefundedAmount, rental.currencyCode)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ödenen</span>
                  <span className="text-green-600">{formatPrice(rental.paidAmount, rental.currencyCode)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Kalan</span>
                  <span className={rental.totalAmount - rental.paidAmount > 0 ? "text-destructive" : "text-green-600"}>
                    {formatPrice(rental.totalAmount - rental.paidAmount, rental.currencyCode)}
                  </span>
                </div>
              </div>
            </div>

            {/* Ödemeler */}
            {rental.payments.length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Ödemeler ({rental.payments.length})
                  </h3>
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tarih</TableHead>
                          <TableHead>Tip</TableHead>
                          <TableHead>Yöntem</TableHead>
                          <TableHead className="text-right">Tutar</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rental.payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>{formatDateTime(payment.paymentDate)}</TableCell>
                            <TableCell>{PaymentTypeLabels[payment.type]}</TableCell>
                            <TableCell>{payment.paymentMethod || "-"}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatPrice(payment.amount, payment.currencyCode)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </>
            )}

            {/* Notlar */}
            {rental.notes && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="font-medium">Notlar</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {rental.notes}
                  </p>
                </div>
              </>
            )}

            {/* Ekler */}
            <Separator />
            <AttachmentSection
              entityType="Rental"
              entityId={rental.id}
              description="Sözleşme, teslim tutanağı, hasar fotoğrafları (jpg, png, webp, pdf — max 10 MB)"
            />

            <Separator />

            {/* Meta Bilgiler */}
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Oluşturulma: {formatDateTime(rental.createdDate)}
              </div>
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                Oluşturan: {rental.createdByUserName}
              </div>
            </div>
          </div>
        ) : (
          <DetailSheetEmptyState title="Kiralama Detayları" message="Kiralama bulunamadı" />
        )}
      </SheetContent>
      <RentalReturnDialog
        open={returnDialogOpen}
        onOpenChange={setReturnDialogOpen}
        rental={rental ?? null}
      />
    </Sheet>
  )
}
