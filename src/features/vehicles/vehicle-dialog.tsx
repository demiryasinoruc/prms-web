import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useCreateVehicle, useUpdateVehicle, useVehicleForEdit } from "./hooks"
import { useWarehouseSelect } from "@/features/warehouses/hooks"
import { VehicleType, VehicleStatus, type Vehicle } from "@/types/api"

const vehicleSchema = z.object({
  vehicleType: z.number(),
  status: z.number().optional().default(VehicleStatus.Available),
  brandName: z.string().min(1, "Marka zorunlu"),
  model: z.string().min(1, "Model zorunlu"),
  year: z.number().min(1900, "Geçerli bir yıl giriniz").max(2100, "Geçerli bir yıl giriniz"),
  plate: z.string().min(1, "Plaka zorunlu"),
  color: z.string().optional().default(""),
  capacity: z.number().optional().default(0),
  capacityUnit: z.string().optional().default(""),
  warehouseId: z.string().min(1, "Depo seçimi zorunlu"),
  notes: z.string().optional().default(""),
})

type VehicleFormData = z.infer<typeof vehicleSchema>

interface VehicleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicle: Vehicle | null
}

export function VehicleDialog({
  open,
  onOpenChange,
  vehicle,
}: VehicleDialogProps) {
  const createVehicle = useCreateVehicle()
  const updateVehicle = useUpdateVehicle()
  const { data: warehouses } = useWarehouseSelect()

  const { data: vehicleData } = useVehicleForEdit(vehicle?.id || "")
  const editVehicle = vehicle ? vehicleData : null

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema) as any,
    defaultValues: {
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
    },
  })

  const defaultValues = {
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
  }

  useEffect(() => {
    if (!open) {
      reset(defaultValues)
      return
    }

    // editVehicle varsa (API'den detay geldi), onu kullan
    if (editVehicle) {
      reset({
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
      })
    } else if (vehicle) {
      // editVehicle henüz yüklenmediyse, listeden gelen vehicle verisini kullan
      reset({
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
      })
    } else {
      reset(defaultValues)
    }
  }, [open, editVehicle, vehicle, reset])

  const onSubmit = async (data: VehicleFormData) => {
    try {
      if (vehicle) {
        await updateVehicle.mutateAsync({
          id: vehicle.id,
          data: { ...data, id: vehicle.id },
        })
      } else {
        await createVehicle.mutateAsync(data)
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Araç Tipi *</Label>
              <Controller
                control={control}
                name="vehicleType"
                render={({ field }) => (
                  <Select
                    value={String(field.value)}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Kamyon</SelectItem>
                      <SelectItem value="2">Kamyonet</SelectItem>
                      <SelectItem value="3">Minibüs</SelectItem>
                      <SelectItem value="4">Binek</SelectItem>
                      <SelectItem value="5">Diğer</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Plaka *</Label>
              <Input placeholder="34 ABC 123" {...register("plate")} />
              {errors.plate && (
                <p className="text-sm text-destructive">{errors.plate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Marka *</Label>
              <Input placeholder="Ford, Mercedes..." {...register("brandName")} />
              {errors.brandName && (
                <p className="text-sm text-destructive">{errors.brandName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Model *</Label>
              <Input placeholder="Transit, Sprinter..." {...register("model")} />
              {errors.model && (
                <p className="text-sm text-destructive">{errors.model.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Yıl *</Label>
              <Input
                type="number"
                placeholder="2024"
                {...register("year", { valueAsNumber: true })}
              />
              {errors.year && (
                <p className="text-sm text-destructive">{errors.year.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Renk</Label>
              <Input placeholder="Beyaz, Siyah..." {...register("color")} />
            </div>

            <div className="space-y-2">
              <Label>Kapasite</Label>
              <Input
                type="number"
                placeholder="1000"
                {...register("capacity", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label>Kapasite Birimi</Label>
              <Controller
                control={control}
                name="capacityUnit"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="m³">m³</SelectItem>
                      <SelectItem value="adet">adet</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Depo *</Label>
              <Controller
                control={control}
                name="warehouseId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Depo seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses?.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.warehouseId && (
                <p className="text-sm text-destructive">{errors.warehouseId.message}</p>
              )}
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Notlar</Label>
              <Textarea placeholder="Ek notlar..." {...register("notes")} rows={3} />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Durum *</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select
                    value={String(field.value)}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Müsait</SelectItem>
                      <SelectItem value="2">Teslimat'ta</SelectItem>
                      <SelectItem value="3">Bakımda</SelectItem>
                      <SelectItem value="4">Arızalı</SelectItem>
                    </SelectContent>
                  </Select>
                )}
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
