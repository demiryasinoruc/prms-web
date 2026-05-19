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
import { useCertificateSelect } from "@/features/certificates/hooks"
import { useAddEmployeeCertificate } from "./hooks"
import { toast } from "sonner"

const schema = z.object({
  certificateId: z.string().min(1, "Sertifika seçiniz"),
  expiryDate: z.string().nullable().optional(),
  notes: z
    .string()
    .max(500, "Not en fazla 500 karakter olabilir")
    .nullable()
    .optional()
    .default(""),
})

type FormData = z.infer<typeof schema>

interface EmployeeCertificateAddDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employeeId: string
  excludeCertificateIds?: string[]
}

export function EmployeeCertificateAddDialog({
  open,
  onOpenChange,
  employeeId,
  excludeCertificateIds = [],
}: EmployeeCertificateAddDialogProps) {
  const { data: certificates } = useCertificateSelect()
  const addMutation = useAddEmployeeCertificate()

  const defaultValues: FormData = {
    certificateId: "",
    expiryDate: null,
    notes: "",
  }

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: formResolver<FormData>(schema),
    values: open ? defaultValues : defaultValues,
  })

  const onSubmit = async (data: FormData) => {
    try {
      await addMutation.mutateAsync({
        employeeId,
        certificateId: data.certificateId,
        expiryDate: data.expiryDate || null,
        notes: data.notes || "",
      })
      toast.success("Sertifika başarıyla atandı")
      onOpenChange(false)
    } catch {
      // axios interceptor will toast
    }
  }

  const availableCertificates = (certificates || []).filter(
    (c) => !excludeCertificateIds.includes(c.id),
  )

  const isSubmitting = addMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sertifika Ata</DialogTitle>
          <DialogDescription>Çalışana yeni sertifika ataması ekleyin</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Sertifika *</Label>
            <Controller
              control={control}
              name="certificateId"
              render={({ field }) => (
                <Select
                  key={`cert-${field.value}`}
                  value={field.value || "none"}
                  onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sertifika seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCertificates.length === 0 && (
                      <SelectItem value="none" disabled>
                        Atanabilir sertifika yok
                      </SelectItem>
                    )}
                    {availableCertificates.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.certificateId && (
              <p className="text-sm text-destructive">{errors.certificateId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Geçerlilik Sonu</Label>
            <Controller
              control={control}
              name="expiryDate"
              render={({ field }) => (
                <DatePicker
                  value={field.value || ""}
                  onChange={(v) => field.onChange(v || null)}
                  placeholder="Geçerlilik tarihi seçiniz (opsiyonel)"
                />
              )}
            />
            <p className="text-xs text-muted-foreground">
              Boş bırakılırsa süresiz olarak değerlendirilir
            </p>
          </div>

          <div className="space-y-2">
            <Label>Not</Label>
            <Textarea
              placeholder="Sertifika numarası, veren kurum vb."
              rows={3}
              {...register("notes")}
            />
            {errors.notes && (
              <p className="text-sm text-destructive">{errors.notes.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Kaydet
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
