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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { StatusSwitchField } from "@/components/shared/status-switch-field"
import { useCreateCertificate, useUpdateCertificate } from "./hooks"
import type { Certificate } from "./api"

const certificateSchema = z.object({
  name: z.string().min(1, "Sertifika adı zorunlu"),
  description: z.string().min(1, "Açıklama zorunlu"),
  isActive: z.boolean(),
})

type CertificateFormData = z.infer<typeof certificateSchema>

interface CertificateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  certificate: Certificate | null
}

const defaultValues: CertificateFormData = {
  name: "",
  description: "",
  isActive: true,
}

export function CertificateDialog({
  open,
  onOpenChange,
  certificate,
}: CertificateDialogProps) {
  const createCertificate = useCreateCertificate()
  const updateCertificate = useUpdateCertificate()

  const formValues: CertificateFormData = (open && certificate) ? {
    name: certificate.name,
    description: certificate.description,
    isActive: certificate.isActive,
  } : defaultValues

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CertificateFormData>({
    resolver: formResolver<CertificateFormData>(certificateSchema),
    values: open ? formValues : defaultValues,
  })

  const isActive = watch("isActive")

  const onSubmit = async (data: CertificateFormData) => {
    try {
      if (certificate) {
        await updateCertificate.mutateAsync({
          id: certificate.id,
          data: {
            name: data.name,
            description: data.description,
            isActive: data.isActive,
          },
        })
      } else {
        await createCertificate.mutateAsync({
          name: data.name,
          description: data.description,
        })
      }
      onOpenChange(false)
    } catch {
      // Error handled by mutation
    }
  }

  const isSubmitting = createCertificate.isPending || updateCertificate.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {certificate ? "Sertifika Düzenle" : "Yeni Sertifika"}
          </DialogTitle>
          <DialogDescription>
            Sertifika bilgilerini girin
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Sertifika Adı *</Label>
            <Input
              placeholder="Sertifika adı"
              {...register("name")}
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Açıklama *</Label>
            <Textarea
              placeholder="Sertifika açıklaması"
              {...register("description")}
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {certificate && (
            <StatusSwitchField
              value={isActive}
              onChange={(checked) => setValue("isActive", checked)}
              label="Aktif"
              description="Sertifika seçimlerde görünsün"
            />
          )}

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
              {certificate ? "Güncelle" : "Kaydet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
