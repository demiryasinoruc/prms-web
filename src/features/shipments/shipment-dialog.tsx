import { useForm, Controller } from "react-hook-form"
import { formResolver } from "@/lib/form-resolver"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePicker } from "@/components/shared/date-picker"
import {
  useUpdateRentalShipment,
  useRentalShipmentForEdit,
  useRentalShipmentDetail,
  useVehicleSelectByWarehouse,
  useEmployeeSelectByWarehouse,
} from "./hooks"
import { ShipmentFulfillmentType } from "./api"

const shipmentSchema = z.object({
  vehicleId: z.string().nullable().default(null),
  employeeId: z.string().nullable().default(null),
  plannedDate: z.string().min(1, "Planlı tarih zorunludur"),
  notes: z.string().max(2000, "Not en fazla 2000 karakter olabilir").default(""),
})

type ShipmentFormData = z.infer<typeof shipmentSchema>

const defaultValues: ShipmentFormData = {
  vehicleId: null,
  employeeId: null,
  plannedDate: "",
  notes: "",
}

interface ShipmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editId?: string | null
}

export function ShipmentDialog({ open, onOpenChange, editId }: ShipmentDialogProps) {
  const updateShipment = useUpdateRentalShipment()
  const { data: editData, isLoading: isLoadingEdit } = useRentalShipmentForEdit(
    editId || null,
  )
  // Kaynak depo + sevkiyat tipi get-for-edit'te yok; filtre/gizleme için detaydan al.
  const { data: detail, isLoading: isLoadingDetail } = useRentalShipmentDetail(
    editId || null,
  )

  const sourceWarehouseId = detail?.sourceWarehouseId || null
  const isPickupEnRoute = detail?.fulfillmentType === ShipmentFulfillmentType.PickupEnRoute

  // Araç/personel yalnızca depodan gönderimde ve kaynak depoya filtreli getirilir
  const { data: vehicles } = useVehicleSelectByWarehouse(
    isPickupEnRoute ? null : sourceWarehouseId,
  )
  const { data: employees } = useEmployeeSelectByWarehouse(
    isPickupEnRoute ? null : sourceWarehouseId,
  )

  const formValues: ShipmentFormData =
    open && editData
      ? {
          vehicleId: editData.vehicleId,
          employeeId: editData.employeeId,
          plannedDate: editData.plannedDate ? editData.plannedDate.split("T")[0] : "",
          notes: editData.notes || "",
        }
      : defaultValues

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ShipmentFormData>({
    resolver: formResolver<ShipmentFormData>(shipmentSchema),
    values: open ? formValues : defaultValues,
  })

  const onSubmit = async (data: ShipmentFormData) => {
    if (!editId) return
    try {
      await updateShipment.mutateAsync({
        id: editId,
        data: {
          vehicleId: isPickupEnRoute ? null : data.vehicleId,
          employeeId: isPickupEnRoute ? null : data.employeeId,
          plannedDate: `${data.plannedDate}T00:00:00`,
          notes: data.notes,
        },
      })
      onOpenChange(false)
    } catch {
      // Hata mutation tarafından ele alınıyor
    }
  }

  const isLoading = isLoadingEdit || isLoadingDetail
  const isSubmitting = updateShipment.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {/* KURAL 4: DialogTitle her zaman render edilmeli */}
        <DialogHeader>
          <DialogTitle>Sevkiyat Düzenle</DialogTitle>
          <DialogDescription>
            Planlı sevkiyatın araç, personel, tarih ve notlarını güncelleyin
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Planlı Tarih *</Label>
              <Controller
                control={control}
                name="plannedDate"
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Sevkiyat tarihi seçiniz"
                  />
                )}
              />
              {errors.plannedDate && (
                <p className="text-sm text-destructive">{errors.plannedDate.message}</p>
              )}
            </div>

            {/* Araç/personel yalnızca depodan gönderimde gösterilir (PickupEnRoute'ta gizli) */}
            {!isPickupEnRoute && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Araç</Label>
                  <Controller
                    control={control}
                    name="vehicleId"
                    render={({ field }) => (
                      <Select
                        key={`veh-${field.value}`}
                        value={field.value || "none"}
                        onValueChange={(v) => field.onChange(v === "none" ? null : v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Araç seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Araç seçilmedi</SelectItem>
                          {vehicles?.map((vehicle) => (
                            <SelectItem key={vehicle.id} value={vehicle.id}>
                              {vehicle.plate}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Personel</Label>
                  <Controller
                    control={control}
                    name="employeeId"
                    render={({ field }) => (
                      <Select
                        key={`emp-${field.value}`}
                        value={field.value || "none"}
                        onValueChange={(v) => field.onChange(v === "none" ? null : v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Personel seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Personel seçilmedi</SelectItem>
                          {employees?.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id}>
                              {employee.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Notlar</Label>
              <Textarea
                placeholder="Sevkiyat ile ilgili notlar..."
                rows={3}
                {...register("notes")}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                İptal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Güncelle
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
