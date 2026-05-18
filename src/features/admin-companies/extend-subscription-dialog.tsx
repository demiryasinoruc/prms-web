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
import { DatePicker } from "@/components/shared/date-picker"
import { useExtendSubscription } from "./hooks"

const schema = z.object({
  newEndDate: z.string().min(1, "Yeni bitiş tarihi zorunlu"),
})

type FormData = z.infer<typeof schema>

interface ExtendSubscriptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyId: string
  companyName: string
  currentEndDate: string | null
}

export function ExtendSubscriptionDialog({
  open,
  onOpenChange,
  companyId,
  companyName,
  currentEndDate,
}: ExtendSubscriptionDialogProps) {
  const extend = useExtendSubscription()

  const defaultValues: FormData = { newEndDate: "" }

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
      await extend.mutateAsync({
        companyId,
        data: { newEndDate: data.newEndDate },
      })
      onOpenChange(false)
    } catch {
      // Error handled by interceptor
    }
  }

  const formatDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString("tr-TR") : "—"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Aboneliği Uzat</DialogTitle>
          <DialogDescription>
            <span className="font-medium">{companyName}</span> firmasının en son aboneliğinin bitiş tarihini ileri al. Mevcut bitiş: <span className="font-medium">{formatDate(currentEndDate)}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Yeni Bitiş Tarihi *</Label>
            <Controller
              control={control}
              name="newEndDate"
              render={({ field }) => (
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Yeni bitiş tarihi seçiniz"
                />
              )}
            />
            {errors.newEndDate?.message && (
              <p className="text-sm text-destructive">{errors.newEndDate.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={extend.isPending}>
              {extend.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Uzat
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
