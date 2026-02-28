import { useForm } from "react-hook-form"
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
import { FormField } from "@/components/shared/form-field"
import { useCreateBrand, useUpdateBrand, useBrandForEdit } from "./hooks"
import type { Brand } from "./api"

const brandSchema = z.object({
  name: z.string().min(1, "Marka adı zorunlu"),
})

type BrandFormData = z.infer<typeof brandSchema>

interface BrandDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  brand: Brand | null
}

const defaultValues: BrandFormData = {
  name: "",
}

export function BrandDialog({
  open,
  onOpenChange,
  brand,
}: BrandDialogProps) {
  const createBrand = useCreateBrand()
  const updateBrand = useUpdateBrand()

  const { data: brandData } = useBrandForEdit(brand?.id || "")
  const editBrand = brand ? brandData : null

  const formValues: BrandFormData = (open && editBrand) ? {
    name: editBrand.name,
  } : (open && brand) ? {
    name: brand.name,
  } : defaultValues

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BrandFormData>({
    resolver: formResolver<BrandFormData>(brandSchema),
    values: open ? formValues : defaultValues,
  })

  const onSubmit = async (data: BrandFormData) => {
    try {
      if (brand) {
        await updateBrand.mutateAsync({
          id: brand.id,
          data: { id: brand.id, name: data.name },
        })
      } else {
        await createBrand.mutateAsync(data)
      }
      onOpenChange(false)
    } catch {
      // Error handled by mutation
    }
  }

  const isSubmitting = createBrand.isPending || updateBrand.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {brand ? "Marka Düzenle" : "Yeni Marka"}
          </DialogTitle>
          <DialogDescription>
            Marka bilgilerini girin
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label="Marka Adı *"
            placeholder="Marka adı"
            {...register("name")}
            autoFocus
            error={errors.name?.message}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {brand ? "Güncelle" : "Kaydet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
