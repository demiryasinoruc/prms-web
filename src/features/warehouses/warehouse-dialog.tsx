import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useCreateWarehouse, useUpdateWarehouse, useWarehouseForEdit } from "./hooks"
import type { Warehouse } from "@/types/api"

const warehouseSchema = z.object({
  name: z.string().min(1, "Depo adı zorunlu"),
  address: z.string().optional().default(""),
  contactInfo: z.string().optional().default(""),
  isActive: z.boolean().default(true),
})

type WarehouseFormData = z.infer<typeof warehouseSchema>

interface WarehouseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  warehouse: Warehouse | null
}

const defaultValues: WarehouseFormData = {
  name: "",
  address: "",
  contactInfo: "",
  isActive: true,
}

export function WarehouseDialog({
  open,
  onOpenChange,
  warehouse,
}: WarehouseDialogProps) {
  const createWarehouse = useCreateWarehouse()
  const updateWarehouse = useUpdateWarehouse()

  const { data: warehouseData } = useWarehouseForEdit(warehouse?.id || "")
  const editWarehouse = warehouse ? warehouseData : null

  const formValues = (open && editWarehouse) ? {
    name: editWarehouse.name,
    address: editWarehouse.address || "",
    contactInfo: editWarehouse.contactInfo || "",
    isActive: editWarehouse.isActive,
  } : (open && warehouse) ? {
    name: warehouse.name,
    address: warehouse.address || "",
    contactInfo: warehouse.contactInfo || "",
    isActive: warehouse.isActive,
  } : defaultValues

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<WarehouseFormData>({
    resolver: zodResolver(warehouseSchema) as any,
    values: open ? formValues : defaultValues,
  })

  const isActive = watch("isActive")

  const onSubmit = async (data: WarehouseFormData) => {
    try {
      if (warehouse) {
        await updateWarehouse.mutateAsync({
          id: warehouse.id,
          data: {
            name: data.name,
            address: data.address || "",
            contactInfo: data.contactInfo || "",
            isActive: data.isActive,
          },
        })
      } else {
        await createWarehouse.mutateAsync({
          name: data.name,
          address: data.address || "",
          contactInfo: data.contactInfo || "",
          isActive: data.isActive,
        })
      }
      onOpenChange(false)
    } catch {
      // Error handled by mutation
    }
  }

  const isSubmitting = createWarehouse.isPending || updateWarehouse.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {warehouse ? "Depo Düzenle" : "Yeni Depo"}
          </DialogTitle>
          <DialogDescription>
            Depo bilgilerini girin
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Depo Adı *</Label>
              <Input placeholder="Ana Depo, Şube 1..." {...register("name")} />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Adres</Label>
              <Textarea
                placeholder="Depo adresi..."
                rows={3}
                {...register("address")}
              />
            </div>

            <div className="space-y-2">
              <Label>İletişim Bilgisi</Label>
              <Input
                placeholder="Telefon, e-posta..."
                {...register("contactInfo")}
              />
            </div>

            {warehouse && (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label className="cursor-pointer">Durum</Label>
                <Switch
                  checked={isActive}
                  onCheckedChange={(checked) => setValue("isActive", checked)}
                />
              </div>
            )}
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
              {warehouse ? "Güncelle" : "Kaydet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
