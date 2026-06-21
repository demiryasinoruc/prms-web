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
import { Separator } from "@/components/ui/separator"
import { FormField } from "@/components/shared/form-field"
import { FormSelectField } from "@/components/shared/form-select-field"
import { LimitWarningAlert } from "@/components/shared/limit-warning-alert"
import { DatePicker } from "@/components/shared/date-picker"
import { useCreateVehicle, useUpdateVehicle, useVehicleForEdit } from "./hooks"
import { WarehouseSelect } from "@/components/shared/warehouse-select"
import { VehicleType, VehicleStatus, type Vehicle } from "@/types/api"

const vehicleSchema = z.object({
  vehicleType: z.number(),
  status: z.number().optional().default(VehicleStatus.Available),
  brandName: z.string().min(1, "Marka adı zorunludur").max(200, "Marka adı en fazla 200 karakter olabilir"),
  model: z.string().min(1, "Model zorunludur").max(200, "Model en fazla 200 karakter olabilir"),
  year: z.number().gt(1900, "Yıl 1900'den büyük olmalıdır").max(2100, "Geçerli bir yıl giriniz"),
  plate: z.string().min(1, "Plaka zorunludur").max(20, "Plaka en fazla 20 karakter olabilir"),
  color: z.string().min(1, "Renk zorunludur").max(50, "Renk en fazla 50 karakter olabilir"),
  capacity: z.number().gt(0, "Kapasite 0'dan büyük olmalıdır"),
  capacityUnit: z.string().min(1, "Kapasite birimi zorunludur").max(50, "Kapasite birimi en fazla 50 karakter olabilir"),
  warehouseId: z.string().min(1, "Depo seçimi zorunlu"),
  notes: z.string().max(2000, "Not en fazla 2000 karakter olabilir").optional().default(""),
  inspectionDate: z.string().optional().default(""),
  insuranceDate: z.string().optional().default(""),
})

type VehicleFormData = z.infer<typeof vehicleSchema>

interface VehicleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicle: Vehicle | null
}

const defaultValues: VehicleFormData = {
  vehicleType: VehicleType.Truck,
  status: VehicleStatus.Available,
  brandName: "",
  model: "",
  year: new Date().getFullYear(),
  plate: "",
  color: "",
  capacity: 0,
  capacityUnit: "kg",
  warehouseId: "",
  notes: "",
  inspectionDate: "",
  insuranceDate: "",
}

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return ""
  return iso.substring(0, 10)
}

