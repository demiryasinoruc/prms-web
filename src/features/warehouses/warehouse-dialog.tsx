import { useForm } from "react-hook-form"
import { formResolver } from "@/lib/form-resolver"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { StatusSwitchField } from "@/components/shared/status-switch-field"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { FormField } from "@/components/shared/form-field"
import { useCreateWarehouse, useUpdateWarehouse, useWarehouseForEdit } from "./hooks"
import type { Warehouse } from "@/types/api"

const warehouseSchema = z.object({
  name: z.string().min(1, "Depo adı zorunludur").max(200, "Depo adı en fazla 200 karakter olabilir"),
  address: z.string().min(1, "Adres zorunludur").max(500, "Adres en fazla 500 karakter olabilir"),
  contactInfo: z.string().max(500, "İletişim bilgisi en fazla 500 karakter olabilir").optional().default(""),
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
    resolver: formResolver<WarehouseFormData>(warehouseSchema),
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
            <FormField
              label="Depo Adı *"
              placeholder="Ana Depo, Şube 1..."
              {...register("name")}
              error={errors.name?.message}
            />

            <FormField
              label="Adres"
              placeholder="Depo adresi..."
              multiline
              rows={3}
              {...register("address")}
            />

            <FormField
              label="İletişim Bilgisi"
              placeholder="Telefon, e-posta..."
              {...register("contactInfo")}
            />

            {warehouse && (
              <StatusSwitchField
                value={isActive}
                onChange={(checked) => setValue("isActive", checked)}
              />
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