export function VehicleDialog({
  open,
  onOpenChange,
  vehicle,
}: VehicleDialogProps) {
  const createVehicle = useCreateVehicle()
  const updateVehicle = useUpdateVehicle()

  const { data: vehicleData } = useVehicleForEdit(vehicle?.id || "")
  const editVehicle = vehicle ? vehicleData : null

  const formValues: VehicleFormData = (open && editVehicle) ? {
    vehicleType: editVehicle.vehicleType,
    status: editVehicle.status || VehicleStatus.Available,
    brandName: editVehicle.brandName,
    model: editVehicle.model,
    year: editVehicle.year || new Date().getFullYear(),
    plate: editVehicle.plate,
    color: editVehicle.color || "",
    capacity: editVehicle.capacity || 0,
    capacityUnit: editVehicle.capacityUnit || "kg",
    warehouseId: editVehicle.warehouseId || "",
    notes: editVehicle.notes || "",
    inspectionDate: toDateInputValue(editVehicle.inspectionDate),
    insuranceDate: toDateInputValue(editVehicle.insuranceDate),
  } : (open && vehicle) ? {
    vehicleType: vehicle.vehicleType,
    status: vehicle.status || VehicleStatus.Available,
    brandName: vehicle.brandName,
    model: vehicle.model,
    year: vehicle.year || new Date().getFullYear(),
    plate: vehicle.plate,
    color: vehicle.color || "",
    capacity: vehicle.capacity || 0,
    capacityUnit: vehicle.capacityUnit || "kg",
    warehouseId: vehicle.warehouseId || "",
    notes: vehicle.notes || "",
    inspectionDate: toDateInputValue(vehicle.inspectionDate),
    insuranceDate: toDateInputValue(vehicle.insuranceDate),
  } : defaultValues

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<VehicleFormData>({
    resolver: formResolver<VehicleFormData>(vehicleSchema),
    defaultValues,
    values: open ? formValues : defaultValues,
  })

  const onSubmit = async (data: VehicleFormData) => {
    try {
      const payload = {
        ...data,
        inspectionDate: data.inspectionDate || null,
        insuranceDate: data.insuranceDate || null,
      }
      if (vehicle) {
        await updateVehicle.mutateAsync({
          id: vehicle.id,
          data: { ...payload, id: vehicle.id },
        })
      } else {
        await createVehicle.mutateAsync(payload)
      }
      onOpenChange(false)
    } catch {
      // Error handled by mutation
    }
  }

  const isSubmitting = createVehicle.isPending || updateVehicle.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {vehicle ? "Araç Düzenle" : "Yeni Araç"}
          </DialogTitle>
          <DialogDescription>
            Araç bilgilerini girin
          </DialogDescription>
        </DialogHeader>

        {!vehicle && <LimitWarningAlert limitType="Vehicle" className="mb-4" />}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormSelectField
              label="Araç Tipi *"
              name="vehicleType"
              control={control}
              valueType="number"
              options={[
                { value: "1", label: "Kamyon" },
                { value: "2", label: "Kamyonet" },
                { value: "3", label: "Minibüs" },
                { value: "4", label: "Binek" },
                { value: "5", label: "Diğer" },
              ]}
            />

            <FormField
              label="Plaka *"
              placeholder="34 ABC 123"
              {...register("plate")}
              error={errors.plate?.message}
            />

            <FormField
              label="Marka *"
              placeholder="Ford, Mercedes..."
              {...register("brandName")}
              error={errors.brandName?.message}
            />

            <FormField
              label="Model *"
              placeholder="Transit, Sprinter..."
              {...register("model")}
              error={errors.model?.message}
            />

            <FormField
              label="Yıl *"
              type="number"
              placeholder="2024"
              {...register("year", { valueAsNumber: true })}
              error={errors.year?.message}
            />

            <FormField
              label="Renk"
              placeholder="Beyaz, Siyah..."
              {...register("color")}
            />

            <FormField
              label="Kapasite"
              type="number"
              placeholder="1000"
              {...register("capacity", { valueAsNumber: true })}
            />

            <FormSelectField
              label="Kapasite Birimi"
              name="capacityUnit"
              control={control}
              options={[
                { value: "kg", label: "kg" },
                { value: "m³", label: "m³" },
                { value: "adet", label: "adet" },
              ]}
            />

            <div className="col-span-2">
              <Controller
                control={control}
                name="warehouseId"
                render={({ field }) => (
                  <WarehouseSelect
                    value={field.value}
                    onChange={(v) => field.onChange(v || "")}
                    label="Depo *"
                    required
                    error={errors.warehouseId?.message}
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Muayene Tarihi</Label>
              <Controller
                control={control}
                name="inspectionDate"
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Muayene tarihi seçiniz"
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Sigorta Tarihi</Label>
              <Controller
                control={control}
                name="insuranceDate"
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Sigorta tarihi seçiniz"
                  />
                )}
              />
            </div>

            <div className="col-span-2">
              <FormField
                label="Notlar"
                placeholder="Ek notlar..."
                {...register("notes")}
                multiline
                rows={3}
              />
            </div>

            <div className="col-span-2">
              <FormSelectField
                label="Durum *"
                name="status"
                control={control}
                valueType="number"
                options={[
                  { value: "1", label: "Müsait" },
                  { value: "3", label: "Bakımda" },
                  { value: "4", label: "Arızalı" },
                ]}
              />
            </div>
          </div>

          <Separator />

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {vehicle ? "Güncelle" : "Kaydet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
